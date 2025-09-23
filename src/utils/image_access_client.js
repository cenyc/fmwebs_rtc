/**
 * 内部机图像访问客户端
 * 支持局域网直连和WebRTC远程访问，自动选择最优路径
 *
 * 使用示例：
 * const client = new ImageAccessClient({
 *     INTERNAL_IP: '172.31.144.1',
 *     INTERNAL_PORT: 5002,
 *     API_KEY: 'your-api-key',
 *     SIGNALING_URL: 'ws://120.55.85.213:8081',
 *     AUTH_URL: 'http://120.55.85.213:8081'
 * });
 *
 * const result = await client.fetchImage('file-id-here');
 * document.getElementById('img').src = result.objectUrl;
 */

class ImageAccessClient {
    constructor(config = {}) {
        this.config = {
            SIGNALING_URL: config.SIGNALING_URL || 'ws://120.55.85.213:8081',
            AUTH_URL: config.AUTH_URL || 'http://120.55.85.213:8081',
            API_KEY: config.API_KEY || '',
            CLIENT_ID: config.CLIENT_ID || null,
            INTERNAL_IP: config.INTERNAL_IP || '172.31.144.1',
            INTERNAL_PORT: config.INTERNAL_PORT || 5002,
            IMAGE_ENDPOINT: config.IMAGE_ENDPOINT || '/api/images/',
            REMOTE_TARGET_ID: config.REMOTE_TARGET_ID || null,
            LAN_TIMEOUT_MS: config.LAN_TIMEOUT_MS || 3500,
            LOG_ENABLED: config.LOG_ENABLED !== false, // 默认启用日志
            LOG_CALLBACK: config.LOG_CALLBACK || null // 自定义日志回调
        };

        this.remoteClient = null;
        this.activeObjectUrl = null;
        this.networkMode = null; // 'lan' | 'remote' | null
        this.isNetworkChecked = false;
        this._initChunker();
    }

    _initChunker() {
        // 检查是否已加载 WebRTCChunker
        if (typeof globalThis === 'undefined' || typeof globalThis.WebRTCChunker === 'undefined') {
            console.warn('WebRTCChunker not found. Please include webrtc_chunker.js before this script.');
        }
    }

    _log(message, level = 'info') {
        if (!this.config.LOG_ENABLED) return;

        if (this.config.LOG_CALLBACK) {
            this.config.LOG_CALLBACK(message, level);
        } else {
            const time = new Date().toLocaleTimeString();
            const prefix = `[${time}] [ImageClient]`;
            switch (level) {
                case 'error':
                    console.error(prefix, message);
                    break;
                case 'warning':
                    console.warn(prefix, message);
                    break;
                case 'success':
                case 'info':
                default:
                    console.log(prefix, message);
                    break;
            }
        }
    }

    /**
     * 检测网络模式（在批量传输前调用）
     * @returns {Promise<string>} 返回 'lan' 或 'remote'
     */
    async detectNetworkMode() {
        if (this.isNetworkChecked) {
            this._log(`使用缓存的网络模式: ${this.networkMode}`, 'info');
            return this.networkMode;
        }

        this._log('开始检测网络环境...', 'info');

        // 尝试局域网连接检测
        const lanResult = await this._tryDetectLan();

        if (lanResult.success) {
            this.networkMode = 'lan';
            this._log('检测到局域网环境，将使用局域网传输', 'success');
        } else {
            this.networkMode = 'remote';
            this._log(`局域网不可达: ${lanResult.errorMessage}，将使用WebRTC传输`, 'warning');
        }

        this.isNetworkChecked = true;
        return this.networkMode;
    }

    /**
     * 重置网络检测状态（网络环境可能变化时调用）
     */
    resetNetworkDetection() {
        this.isNetworkChecked = false;
        this.networkMode = null;
        this._log('网络检测状态已重置', 'info');
    }

