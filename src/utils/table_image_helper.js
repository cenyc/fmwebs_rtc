/**
 * Table 图像助手工具
 * 用于从 HTML table 中自动提取文件路径并获取图像
 */

class TableImageHelper {
    constructor(imageClient) {
        this.imageClient = imageClient;
        this.cache = new Map(); // 缓存已加载的图像
    }

    /**
     * 从文件路径中提取 File ID（现在返回完整路径）
     * @param {string} filePath - 文件路径，如 "images/test/1.png"
     * @returns {string|null} - 完整的文件路径或null
     */
    extractFileIdFromPath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return null;
        }

        // 移除可能的HTML标签和多余空格
        const cleanPath = filePath.replace(/<[^>]*>/g, '').trim();

        // 直接返回完整的清理后路径
        return cleanPath || null;
    }

    /**
     * 为 table cell 添加图像预览功能
     * @param {HTMLElement|string} cellElement - td元素或选择器
     * @param {Object} options - 配置选项
     */
    async addImagePreview(cellElement, options = {}) {
        const defaultOptions = {
            previewSize: '200px',           // 预览图片大小
            position: 'tooltip',           // 显示方式: 'tooltip', 'inline', 'modal'
            trigger: 'hover',              // 触发方式: 'hover', 'click'
            showFileInfo: true,            // 是否显示文件信息
            cacheImages: true,             // 是否缓存图像
            errorPlaceholder: '加载失败'    // 错误占位符
        };

        const config = { ...defaultOptions, ...options };

        // 获取元素
        const cell = typeof cellElement === 'string' ?
            document.querySelector(cellElement) : cellElement;

        if (!cell) {
            console.warn('未找到指定的 table cell 元素');
            return;
        }

        // 提取文件路径和ID
        const filePath = cell.textContent || cell.innerText;
        const fileId = this.extractFileIdFromPath(filePath);

        if (!fileId) {
            console.warn('无法从路径中提取有效的文件ID:', filePath);
            return;
        }

        // 设置cell样式，显示可交互
        cell.style.cursor = 'pointer';
        cell.style.position = 'relative';

        // 创建预览容器
        const previewContainer = this.createPreviewContainer(config);

        // 绑定事件
        if (config.trigger === 'hover') {
            cell.addEventListener('mouseenter', () => this.showPreview(cell, fileId, previewContainer, config));
            cell.addEventListener('mouseleave', () => this.hidePreview(previewContainer, config));
        } else if (config.trigger === 'click') {
            cell.addEventListener('click', () => this.togglePreview(cell, fileId, previewContainer, config));
        }
    }

    /**
     * 批量为表格中的所有图像路径添加预览功能
     * @param {string} tableSelector - 表格选择器
     * @param {string} cellSelector - 包含图像路径的cell选择器
     * @param {Object} options - 配置选项
     */
    async addTableImagePreviews(tableSelector, cellSelector, options = {}) {
        const table = document.querySelector(tableSelector);
        if (!table) {
            console.warn('未找到指定的表格:', tableSelector);
            return;
        }

        const cells = table.querySelectorAll(cellSelector);
        console.log(`找到 ${cells.length} 个包含图像路径的单元格`);

        // 使用预检测的网络环境（不重复检测）
        const networkMode = this.imageClient.getNetworkMode();
        console.log(`预览功能使用预检测的网络模式: ${networkMode === 'lan' ? '局域网' : 'WebRTC'}`);

        // 并行处理所有单元格（预览功能可以并行，因为是悬停触发）
        const promises = Array.from(cells).map(cell =>
            this.addImagePreview(cell, options)
        );

        await Promise.allSettled(promises);

        console.log('表格图像预览功能添加完成');
    }

    /**
     * 创建预览容器
     */
    createPreviewContainer(config) {
        const container = document.createElement('div');
        container.className = 'image-preview-container';
        container.style.cssText = `
            position: absolute;
            z-index: 9999;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: none;
            max-width: 300px;
        `;

        if (config.position === 'tooltip') {
            container.style.top = '-10px';
            container.style.left = '100%';
            container.style.marginLeft = '10px';
        }

        return container;
    }

    /**
     * 显示图像预览
     */
    async showPreview(cell, fileId, container, config) {
        // 检查缓存
        if (config.cacheImages && this.cache.has(fileId)) {
            this.displayCachedImage(cell, container, this.cache.get(fileId), config);
            return;
        }

        // 添加到DOM
        if (!container.parentNode) {
            cell.appendChild(container);
        }

        // 显示加载状态
        container.innerHTML = `
            <div style="width: ${config.previewSize}; height: 100px; display: flex; align-items: center; justify-content: center; color: #666;">
                正在加载...
            </div>
        `;
        container.style.display = 'block';

        try {
            // 获取图像（带重试机制）
            const result = await this.imageClient.fetchImageWithRetry(fileId, 1);

            // 缓存结果
            if (config.cacheImages) {
                this.cache.set(fileId, result);
            }

            // 显示图像
            this.displayImage(container, result, config);

        } catch (error) {
            console.error('图像加载失败:', error);
            container.innerHTML = `
                <div style="width: ${config.previewSize}; height: 100px; display: flex; align-items: center; justify-content: center; color: #f87171; font-size: 12px;">
                    ${config.errorPlaceholder}
                </div>
            `;
        }
    }

    /**
     * 显示缓存的图像
     */
    displayCachedImage(cell, container, result, config) {
        if (!container.parentNode) {
            cell.appendChild(container);
        }
        this.displayImage(container, result, config);
        container.style.display = 'block';
    }

    /**
     * 显示图像内容
     */
    displayImage(container, result, config) {
        const accessMethod = result.source === 'lan' ? '局域网' : 'WebRTC';
        const sizeFormatted = this.imageClient.constructor.formatBytes(result.size);

        let infoHtml = '';
        if (config.showFileInfo) {
            infoHtml = `
                <div style="font-size: 11px; color: #666; margin-top: 5px; text-align: center;">
                    ${accessMethod} | ${sizeFormatted}
                </div>
            `;
        }

        container.innerHTML = `
            <img src="${result.objectUrl}"
                 style="width: ${config.previewSize}; height: auto; border-radius: 4px; display: block;"
                 alt="图像预览">
            ${infoHtml}
        `;
    }

    /**
     * 隐藏预览
     */
    hidePreview(container, config) {
        if (config.position === 'tooltip') {
            container.style.display = 'none';
        }
    }

    /**
     * 切换预览显示（用于点击触发）
     */
    async togglePreview(cell, fileId, container, config) {
        if (container.style.display === 'block') {
            this.hidePreview(container, config);
        } else {
            await this.showPreview(cell, fileId, container, config);
        }
    }

    /**
     * 直接替换单元格内容为图像
     * @param {HTMLElement|string} cellElement - td元素或选择器
     * @param {Object} options - 配置选项
     */
    async replaceWithImage(cellElement, options = {}) {
        const defaultOptions = {
            imageSize: '100px',
            showOriginalPath: true,
            showFileInfo: false,
            errorPlaceholder: '❌'
        };

        const config = { ...defaultOptions, ...options };

        // 获取元素
        const cell = typeof cellElement === 'string' ?
            document.querySelector(cellElement) : cellElement;

        if (!cell) {
            console.warn('未找到指定的 table cell 元素');
            return;
        }

        // 保存原始路径
        const originalPath = cell.textContent || cell.innerText;
        const fileId = this.extractFileIdFromPath(originalPath);

        if (!fileId) {
            console.warn('无法从路径中提取有效的文件ID:', originalPath);
            return;
        }

        // 显示加载状态
        cell.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; width: ${config.imageSize}; height: ${config.imageSize}; color: #666; font-size: 12px;">
                加载中...
            </div>
        `;

        try {
            // 获取图像（带重试机制）
            const result = await this.imageClient.fetchImageWithRetry(fileId, 1);

            // 构建显示内容
            let content = `
                <img src="${result.objectUrl}"
                     style="width: ${config.imageSize}; height: ${config.imageSize}; object-fit: cover; border-radius: 4px;"
                     alt="图像"
                     title="${originalPath}">
            `;

            if (config.showOriginalPath) {
                content += `<div style="font-size: 10px; color: #666; margin-top: 2px; max-width: ${config.imageSize}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${originalPath}</div>`;
            }

            if (config.showFileInfo) {
                const accessMethod = result.source === 'lan' ? '局域网' : 'WebRTC';
                const sizeFormatted = this.imageClient.constructor.formatBytes(result.size);
                content += `<div style="font-size: 9px; color: #999; margin-top: 1px;">${accessMethod} | ${sizeFormatted}</div>`;
            }

            cell.innerHTML = content;

        } catch (error) {
            console.error('图像加载失败:', error);
            cell.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; width: ${config.imageSize}; height: ${config.imageSize}; color: #f87171;">
                    ${config.errorPlaceholder}
                </div>
                ${config.showOriginalPath ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">${originalPath}</div>` : ''}
            `;
        }
    }

    /**
     * 批量替换表格中的图像路径为实际图像
     * @param {string} tableSelector - 表格选择器
     * @param {string} cellSelector - 包含图像路径的cell选择器
     * @param {Object} options - 配置选项
     */
    async replaceTableImagesWithActual(tableSelector, cellSelector, options = {}) {
        const table = document.querySelector(tableSelector);
        if (!table) {
            console.warn('未找到指定的表格:', tableSelector);
            return;
        }

        const cells = Array.from(table.querySelectorAll(cellSelector));
        console.log(`找到 ${cells.length} 个包含图像路径的单元格，开始串行替换为实际图像`);

        // 获取当前网络模式（已在页面初始化时检测）
        const networkMode = this.imageClient.getNetworkMode();
        console.log(`使用预检测的网络模式: ${networkMode === 'lan' ? '局域网' : 'WebRTC'}`);

        let successCount = 0;
        let failureCount = 0;

        // 串行处理每张图像
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const imageIndex = i + 1;

            console.log(`正在处理图像 ${imageIndex}/${cells.length}...`);

            try {
                // 串行传输，一张一张处理
                await this.replaceWithImage(cell, options);
                successCount++;
                console.log(`图像 ${imageIndex} 传输成功`);

                // 串行传输间隔，避免过于频繁的请求
                if (i < cells.length - 1) {
                    const delay = networkMode === 'lan' ? 100 : 200;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (error) {
                failureCount++;
                console.error(`图像 ${imageIndex} 传输失败:`, error.message);

                // 显示错误占位符
                this._showErrorPlaceholder(cell, error.message);

                // 即使失败也要延迟一下再处理下一张
                if (i < cells.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }

        // 清理连接
        if (this.imageClient && typeof this.imageClient.cleanupRemoteConnection === 'function') {
            this.imageClient.cleanupRemoteConnection();
        }

        console.log(`串行传输完成 - 成功: ${successCount}, 失败: ${failureCount}, 总计: ${cells.length}`);
    }


    /**
     * 显示错误占位符
     * @private
     */
    _showErrorPlaceholder(cell, errorMessage) {
        cell.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; width: 100px; height: 100px; color: #f87171; border: 1px dashed #f87171; border-radius: 4px; font-size: 12px; text-align: center;">
                ❌<br>加载失败
            </div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">${errorMessage}</div>
        `;
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('图像缓存已清理');
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.TableImageHelper = TableImageHelper;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableImageHelper;
}