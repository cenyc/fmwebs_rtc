import { defineBoot } from '#q-app/wrappers'

export default defineBoot(async () => {
  try {
    // 先加载分片工具
    if (!window.WebRTCChunker) {
      await import('../utils/webrtc_chunker.js')
    }
    // 加载客户端与表格助手
    if (!window.ImageAccessClient) {
      await import('../utils/image_access_client.js')
    }
    if (!window.TableImageHelper) {
      await import('../utils/table_image_helper.js')
    }
  } catch (e) {
    // 静默失败，组件内会有兜底方案
    console.warn('预加载图像助手失败:', e)
  }
})