    /**
     * 预建立WebRTC连接（在页面初始化时调用）
     * @returns {Promise<boolean>} 连接是否成功建立
     */
    async preEstablishWebRTCConnection() {
        if (this.networkMode !== 'remote') {
            this._log('当前为局域网模式，无需建立WebRTC连接', 'info');
            return true;
        }

        if (!this.config.API_KEY) {
            this._log('未配置API Key，无法建立WebRTC连接', 'warning');
            return false;
        }

        try {
            this._log('开始建立WebRTC连接...', 'info');

            // 创建远程客户端
            if (!this.remoteClient) {
                this.remoteClient = new RemoteAccessClient(this.config, this._log.bind(this));
            }

            // 建立WebRTC连接
            await this.remoteClient.connect();

            // 验证连接状态
            if (this.remoteClient.isConnected()) {
                this._log('WebRTC连接建立成功，数据通道已就绪', 'success');
                return true;
            } else {
                this._log('WebRTC连接建立失败', 'error');
                return false;
            }

        } catch (error) {
            this._log(`WebRTC连接建立失败: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 检查WebRTC连接状态
     */
    isWebRTCReady() {
        return this.remoteClient && this.remoteClient.isConnected();
    }

    /**
     * 检测局域网连通性（仅检测，不获取图像）
     * @private
     */
    async _tryDetectLan() {
        if (!this.config.INTERNAL_IP) {
            return { success: false, errorMessage: '未配置内部机地址' };
        }

        const host = this.config.INTERNAL_PORT ?
            `${this.config.INTERNAL_IP}:${this.config.INTERNAL_PORT}` :
            this.config.INTERNAL_IP;

        const statusUrl = `http://${host}/api/status`;

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.config.LAN_TIMEOUT_MS);

            const response = await fetch(statusUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timer);

            if (!response.ok) {
                return {
                    success: false,
                    errorMessage: `局域网服务器不可达: HTTP ${response.status}`
                };
            }

            // 验证状态响应
            try {
                const statusData = await response.json();
                if (!statusData.success || statusData.status !== 'running') {
                    return {
                        success: false,
                        errorMessage: '局域网服务器状态异常'
                    };
                }
                this._log(`局域网服务器正常，图片数量: ${statusData.images_count || 0}`, 'info');
                return { success: true };
            } catch {
                // 即使解析失败，但响应OK，认为服务器可达
                this._log('状态响应解析失败，但服务器可达', 'warning');
                return { success: true };
            }

        } catch (error) {
            let errorMessage = '连接失败';
            if (error.name === 'AbortError') {
                errorMessage = '连接超时';
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                errorMessage
            };
        }
    }

    /**
     * 获取图像，自动选择最优路径（局域网优先）
     * @param {string} fileId - 图像文件ID（UUID格式，不带扩展名）
     * @returns {Promise<Object>} 返回包含图像信息的对象
     */
    async fetchImage(fileId) {
        if (!fileId) {
            throw new Error('请提供图片的 File ID');
        }

        // 清理之前的对象URL
        if (this.activeObjectUrl) {
            URL.revokeObjectURL(this.activeObjectUrl);
            this.activeObjectUrl = null;
        }

        // 如果还未检测网络模式，先进行检测
        if (!this.isNetworkChecked) {
            await this.detectNetworkMode();
        }

        this._log(`开始获取图像: ${fileId} (使用${this.networkMode === 'lan' ? '局域网' : 'WebRTC'}传输)`);

        if (this.networkMode === 'lan') {
            // 使用局域网传输
            return await this._fetchImageFromLan(fileId);
        } else {
            // 使用WebRTC传输
            return await this._fetchImageFromRemote(fileId);
        }
    }

    /**
     * 直接从局域网获取图像（不做连通性检测）
     * @private
     */
    async _fetchImageFromLan(fileId) {
        const host = this.config.INTERNAL_PORT ?
            `${this.config.INTERNAL_IP}:${this.config.INTERNAL_PORT}` :
            this.config.INTERNAL_IP;

        const imageUrl = `http://${host}${this.config.IMAGE_ENDPOINT}?path=${encodeURIComponent(fileId)}`;

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.config.LAN_TIMEOUT_MS);

