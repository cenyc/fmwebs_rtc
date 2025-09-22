// webrtc_chunker.js - 客户端WebRTC消息分片处理器
class WebRTCChunker {
    constructor(chunkSize = 8000, messageTimeout = 30000, maxConcurrentTransfers = 3) {
        this.chunkSize = chunkSize;
        this.messageTimeout = messageTimeout;
        this.maxConcurrentTransfers = maxConcurrentTransfers;
        
        // 待组装的消息
        this.pendingMessages = new Map();
        
        // 发送中的消息
        this.sendingMessages = new Map();
        
        // ACK跟踪和重试 - 改进的策略
        this.ackTimeouts = new Map(); // messageId -> timeout handler
        this.baseRetries = 3;  // 基础重试次数
        this.maxRetries = 8;   // 最大重试次数（大消息）
        this.baseAckTimeoutMs = 5000; // 基础ACK超时时间
        this.maxAckTimeoutMs = 15000;  // 最大ACK超时时间
        
        // 延迟清理 - 解决晚到ACK的问题
        this.cleanupDelayMs = 10000; // 失败后延迟10秒清理
        this.failedMessages = new Map(); // messageId -> failTime
        
        // 并发传输控制
        this.activeTransfers = new Map();
        this.transferQueue = new Map();
        
        // 流控制
        this.flowControl = new Map();
        
        // 统计信息
        this.stats = {
            messagesSent: 0,
            messagesReceived: 0,
            chunksSent: 0,
            chunksReceived: 0,
            bytesSent: 0,
            bytesReceived: 0,
            retransmissions: 0,
            timeouts: 0,
            partialRetries: 0  // 部分重传次数
        };
        
        // 回调函数
        this.onMessageComplete = null;
        this.onChunkReceived = null;
        this.onTransferProgress = null;
        this.onError = null;
        
        // 启动清理任务
        this.running = true;
        this.startCleanupTask();
        
        console.log(`WebRTCChunker initialized with improved strategies: chunk_size=${chunkSize}, base_timeout=${this.baseAckTimeoutMs}ms, max_retries=${this.maxRetries}`);
    }
    
    // 根据消息大小计算自适应超时时间
    calculateAdaptiveTimeout(messageSize, chunkCount) {
        // 基础超时 + 每个分片额外时间
        const perChunkTime = 300; // 每个分片300ms
        const adaptiveTimeout = this.baseAckTimeoutMs + (chunkCount * perChunkTime);
        
        // 限制在最大超时时间内
        return Math.min(adaptiveTimeout, this.maxAckTimeoutMs);
    }
    
    // 根据消息大小计算自适应重试次数
    calculateAdaptiveRetries(messageSize, chunkCount) {
        // 小消息用基础重试次数，大消息增加重试次数
        if (chunkCount <= 10) {
            return this.baseRetries; // 小消息：3次重试
        } else if (chunkCount <= 50) {
            return this.baseRetries + 2; // 中等消息：5次重试
        } else {
            return this.maxRetries; // 大消息：8次重试
        }
    }
    
    // 检查消息是否已失败（但未清理）
    isMessageFailed(messageId) {
        return this.failedMessages.has(messageId);
    }
    
