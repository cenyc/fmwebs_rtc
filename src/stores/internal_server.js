import { defineStore } from 'pinia'
import { useConfigStore } from './config'
import apiLogin from 'src/api/data'

export const useInternalServerStore = defineStore('internal_server', {
  state: () => ({
    // 基础配置（来自 conf.json，可被租户覆盖）
    INTERNAL_IP: '',
    INTERNAL_PORT: 0,
    SIGNALING_URL: '',
    AUTH_URL: '',
    IMAGE_ENDPOINT: '',
    LAN_TIMEOUT_MS: 0,

    // 动态租户数据
    tenant_id: '',
    api_key: '',
    api_key_expires_time: '', // ISO 字符串或时间戳
    ip_private: '',

    // 元信息
    last_refreshed_at: 0
  }),
  getters: {
    effectiveInternalIp(state) {
      // 优先使用租户私网IP；conf.json 可无 INTERNAL_IP
      return state.ip_private || state.INTERNAL_IP || ''
    },
    isApiKeyExpired: (state) => (bufferSeconds = 60) => {
      if (!state.api_key_expires_time) return true
      const expires = typeof state.api_key_expires_time === 'number'
        ? state.api_key_expires_time
        : Date.parse(state.api_key_expires_time)
      if (!expires || Number.isNaN(expires)) return true
      const now = Date.now()
      return now >= (expires - bufferSeconds * 1000)
    }
  },
  actions: {
    // 从 conf.json 载入默认配置
    loadDefaultsFromConfig() {
      const cfg = useConfigStore()
      if (cfg.internal_server) {
        const s = cfg.internal_server
        this.INTERNAL_IP = s.INTERNAL_IP || this.INTERNAL_IP
        this.INTERNAL_PORT = s.INTERNAL_PORT || this.INTERNAL_PORT
        this.SIGNALING_URL = s.SIGNALING_URL || this.SIGNALING_URL
        this.AUTH_URL = s.AUTH_URL || this.AUTH_URL
        this.IMAGE_ENDPOINT = s.IMAGE_ENDPOINT || this.IMAGE_ENDPOINT
        this.LAN_TIMEOUT_MS = s.LAN_TIMEOUT_MS || this.LAN_TIMEOUT_MS
      }
    },

    setTenant(tenant_id) {
      this.tenant_id = tenant_id
    },

    setApiKey({ api_key, expires_time }) {
      if (api_key) this.api_key = api_key
      if (expires_time) this.api_key_expires_time = expires_time
    },

    setClientIp(ip_private) {
      if (ip_private) this.ip_private = ip_private
    },

    async refreshFromBackend(tenant_id, token) {
      try {
        if (!tenant_id) return false
        this.setTenant(tenant_id)
        // 读取租户内部机访问 ApiKeys（type == 1）— 使用登录服务端
        const keysRes = await apiLogin.dataList('apikey', { tenant_id, type: 1, page: 1, page_size: 1 })
        if (keysRes && Array.isArray(keysRes.data) && keysRes.data.length > 0) {
          const k = keysRes.data[0]
          this.setApiKey({ api_key: k.api_key || k.key || '', expires_time: k.expires_time || k.expires_at || '' })
        }
        // 读取租户 Client 私网 IP（使用 fetch，避免全局 axios 错误提示）
        const cfg = useConfigStore()
        const base = cfg.main_server?.replace(/\/$/, '') || ''
        if (base) {
          const url = `${base}/stream/client/query?tenant_id=${encodeURIComponent(tenant_id)}&page=1&page_size=1`
          const resp = await fetch(url, {
            headers: token ? { Authorization: `token ${token}` } : undefined,
            cache: 'no-store'
          })
          if (resp.ok) {
            const cli = await resp.json()
            if (cli && Array.isArray(cli.data) && cli.data.length > 0) {
              const c = cli.data[0]
              this.setClientIp(c.ip_private || c.private_ip || '')
            }
          }
        }
        this.last_refreshed_at = Date.now()
        return true
      } catch (err) {
        void err
        // 静默失败
        return false
      }
    },

    async getValidApiKey(tenant_id, token) {
      // 确保已加载默认配置
      if (!this.SIGNALING_URL) this.loadDefaultsFromConfig()
      if (tenant_id && tenant_id !== this.tenant_id) {
        await this.refreshFromBackend(tenant_id, token)
      } else if (this.isApiKeyExpired(60)) {
        await this.refreshFromBackend(this.tenant_id, token)
      }
      return this.api_key || ''
    }
  },
  persist: true
})