            const response = await fetch(imageUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`图片获取失败: HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            this.activeObjectUrl = objectUrl;

            this._log('成功通过局域网获取图像', 'success');

            return {
                source: 'lan',
                blob,
                objectUrl,
                contentType: response.headers.get('content-type') || 'image/jpeg',
                size: blob.size,
                url: imageUrl
            };

        } catch (error) {
            let errorMessage = '获取失败';
            if (error.name === 'AbortError') {
                errorMessage = '请求超时';
            } else if (error.message) {
                errorMessage = error.message;
            }

            this._log(`局域网图像获取失败: ${errorMessage}`, 'error');
            throw new Error(`局域网图像获取失败: ${errorMessage}`);
        }
    }

    /**
     * 直接从WebRTC获取图像
     * @private
     */
    async _fetchImageFromRemote(fileId) {
        if (!this.config.API_KEY) {
            throw new Error('未配置 API Key，无法进行远程访问');
        }


        if (!this.remoteClient) {
            this.remoteClient = new RemoteAccessClient(this.config, this._log.bind(this));
        }

        this._log('通过 WebRTC 获取图像...', 'info');
        const remoteResult = await this.remoteClient.fetchImage(fileId);
        this._log('成功通过 WebRTC 获取远程图像', 'success');

        const objectUrl = URL.createObjectURL(remoteResult.blob);
        this.activeObjectUrl = objectUrl;

        return {
            source: 'remote',
            blob: remoteResult.blob,
            objectUrl,
            contentType: remoteResult.contentType,
            size: remoteResult.size,
            url: null
        };
    }

    /**
     * 尝试从局域网获取图像
     * @private
     */
    async _tryFetchFromLan(fileId) {
        if (!this.config.INTERNAL_IP) {
            return { success: false, errorMessage: '未配置内部机地址' };
        }

        const host = this.config.INTERNAL_PORT ?
            `${this.config.INTERNAL_IP}:${this.config.INTERNAL_PORT}` :
            this.config.INTERNAL_IP;

        // 首先检测局域网连通性
        const statusUrl = `http://${host}/api/status`;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.config.LAN_TIMEOUT_MS);

            // 检测服务器状态
            const statusResponse = await fetch(statusUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timer);

            if (!statusResponse.ok) {
                return {
                    success: false,
                    errorMessage: `局域网服务器不可达: HTTP ${statusResponse.status}`
                };
            }

            // 验证状态响应
            try {
                const statusData = await statusResponse.json();
                if (!statusData.success || statusData.status !== 'running') {
                    return {
                        success: false,
                        errorMessage: '局域网服务器状态异常'
                    };
                }
                this._log(`局域网服务器正常，图片数量: ${statusData.images_count || 0}`, 'info');
            } catch {
                this._log('状态响应解析失败，但服务器可达', 'warning');
            }

            // 获取图片
            const imageUrl = `http://${host}${this.config.IMAGE_ENDPOINT}?path=${encodeURIComponent(fileId)}`;
            const imageController = new AbortController();
            const imageTimer = setTimeout(() => imageController.abort(), this.config.LAN_TIMEOUT_MS);

            const imageResponse = await fetch(imageUrl, {
                signal: imageController.signal,
                cache: 'no-store'
            });
            clearTimeout(imageTimer);

            if (!imageResponse.ok) {
                return {
                    success: false,
                    errorMessage: `图片获取失败: HTTP ${imageResponse.status}`
                };
            }

            const blob = await imageResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            return {
                success: true,
                blob,
                objectUrl,
                contentType: imageResponse.headers.get('Content-Type') || 'image/jpeg',
                size: blob.size,
                url: imageUrl
            };
        } catch (error) {
            const message = error.name === 'AbortError' ?
                '局域网请求超时' :
                `局域网请求异常: ${error.message}`;
            this._log(message, 'warning');
            return { success: false, errorMessage: message };
        }
    }

    /**
     * 检查局域网连通性
     * @returns {Promise<boolean>} 是否可以访问局域网
     */
    async checkLanConnectivity() {
        if (!this.config.INTERNAL_IP) {
            return false;
        }

        const host = this.config.INTERNAL_PORT ?
            `${this.config.INTERNAL_IP}:${this.config.INTERNAL_PORT}` :
            this.config.INTERNAL_IP;

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.config.LAN_TIMEOUT_MS);

            const response = await fetch(`http://${host}/api/status`, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timer);

            if (response.ok) {
                const data = await response.json();
                return data.success && data.status === 'running';
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * 获取服务器状态信息
     * @returns {Promise<Object>} 服务器状态信息
     */
    async getServerStatus() {
        const lanAvailable = await this.checkLanConnectivity();

        const status = {
            lan: {
                available: lanAvailable,
                host: this.config.INTERNAL_IP,
                port: this.config.INTERNAL_PORT
            },
            remote: {
                configured: !!this.config.API_KEY,
                signalingUrl: this.config.SIGNALING_URL,
                authUrl: this.config.AUTH_URL
            }
        };

        return status;
    }

    /**
     * 格式化字节大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小字符串
     */
    static formatBytes(bytes) {
        if (bytes === undefined || bytes === null || isNaN(bytes)) {
            return '未知';
        }
        if (bytes === 0) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, index);
        return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    }

    /**
     * 手动清理远程连接（用于批量操作完成后）
     */
    cleanupRemoteConnection() {
        if (this.remoteClient) {
            this._log('手动清理WebRTC连接', 'info');
            this.remoteClient.close();
            this.remoteClient = null;
        }
    }

    /**
     * 获取当前网络模式
     */
    getNetworkMode() {
        return this.networkMode;
    }

    /**
     * 带重试的图像获取
     * @param {string} fileId - 图像文件ID
     * @param {number} maxRetries - 最大重试次数，默认1次
     */
    async fetchImageWithRetry(fileId, maxRetries = 1) {
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this._log(`第${attempt + 1}次尝试获取图像: ${fileId}`, 'info');
                    // 重试前重置网络检测，可能网络状况已变化
                    if (attempt === 1) {
                        this.resetNetworkDetection();
                    }
                }

                return await this.fetchImage(fileId);

            } catch (error) {
                lastError = error;
                this._log(`图像获取失败(尝试${attempt + 1}/${maxRetries + 1}): ${error.message}`, 'warning');

                if (attempt < maxRetries) {
                    // 重试前等待一段时间
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        throw lastError;
    }

    /**
     * 清理资源
     */
    close() {
        if (this.activeObjectUrl) {
            URL.revokeObjectURL(this.activeObjectUrl);
            this.activeObjectUrl = null;
        }
        if (this.remoteClient) {
            this.remoteClient.close();
            this.remoteClient = null;
        }
    }
}