    // 生成UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // 将消息分片
    chunkMessage(data, clientId = null, priority = 1) {
        try {
            const messageStr = JSON.stringify(data);
            const messageBytes = new TextEncoder().encode(messageStr);
            const messageSize = messageBytes.length;
            
            // 更新统计
            this.stats.bytesSent += messageSize;
            
            // 如果消息小于分片大小，直接返回
            if (messageSize <= this.chunkSize) {
                return [data];
            }
            
            // 检查并发传输限制
            const activeCount = this.activeTransfers.get(clientId) || 0;
            if (activeCount >= this.maxConcurrentTransfers) {
                console.warn(`Max concurrent transfers reached for ${clientId}, queueing message`);
                
                if (!this.transferQueue.has(clientId)) {
                    this.transferQueue.set(clientId, []);
                }
                
                this.transferQueue.get(clientId).push({
                    data: data,
                    clientId: clientId,
                    priority: priority,
                    timestamp: Date.now()
                });
                
                return []; // 返回空数组表示已排队
            }
            
            // 生成消息ID
            const messageId = this.generateUUID();
            
            // 计算分片数量
            const totalChunks = Math.ceil(messageSize / this.chunkSize);
            const chunks = [];
            
            // 创建开始分片
            chunks.push({
                type: 'chunk',
                chunk_type: 'start',
                message_id: messageId,
                chunk_index: -1,
                total_chunks: totalChunks,
                original_size: messageSize,
                priority: priority,
                data: '',
                timestamp: Date.now()
            });
            
            // 创建数据分片
            for (let i = 0; i < totalChunks; i++) {
                const startByte = i * this.chunkSize;
                const endByte = Math.min((i + 1) * this.chunkSize, messageSize);
                const chunkData = messageStr.slice(startByte, endByte);
                
                chunks.push({
                    type: 'chunk',
                    chunk_type: 'data',
                    message_id: messageId,
                    chunk_index: i,
                    total_chunks: totalChunks,
                    priority: priority,
                    data: chunkData,
                    timestamp: Date.now()
                });
            }
            
            // 创建结束分片
            chunks.push({
                type: 'chunk',
                chunk_type: 'end',
                message_id: messageId,
                chunk_index: totalChunks,
                total_chunks: totalChunks,
                priority: priority,
                data: '',
                timestamp: Date.now()
            });
            
            // 计算自适应参数
            const adaptiveTimeout = this.calculateAdaptiveTimeout(messageSize, totalChunks);
            const adaptiveRetries = this.calculateAdaptiveRetries(messageSize, totalChunks);
            
            // 保存发送信息
            this.sendingMessages.set(messageId, {
                chunks: chunks,
                clientId: clientId,
                timestamp: Date.now(),
                originalData: data,
                priority: priority,
                bytesSent: 0,
                chunksSent: 0,
                chunksAcked: 0,
                retryCount: 0,
                maxRetries: adaptiveRetries,  // 自适应重试次数
                timeout: adaptiveTimeout,     // 自适应超时时间
                messageSize: messageSize,     // 消息大小
                totalChunks: totalChunks      // 分片总数
            });
            
            // 设置ACK超时检查
            this.setAckTimeout(messageId, clientId);
            
            // 更新活跃传输计数
            if (clientId) {
                this.activeTransfers.set(clientId, activeCount + 1);
            }
            
            // 更新统计
            this.stats.messagesSent++;
            this.stats.chunksSent += chunks.length;
            
            console.log(`Message chunked: ${messageId} -> ${totalChunks} chunks (${messageSize} bytes) priority=${priority}`);
            return chunks;
            
        } catch (error) {
            console.error('Error chunking message:', error);
            return [data]; // 返回原始数据作为fallback
        }
    }
    
