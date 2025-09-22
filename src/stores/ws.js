import { defineStore } from 'pinia'
import { $error, $success, $dialog } from 'src/utils/notify'
import { useConfigStore } from './config'
import { useUserStore } from './user'
import { copy2Clipboard } from 'src/utils/tools';
import api from 'src/api/main'
const configStore = useConfigStore()
const userStore = useUserStore()
export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    isConnected: false,
    messages: [],
    socket: null,
    alert: null,
    custom: null,
    item: null,
    unread: 0,
    page: 1,
    opened: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    reconnectInterval: 3000,
    typeOptions: [],
    // localTypeId: 0,
  }),
  getters: {
    recentMessages: (state) => state.messages.slice(-10), // 最近10条消息
    latestMessage: (state) =>
      state.messages.length > 0 ? state.messages[state.messages.length - 1] : null
  },
  actions: {
    connect(url = configStore.main_server + 'ws/alert') {
      try {
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          console.log('WebSocket 连接成功')
          this.getProfilesType()
          this.getAlerts()
        }

        this.socket.onmessage = (event) => {
          try {
            this.custom = null;
            this.unread++
            this.page = 1
            this.alert = JSON.parse(event.data)
            // this.localTypeId = this.alert.profile_type_id
            this.alert.action === '弹窗' && (this.opened = true)
            this.alert.alarm_sound === '系统提示音' && this.playSound()
            // this.add-Message({
            //   type: data.type || 'message',
            //   content: data,
            //   timestamp: Date.now()
            // })
          } catch (error) {
            console.error('消息解析错误:', error)
          }
        }

        this.socket.onclose = () => {
          this.isConnected = false
          this.handleReconnection()
        }

        this.socket.onerror = (error) => {
          console.error('WebSocket 错误:', error)
        }
      } catch (error) {
        console.error('WebSocket 连接失败:', error)
        this.handleReconnection()
      }
    },
    disconnect() {
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }
      this.isConnected = false
      console.log('WebSocket 连接已关闭')
    },
    send(data) {
      if (this.isConnected && this.socket) {
        const message = typeof data === 'string' ? data : JSON.stringify(data)
        this.socket.send(message)
      } else {
        console.warn('WebSocket 未连接，无法发送消息')
      }
    },
    getMessagePreview(message) {
      if (typeof message.content === 'string') {
        return message.content.length > 50
          ? message.content.substring(0, 50) + '...'
          : message.content
      } else if (typeof message.content === 'object') {
        return JSON.stringify(message.content).length > 50
          ? JSON.stringify(message.content).substring(0, 50) + '...'
          : JSON.stringify(message.content)
      }
      return '新消息'
    },
    handleReconnection() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++
          console.log('尝试重新连接...')
          this.connect()
        }, this.reconnectInterval)
      } else {
        $error('WebSocket 连接失败，已达到最大重试次数')
      }
    },
    addMessage(message) {
      // 更新未读消息数
      this.unread++
      this.opened = true
      this.messages.push(message)
      console.log('收到新消息:', message, '当前未读消息数:', this.unread)
      // 保持最多10条消息（可根据需要调整）
      if (this.messages.length > 10) {
        this.messages = this.messages.slice(-10)
      }

      // 保存到 localStorage
      // saveMessagesToLocalStorage()

      // 显示最新消息通知
      // showNotification(message)
    },
    clearMessages() {
      this.messages = []
    },
    getProfilesType(tenant_id) {
      if (!tenant_id) {
        tenant_id = userStore.tenant_id
      }
      api.dataList('fs/profiles/type', {
        tenant_id, // ,
        enabled: 1,
      }).then(res => {
        const standardTenantId = '00000000-0000-0000-0000-000000000000'
        if (res.data.length === 0) {
          if (tenant_id !== standardTenantId) {
            return this.getProfilesType(standardTenantId)
          }
          this.typeOptions = []
        } else {
          console.log('人员类型', res)
          this.typeOptions = res.data.map(item => ({ label: `${item.type_name.substring(0, 5)}`, value: item.id }))
        }
      })
    },
    getAlerts() {
      if (this.page > this.unread) return
      api.dataList('fs/alerts', {
        tenant_id: userStore.tenant_id,
        status: 0,
        page: this.page,
        page_size: 1
      }).then(res => {
        console.log('获取警报', res)
        if (res.total) {
          this.unread = res.total
          this.alert = res.data[0]
          // this.localTypeId = this.alert.profile_type_id
        } else {
          this.unread = 0
          this.alert = null
          // this.localTypeId = null
          this.page = 1
        }
      })
    },
    openAlert() {
      this.item = null
      this.custom = null
      this.opened = true
    },
    updateAlert(status = 1) {
      const alert = this.custom || this.alert
      api.dataUpdate('fs/alerts', {
        id: alert.id,
        profile_type_id: alert.profile_type_id,
        status,
      }).then(res => {
        console.log('更新警报', res)
        this.item && (this.item.status = status)
        $success('已成功' + (status === 1 ? '处理' : '忽略') + '警报')
        this.opened = false
        this.page = 1
        !this.custom && this.getAlerts()
      })
    },
    handleAlert(item) {
      console.log('xxxx', this.alert, item);
      this.item = item;
      this.custom = {
        capture_image_url: item.capture_image_url,
        matched_profile_id: item.matched_profile_id,
        created_time: item.capture_time || item.created_time,
        location: item.device_location || item.location,
        profile_type_id: item.type_id || item.profile_type_id,
        id: item.alert_id || item.id,
        level: item.alert_level,
      }
      this.opened = true;
    },
    copyUrl() {
      const userAgent = navigator.userAgent;
      let url = 'chrome://settings/content/sound'
      if (/Edg\//i.test(userAgent)) {
        url = 'edge://settings/privacy/sitePermissions/allPermissions/mediaAutoplay'
      }
      copy2Clipboard(url)
    },
    // 播放系统提示音
    playSound(hasAlert = false) {
      const audio = new Audio('/src/assets/sound.mp3')
      audio.muted = true; // 初始静音
      audio.play()
        .then(() => audio.muted = false)
        .catch(error => {
          console.error('播放失败', error)
          hasAlert && $dialog('播放失败', '由于您的浏览器设置，系统提示音无法播放。<br>请点击<b class="text-primary"> 确定 </b>按钮 <b class="text-negative">自动复制网址</b>，手动在新标签页打开，<br>允许自动播放音频或者添加白名单。', this.copyUrl)
        });
    }
  },
  persist: {
    storage: sessionStorage,
    key: 'alert',
    pick: ['alert', 'unread', 'typeOptions'],
  },
})