// 工具函数
function base64ToBlob(base64, contentType = 'application/octet-stream') {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    const sliceSize = 1024;

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

// RemoteAPIClient 类 - 处理WebRTC数据通道API通信
class RemoteAPIClient {
    constructor(dataChannel, chunker, logFn) {
        this.dataChannel = dataChannel;
        this.chunker = chunker;
        this.log = logFn;
        this.requestId = 0;
        this.pendingRequests = new Map();

        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);

        this.dataChannel.addEventListener('message', this.handleMessage);
        this.dataChannel.addEventListener('close', this.handleClose);
        this.dataChannel.addEventListener('error', this.handleError);
    }

    handleMessage(event) {
        try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'chunk' && this.chunker) {
                if (payload.chunk_type === 'ack') {
                    this.chunker.processAck(payload, 'client');
                    return;
                }

                const result = this.chunker.processChunk(payload, 'server');
                if (!result) {
                    return;
                }

                if (result.completeMessage) {
                    this.handleResponse(result.completeMessage);
                    if (result.ackChunk) {
                        this.dataChannel.send(JSON.stringify(result.ackChunk));
                    }
                } else if (result.type === 'chunk') {
                    this.dataChannel.send(JSON.stringify(result));
                }
                return;
            }

            this.handleResponse(payload);
        } catch (error) {
            this.log(`数据通道消息解析失败: ${error.message}`, 'error');
        }
    }

    handleResponse(response) {
        const requestId = response.id;
        if (this.pendingRequests.has(requestId)) {
            const { resolve, timeout } = this.pendingRequests.get(requestId);
            clearTimeout(timeout);
            this.pendingRequests.delete(requestId);
            resolve(response);
            return;
        }

        this.log(`收到未匹配的响应: ${JSON.stringify(response)}`, 'warning');
    }

    handleClose() {
        this.rejectAll(new Error('数据通道已关闭'));
    }

    handleError(event) {
        const description = event.error ? event.error.message : '未知错误';
        this.rejectAll(new Error(`数据通道错误: ${description}`));
    }

    rejectAll(error) {
        for (const { reject, timeout } of this.pendingRequests.values()) {
            clearTimeout(timeout);
            reject(error);
        }
        this.pendingRequests.clear();
    }

    request(method, endpoint, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
                reject(new Error('数据通道尚未就绪'));
                return;
            }

            const requestId = ++this.requestId;
            const payload = {
                id: requestId,
                method: method.toUpperCase(),
                endpoint,
                data,
                headers
            };

            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('请求超时'));
                }
            }, 30000);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });
            this.dataChannel.send(JSON.stringify(payload));
        });
    }

    get(endpoint, headers = {}) {
        return this.request('GET', endpoint, null, headers);
    }

    close() {
        this.rejectAll(new Error('连接已关闭'));
        if (this.dataChannel) {
            this.dataChannel.removeEventListener('message', this.handleMessage);
            this.dataChannel.removeEventListener('close', this.handleClose);
            this.dataChannel.removeEventListener('error', this.handleError);
        }
    }
}