    // 使用流控制发送分片
    async sendChunksWithFlowControl(chunks, clientId, sendFunction, dataChannel = null) {
        if (!chunks || chunks.length === 0) {
            return true;
        }
        
        try {
            const messageId = chunks[0].message_id;
            
            // 初始化流控制状态
            if (!this.flowControl.has(clientId)) {
                this.flowControl.set(clientId, {
                    sentChunks: 0,
                    ackedChunks: 0,
                    inFlight: 0,
                    windowFull: false,
                    windowSize: 8  // 减少窗口大小以防止缓冲区溢出
                });
            }
            
            const flowState = this.flowControl.get(clientId);
            flowState.sentChunks = 0;
            flowState.ackedChunks = 0;
            flowState.inFlight = 0;
            flowState.windowFull = false;
            
            const totalChunks = chunks.length;
            let sentCount = 0;
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // 检查流控制窗口
                let waitCount = 0;
                while (flowState.inFlight >= flowState.windowSize && this.running) {
                    flowState.windowFull = true;
                    await new Promise(resolve => setTimeout(resolve, 20)); // 增加等待时间
                    waitCount++;
                    
                    // 如果等待时间过长，可能是ACK丢失，记录日志
                    if (waitCount > 100) { // 2秒后
                        console.warn(`Flow control window full for ${clientId}: inFlight=${flowState.inFlight}, windowSize=${flowState.windowSize}`);
                        waitCount = 0; // 重置计数器，避免日志太多
                    }
                }
                
                if (!this.running) {
                    return false;
                }
                
                // 缓冲区监控和背压处理
                await this.checkBufferAndBackpressure(sendFunction, dataChannel);
                
                // 发送分片
                try {
                    console.log(`📤 Sending chunk ${chunk.chunk_index}/${chunk.total_chunks} (${chunk.chunk_type}) for ${messageId}, inFlight: ${flowState.inFlight}/${flowState.windowSize}`);
                    await sendFunction(chunk);
                    flowState.sentChunks++;
                    flowState.inFlight++;
                    sentCount++;
                    
                    // 更新发送记录
                    const sendInfo = this.sendingMessages.get(messageId);
                    if (sendInfo) {
                        sendInfo.chunksSent = sentCount;
                    }
                    
                    // 更新进度
                    const progress = sentCount / totalChunks;
                    if (this.onTransferProgress) {
                        this.onTransferProgress(clientId, messageId, progress);
                    }
                    
                    // 小延迟防止过载 - 增加延迟时间并调整频率
                    if (i > 0) {
                        // 每个分片后都有小延迟，防止数据通道过载
                        await new Promise(resolve => setTimeout(resolve, 10));
                        
                        // 每发送3个分片后稍长延迟
                        if (i % 3 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 20));
                        }
                    }
                    
                } catch (error) {
                    console.error(`Error sending chunk ${i} for message ${messageId}:`, error);
                    return false;
                }
            }
            
            flowState.windowFull = false;
            console.log(`Sent ${sentCount} chunks for message ${messageId} with flow control`);
            return true;
            
        } catch (error) {
            console.error('Error in sendChunksWithFlowControl:', error);
            return false;
        }
    }
    
    // 检查缓冲区并处理背压
    async checkBufferAndBackpressure(sendFunction, dataChannel = null) {
        // 尝试获取数据通道引用
        let channel = dataChannel;
        
        // 如果没有直接传入dataChannel，尝试从sendFunction的上下文获取
        if (!channel && sendFunction && typeof sendFunction === 'function') {
            // 在实际使用中，这个方法会被调用时传入正确的dataChannel引用
            return; // 暂时跳过缓冲区检查，因为无法获取dataChannel
        }
        
        if (channel && channel.bufferedAmount !== undefined) {
                const bufferedAmount = channel.bufferedAmount;
                const maxBufferSize = 256 * 1024; // 256KB，WebRTC数据通道典型缓冲区大小
                let bufferUsage = bufferedAmount / maxBufferSize;
            
            // 如果缓冲区使用率超过70%，开始背压处理
            if (bufferUsage > 0.7) {
                const delay = Math.min(100, bufferUsage * 200); // 最多延迟200ms
                console.debug(`Buffer backpressure: ${(bufferUsage * 100).toFixed(1)}% full, delaying ${delay.toFixed(1)}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // 如果缓冲区使用率超过90%，等待缓冲区减少
                let waitCount = 0;
                while (bufferUsage > 0.9 && waitCount < 50) { // 最多等待5秒
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const newBufferedAmount = channel.bufferedAmount;
                    const newBufferUsage = newBufferedAmount / maxBufferSize;
                    
                    if (newBufferUsage < bufferUsage) {
                        bufferUsage = newBufferUsage;
                        console.debug(`Buffer draining: ${(bufferUsage * 100).toFixed(1)}% full`);
                    }
                    waitCount++;
                }
                
                if (waitCount >= 50) {
                    console.warn('Buffer backpressure timeout - proceeding with caution');
                }
            }
        }
    }
    
    // 处理接收到的分片
    processChunk(chunkData, clientId = null) {
        try {
            // 检查是否为分片消息
            if (chunkData.type !== 'chunk') {
                return chunkData; // 不是分片消息，直接返回
            }
            
            const messageId = chunkData.message_id;
            const chunkType = chunkData.chunk_type;
            const chunkIndex = chunkData.chunk_index || 0;
            const totalChunks = chunkData.total_chunks || 1;
            const data = chunkData.data || '';
            
            if (!messageId) {
                console.error('Received chunk without message_id');
                return null;
            }
            
            // 处理开始分片
            if (chunkType === 'start') {
                if (this.pendingMessages.has(messageId)) {
                    console.warn(`Duplicate start chunk for message ${messageId}`);
                    return null;
                }
                
                this.pendingMessages.set(messageId, {
                    messageId: messageId,
                    totalChunks: totalChunks,
                    receivedChunks: new Map(),
                    timestamp: Date.now(),
                    timeout: Date.now() + this.messageTimeout,
                    clientId: clientId || 'unknown'
                });
                
                // 发送确认
                const ackChunk = {
                    type: 'chunk',
                    chunk_type: 'ack',
                    message_id: messageId,
                    chunk_index: -1,
                    data: 'start_ack'
                };
                
                console.log(`Started receiving chunked message: ${messageId} (${totalChunks} chunks)`);
                return ackChunk;
            }
            
            // 处理数据分片
            else if (chunkType === 'data') {
                const pending = this.pendingMessages.get(messageId);
                if (!pending) {
                    console.warn(`Received data chunk for unknown message ${messageId}`);
                    return null;
                }
                
                pending.receivedChunks.set(chunkIndex, data);
                
                // 触发进度回调
                if (this.onChunkReceived) {
                    this.onChunkReceived(clientId || 'unknown', pending.receivedChunks.size, totalChunks);
                }
                
                // 发送确认
                const ackChunk = {
                    type: 'chunk',
                    chunk_type: 'ack',
                    message_id: messageId,
                    chunk_index: chunkIndex,
                    data: `chunk_${chunkIndex}_ack`
                };
                
                console.debug(`Received chunk ${chunkIndex}/${totalChunks} for message ${messageId}`);
                return ackChunk;
            }
            
            // 处理结束分片
            else if (chunkType === 'end') {
                const pending = this.pendingMessages.get(messageId);
                if (!pending) {
                    console.warn(`Received end chunk for unknown message ${messageId}`);
                    return null;
                }
                
                // 检查消息是否完整
                const isComplete = pending.receivedChunks.size === pending.totalChunks;
                
                if (isComplete) {
                    try {
                        // 组装完整消息
                        let assembledData = '';
                        for (let i = 0; i < pending.totalChunks; i++) {
                            assembledData += pending.receivedChunks.get(i) || '';
                        }
                        
                        const completeMessage = JSON.parse(assembledData);
                        
                        // 清理
                        this.pendingMessages.delete(messageId);
                        
                        // 触发完成回调
                        if (this.onMessageComplete) {
                            this.onMessageComplete(clientId || 'unknown', completeMessage, messageId);
                        }
                        
                        // 发送完成确认
                        const ackChunk = {
                            type: 'chunk',
                            chunk_type: 'ack',
                            message_id: messageId,
                            chunk_index: totalChunks,
                            data: 'complete_ack'
                        };
                        
                        console.log(`Message reassembled successfully: ${messageId}`);
                        
                        return {
                            completeMessage: completeMessage,
                            ackChunk: ackChunk
                        };
                        
                    } catch (error) {
                        console.error(`Failed to parse reassembled message ${messageId}:`, error);
                        this.pendingMessages.delete(messageId);
                        return {
                            type: 'chunk',
                            chunk_type: 'error',
                            message_id: messageId,
                            data: `parse_error: ${error.message}`
                        };
                    }
                } else {
                    console.warn(`Message ${messageId} incomplete: ${pending.receivedChunks.size}/${totalChunks}`);
                    return {
                        type: 'chunk',
                        chunk_type: 'error',
                        message_id: messageId,
                        data: `incomplete: ${pending.receivedChunks.size}/${totalChunks}`
                    };
                }
            }
            
            // 处理ACK分片
            else if (chunkType === 'ack') {
                this.processAck(chunkData, clientId);
                console.debug(`Received ACK for message ${messageId}, chunk ${chunkIndex}`);
                return null;
            }
            
            // 处理错误分片
            else if (chunkType === 'error') {
                const errorMsg = chunkData.data || 'Unknown error';
                console.error(`Received error chunk for message ${messageId}: ${errorMsg}`);
                
                // 清理相关资源
                this.pendingMessages.delete(messageId);
                this.sendingMessages.delete(messageId);
                
                if (this.onError) {
                    this.onError(clientId || 'unknown', errorMsg);
                }
                
                return null;
            }
            
            else {
                console.warn(`Unknown chunk type: ${chunkType}`);
                return null;
            }
            
        } catch (error) {
            console.error('Error processing chunk:', error);
            return null;
        }
    }
    
    // 处理ACK消息
    processAck(ackData, clientId) {
        try {
            const messageId = ackData.message_id;
            const chunkIndex = ackData.chunk_index || -1;
            
            const sendInfo = this.sendingMessages.get(messageId);
            if (sendInfo) {
                sendInfo.chunksAcked++;
                
                // 更新流控制状态
                if (!this.flowControl.has(clientId)) {
                    console.warn(`Flow control not initialized for ${clientId}, initializing now`);
                    this.flowControl.set(clientId, {
                        sentChunks: 0,
                        ackedChunks: 0,
                        inFlight: 0,
                        windowFull: false,
                        windowSize: 8
                    });
                }
                
                const flowState = this.flowControl.get(clientId);
                if (flowState) {
                    flowState.ackedChunks++;
                    const previousInFlight = flowState.inFlight;
                    flowState.inFlight = Math.max(0, flowState.inFlight - 1);
                    
                    // 如果窗口之前是满的，现在有空间了，记录日志
                    if (flowState.windowFull && flowState.inFlight < flowState.windowSize) {
                        console.debug(`Flow control window freed for ${clientId}: ${flowState.inFlight}/${flowState.windowSize}`);
                        flowState.windowFull = false;
                    }
                    
                    console.log(`✅ ACK processed for ${messageId}: chunk ${chunkIndex}, inFlight: ${previousInFlight} -> ${flowState.inFlight}, window: ${flowState.inFlight}/${flowState.windowSize}`);
                }
                
                // 检查是否传输完成
                const totalChunks = sendInfo.chunks.length;
                if (sendInfo.chunksAcked >= totalChunks) {
                    console.log(`All chunks acknowledged for message ${messageId}: ${sendInfo.chunksAcked}/${totalChunks}`);
                    
                    // 清理ACK超时（在completeTransfer中会再次清理，但这里也清理以确保）
                    if (this.ackTimeouts.has(messageId)) {
                        clearTimeout(this.ackTimeouts.get(messageId));
                        this.ackTimeouts.delete(messageId);
                    }
                    
                    this.completeTransfer(messageId, clientId);
                }
            } else {
                // 检查是否为失败消息的晚到ACK
                if (this.failedMessages.has(messageId)) {
                    const failTime = this.failedMessages.get(messageId);
                    const elapsedMs = Date.now() - failTime;
                    console.info(`Received late ACK for failed message ${messageId} (${elapsedMs}ms after failure) - chunk ${chunkIndex}`);
                    // 不做处理，只记录日志
                } else {
                    console.warn(`Received ACK for completely unknown message ${messageId}`);
                }
            }
            
        } catch (error) {
            console.error('Error processing ACK:', error);
        }
    }
    
    // 完成传输
    completeTransfer(messageId, clientId) {
        try {
            // 清理发送信息
            this.sendingMessages.delete(messageId);
            
            // 清理ACK超时
            if (this.ackTimeouts.has(messageId)) {
                clearTimeout(this.ackTimeouts.get(messageId));
                this.ackTimeouts.delete(messageId);
            }
            
            // 减少活跃传输计数
            if (clientId) {
                const activeCount = this.activeTransfers.get(clientId) || 0;
                if (activeCount > 0) {
                    this.activeTransfers.set(clientId, activeCount - 1);
                }
            }
            
            // 检查排队的传输
            const queue = this.transferQueue.get(clientId);
            if (queue && queue.length > 0) {
                const activeCount = this.activeTransfers.get(clientId) || 0;
                if (activeCount < this.maxConcurrentTransfers) {
                    const queuedItem = queue.shift();
                    setTimeout(() => this.processQueuedTransfer(queuedItem), 0);
                }
            }
            
            console.debug(`Transfer completed for message ${messageId}`);
            
        } catch (error) {
            console.error('Error completing transfer:', error);
        }
    }
    
    // 处理排队的传输
    processQueuedTransfer(queuedItem) {
        try {
            const { data, clientId, priority } = queuedItem;
            const chunks = this.chunkMessage(data, clientId, priority);
            
            if (chunks && chunks.length > 0) {
                console.log(`Processing queued transfer for ${clientId}: ${chunks.length} chunks`);
            }
            
        } catch (error) {
            console.error('Error processing queued transfer:', error);
        }
    }
    
    // 设置ACK超时检查
    setAckTimeout(messageId, clientId) {
        // 清除之前的超时（如果有）
        if (this.ackTimeouts.has(messageId)) {
            clearTimeout(this.ackTimeouts.get(messageId));
        }
        
        // 获取自适应超时时间
        const sendInfo = this.sendingMessages.get(messageId);
        const timeoutMs = sendInfo ? sendInfo.timeout : this.baseAckTimeoutMs;
        
        const timeout = setTimeout(() => {
            this.handleAckTimeout(messageId, clientId);
        }, timeoutMs);
        
        this.ackTimeouts.set(messageId, timeout);
        
        console.log(`Set ACK timeout for ${messageId}: ${timeoutMs}ms (retries: ${sendInfo?.retryCount || 0}/${sendInfo?.maxRetries || this.baseRetries})`);
    }
    
    // 处理ACK超时 - 改进版本
    handleAckTimeout(messageId, clientId) {
        const sendInfo = this.sendingMessages.get(messageId);
        if (!sendInfo) {
            return; // 已完成或清理了
        }
        
        const totalChunks = sendInfo.chunks.length;
        const maxRetries = sendInfo.maxRetries || this.baseRetries;
        
        console.warn(`ACK timeout for ${messageId}: received ${sendInfo.chunksAcked}/${totalChunks} ACKs, retry ${sendInfo.retryCount + 1}/${maxRetries}`);
        
        sendInfo.retryCount++;
        this.stats.timeouts++;
        
        if (sendInfo.retryCount <= maxRetries) {
            // 实施指数退避：每次重试增加延迟
            const backoffMs = Math.min(1000 * Math.pow(2, sendInfo.retryCount - 1), 8000);
            
            console.log(`Retrying ${messageId} in ${backoffMs}ms (attempt ${sendInfo.retryCount}/${maxRetries})`);
            
            // 重置流控制状态
            const flowState = this.flowControl.get(clientId);
            if (flowState) {
                const unackedChunks = sendInfo.chunksSent - sendInfo.chunksAcked;
                flowState.inFlight = Math.max(0, flowState.inFlight - unackedChunks);
                flowState.windowFull = false;
            }
            
            // 延迟重试
            setTimeout(() => {
                // 检查消息是否仍然存在
                if (this.sendingMessages.has(messageId)) {
                    this.stats.retransmissions++;
                    this.setAckTimeout(messageId, clientId);
                    console.log(`Retransmission started for ${messageId}`);
                }
            }, backoffMs);
            
        } else {
            // 超过重试限制，标记为失败但延迟清理
            console.error(`Message ${messageId} failed after ${maxRetries} retries (size: ${sendInfo.messageSize} bytes, chunks: ${sendInfo.totalChunks})`);
            
            // 标记消息为失败状态
            this.failedMessages.set(messageId, Date.now());
            
            // 触发错误回调
            if (this.onError) {
                this.onError(clientId, `Message ${messageId} transmission failed after ${maxRetries} retries`);
            }
            
            // 延迟清理，给晚到的ACK一些时间
            setTimeout(() => {
                this.performDelayedCleanup(messageId, clientId);
            }, this.cleanupDelayMs);
            
            console.log(`Scheduled delayed cleanup for failed message ${messageId} in ${this.cleanupDelayMs}ms`);
        }
    }
    
    // 执行延迟清理
    performDelayedCleanup(messageId, clientId) {
        console.log(`Performing delayed cleanup for message ${messageId}`);
        
        // 从失败消息列表中移除
        this.failedMessages.delete(messageId);
        
        // 清理发送消息
        if (this.sendingMessages.has(messageId)) {
            this.sendingMessages.delete(messageId);
        }
        
        // 清理ACK超时
        if (this.ackTimeouts.has(messageId)) {
            clearTimeout(this.ackTimeouts.get(messageId));
            this.ackTimeouts.delete(messageId);
        }
        
        // 更新活跃传输计数
        if (clientId && this.activeTransfers.has(clientId)) {
            const count = this.activeTransfers.get(clientId);
            if (count > 0) {
                this.activeTransfers.set(clientId, count - 1);
            }
        }
        
        console.log(`Delayed cleanup completed for message ${messageId}`);
    }
    
    // 启动清理任务
    startCleanupTask() {
        const cleanupInterval = setInterval(() => {
            if (!this.running) {
                clearInterval(cleanupInterval);
                return;
            }
            
            try {
                const currentTime = Date.now();
                const expiredMessages = [];
                
                // 检查待组装消息
                for (const [messageId, pending] of this.pendingMessages) {
                    if (currentTime > pending.timeout) {
                        expiredMessages.push(messageId);
                    }
                }
                
                // 清理超时消息
                for (const messageId of expiredMessages) {
                    console.warn(`Message ${messageId} timed out, removing`);
                    this.pendingMessages.delete(messageId);
                    
                    if (this.onError) {
                        this.onError('unknown', `Message ${messageId} timed out`);
                    }
                }
                
                // 清理旧的发送记录
                const expiredSending = [];
                for (const [messageId, info] of this.sendingMessages) {
                    if (currentTime - info.timestamp > this.messageTimeout * 2) {
                        expiredSending.push(messageId);
                    }
                }
                
                for (const messageId of expiredSending) {
                    this.sendingMessages.delete(messageId);
                }
                
                // 清理过期的失败消息记录
                const expiredFailed = [];
                for (const [messageId, failTime] of this.failedMessages) {
                    if (currentTime - failTime > this.cleanupDelayMs * 2) { // 延迟清理时间的2倍后清理记录
                        expiredFailed.push(messageId);
                    }
                }
                
                for (const messageId of expiredFailed) {
                    this.failedMessages.delete(messageId);
                }
                
                if (expiredMessages.length > 0 || expiredSending.length > 0 || expiredFailed.length > 0) {
                    console.log(`Cleaned up ${expiredMessages.length} pending, ${expiredSending.length} sending, and ${expiredFailed.length} failed message records`);
                }
                
            } catch (error) {
                console.error('Error in cleanup task:', error);
            }
            
        }, 5000); // 每5秒检查一次
    }
    
    // 获取传输统计信息（改进版）
    getTransferStats() {
        const activeCount = this.sendingMessages.size;
        const failedCount = this.failedMessages.size;
        const totalActiveTransfers = Array.from(this.activeTransfers.values()).reduce((sum, count) => sum + count, 0);
        
        return {
            ...this.stats,
            activeMessages: activeCount,
            failedMessages: failedCount,
            totalActiveTransfers: totalActiveTransfers,
            flowControlStates: this.flowControl.size
        };
    }
    
    // 打印详细统计信息
    logDetailedStats() {
        const stats = this.getTransferStats();
        console.log('📊 WebRTC Chunker Statistics:');
        console.log(`  Messages: ${stats.messagesSent} sent, ${stats.messagesReceived} received`);
        console.log(`  Chunks: ${stats.chunksSent} sent, ${stats.chunksReceived} received`);
        console.log(`  Bytes: ${(stats.bytesSent / 1024).toFixed(2)} KB sent, ${(stats.bytesReceived / 1024).toFixed(2)} KB received`);
        console.log(`  Reliability: ${stats.timeouts} timeouts, ${stats.retransmissions} retransmissions, ${stats.partialRetries} partial retries`);
        console.log(`  Active: ${stats.activeMessages} messages, ${stats.failedMessages} failed (pending cleanup)`);
        console.log(`  Flow control: ${stats.flowControlStates} active states`);
    }
    
    // 停止分片处理器
    stop() {
        this.running = false;
        
        // 清理所有ACK超时
        for (const [, timeout] of this.ackTimeouts) {
            clearTimeout(timeout);
        }
        
        this.pendingMessages.clear();
        this.sendingMessages.clear();
        this.failedMessages.clear();  // 清理失败消息
        this.activeTransfers.clear();
        this.transferQueue.clear();
        this.flowControl.clear();
        this.ackTimeouts.clear();
        console.log('WebRTCChunker stopped and cleaned up');
    }
    
    // 获取统计信息
    getStats() {
        return {
            ...this.stats,
            pendingMessages: this.pendingMessages.size,
            sendingMessages: this.sendingMessages.size,
            chunkSize: this.chunkSize,
            timeout: this.messageTimeout
        };
    }
}

// 导出到全局/Node
if (typeof window !== 'undefined') {
    window.WebRTCChunker = WebRTCChunker;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCChunker;
}