// RemoteAccessClient 类 - 处理WebRTC远程连接
class RemoteAccessClient {
    constructor(config, logFn) {
        this.config = config;
        this.log = logFn;
        this.clientId = config.CLIENT_ID || this.generateClientId();
        this.ws = null;
        this.token = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.chunker = null;
        this.apiClient = null;
        this.targetClientId = null;
        this.connectPromise = null;
        this.connectResolver = null;
        this.connectRejecter = null;
        this.connectionTimer = null;
    }

    generateClientId() {
        const randomPart = Math.random().toString(36).slice(2, 8);
        return `web_reader_${Date.now()}_${randomPart}`;
    }

    async ensureConnected() {
        if (this.apiClient && this.dataChannel && this.dataChannel.readyState === 'open') {
            return;
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            this.connectResolver = resolve;
            this.connectRejecter = reject;
        });

        try {
            await this.connect();
        } catch (error) {
            this.resetConnectPromise();
            throw error;
        }

        return this.connectPromise;
    }

    resetConnectPromise() {
        this.connectPromise = null;
        this.connectResolver = null;
        this.connectRejecter = null;
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }
    }

    async connect() {
        this.log('开始远程认证流程');
        this.token = await this.authenticate();
        this.log('API Key 验证成功，准备连接信令服务器', 'success');

        await this.openWebSocket();

        this.connectionTimer = setTimeout(() => {
            if (!this.apiClient || !this.dataChannel || this.dataChannel.readyState !== 'open') {
                const error = new Error('建立数据通道超时');
                this.log(error.message, 'error');
                if (this.connectRejecter) {
                    this.connectRejecter(error);
                }
                this.resetConnectPromise();
            }
        }, 20000);
    }

    async authenticate() {
        const url = `${this.config.AUTH_URL.replace(/\/$/, '')}/api-auth`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ api_key: this.config.API_KEY })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`认证请求失败: HTTP ${response.status} ${text}`);
        }

        const data = await response.json();
        if (!data.success || !data.token) {
            throw new Error(data.error || 'API Key 无效，无法建立远程连接');
        }

        return data.token;
    }

    async openWebSocket() {
        return new Promise((resolve, reject) => {
            let wsUrl = this.config.SIGNALING_URL;
            if (!wsUrl.includes('/ws')) {
                wsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws` : `${wsUrl}/ws`;
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.log('信令服务器连接成功');
                this.ws.send(JSON.stringify({
                    type: 'register',
                    token: this.token,
                    id: this.clientId
                }));
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleSignalingMessage(message);
                } catch (error) {
                    this.log(`解析信令消息失败: ${error.message}`, 'error');
                }
            };

            this.ws.onerror = (event) => {
                const description = event.message || '未知错误';
                this.log(`信令服务器连接错误: ${description}`, 'error');
                reject(new Error(description));
            };

            this.ws.onclose = () => {
                this.log('信令服务器连接已关闭', 'warning');
                this.cleanupPeerConnection();
            };
        });
    }

    handleSignalingMessage(message) {
        switch (message.type) {
            case 'registered':
                this.log('信令注册成功，开始查询内部机列表');
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'query_clients',
                        source: this.clientId
                    }));
                }
                break;
            case 'clients_list':
                this.handleClientsList(message.clients || []);
                break;
            case 'answer':
                this.handleAnswer(message);
                break;
            case 'ice-candidate':
                this.handleRemoteIce(message);
                break;
            case 'error':
                this.log(`信令错误: ${message.message || '未知错误'}`, 'error');
                if (this.connectRejecter) {
                    this.connectRejecter(new Error(message.message || '信令服务器返回错误'));
                }
                this.resetConnectPromise();
                break;
            default:
                this.log(`收到未处理的信令消息: ${message.type}`, 'warning');
        }
    }

    handleClientsList(clients) {
        if (!clients.length) {
            const error = new Error('未发现可用的内部机');
            this.log(error.message, 'error');
            if (this.connectRejecter) {
                this.connectRejecter(error);
                this.resetConnectPromise();
            }
            return;
        }

        const preferredId = this.config.REMOTE_TARGET_ID;
        const target = preferredId ?
            clients.find(client => client.id === preferredId) || clients[0] :
            clients[0];

        this.targetClientId = target.id;
        this.log(`选择内部机 ${this.targetClientId} 建立数据通道`, 'info');
        this.establishDataChannel();
    }

    async establishDataChannel() {
        this.cleanupPeerConnection();

        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'turn:120.55.85.213:3478', username: 'cenyc', credential: 'cenyc' }
            ]
        });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ice-candidate',
                    data: {
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    },
                    target: this.targetClientId,
                    source: this.clientId
                }));
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            if (!this.peerConnection) return;
            if (this.peerConnection.connectionState === 'failed') {
                this.log('WebRTC 连接失败', 'error');
            }
        };

        this.dataChannel = this.peerConnection.createDataChannel('api', { ordered: true });
        this.dataChannel.onopen = () => this.handleDataChannelOpen();
        this.dataChannel.onclose = () => this.handleDataChannelClose();
        this.dataChannel.onerror = (event) => {
            const description = event.error ? event.error.message : '未知错误';
            this.log(`数据通道错误: ${description}`, 'error');
        };

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'offer',
                data: {
                    sdp: offer.sdp,
                    type: offer.type
                },
                target: this.targetClientId,
                source: this.clientId,
                camera_index: -1,
                camera_type: 'datachannel_only',
                data_channel_only: true
            }));
        }
    }

    handleDataChannelOpen() {
        this.log('数据通道已建立', 'success');

        if (typeof globalThis !== 'undefined' && typeof globalThis.WebRTCChunker !== 'undefined') {
            this.chunker = new globalThis.WebRTCChunker(8000, 30000, 3);
        }
        this.apiClient = new RemoteAPIClient(this.dataChannel, this.chunker, this.log);

        if (this.connectResolver) {
            this.connectResolver();
        }
        this.resetConnectPromise();
    }

    handleDataChannelClose() {
        this.log('数据通道已关闭', 'warning');
        if (this.apiClient) {
            this.apiClient.close();
            this.apiClient = null;
        }
        this.chunker = null;
    }

    handleAnswer(message) {
        if (!this.peerConnection || !message.data) {
            return;
        }
        const description = new RTCSessionDescription(message.data);
        this.peerConnection.setRemoteDescription(description).catch(error => {
            this.log(`设置远程描述失败: ${error.message}`, 'error');
        });
    }

    handleRemoteIce(message) {
        if (!this.peerConnection || !message.data) {
            return;
        }
        const candidate = new RTCIceCandidate(message.data);
        this.peerConnection.addIceCandidate(candidate).catch(error => {
            this.log(`添加远端 ICE 候选失败: ${error.message}`, 'error');
        });
    }

    async fetchImage(fileId) {
        await this.ensureConnected();
        if (!this.apiClient) {
            throw new Error('远程数据通道未就绪');
        }

        this.log(`通过 WebRTC 请求远程图像: ${fileId}`);
        const response = await this.apiClient.get(`${this.config.IMAGE_ENDPOINT}?path=${encodeURIComponent(fileId)}`);

        if (!response.success) {
            throw new Error(response.error || '远程内部机返回失败');
        }

        const base64 = response.image_base64 || response.data_base64;
        if (!base64) {
            throw new Error('远程响应未包含图像数据');
        }

        const blob = base64ToBlob(base64, response.content_type || 'image/jpeg');
        return {
            blob,
            contentType: response.content_type || 'image/jpeg',
            size: response.size || blob.size
        };
    }

    cleanupPeerConnection() {
        if (this.apiClient) {
            this.apiClient.close();
            this.apiClient = null;
        }
        if (this.dataChannel) {
            try { this.dataChannel.close(); } catch (e) { void e; }
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            try { this.peerConnection.close(); } catch (e) { void e; }
            this.peerConnection = null;
        }
        this.chunker = null;
    }

    /**
     * 检查WebRTC连接是否已就绪
     */
    isConnected() {
        return this.apiClient &&
               this.dataChannel &&
               this.dataChannel.readyState === 'open' &&
               this.peerConnection &&
               this.peerConnection.connectionState === 'connected';
    }

    close() {
        this.cleanupPeerConnection();
        if (this.ws) {
            try { this.ws.close(); } catch (e) { void e; }
            this.ws = null;
        }
        this.resetConnectPromise();
    }
}

// 兼容性检查和初始化
(function() {
    if (typeof window !== 'undefined') {
        // 浏览器环境
        window.ImageAccessClient = ImageAccessClient;
    } else if (typeof module !== 'undefined' && module.exports) {
        // Node.js 环境
        module.exports = ImageAccessClient;
    }
})();