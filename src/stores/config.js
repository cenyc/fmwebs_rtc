import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    login_server: '',
    main_server: '',
    eyes_server: '',
    internal_server: {
      // INTERNAL_IP 可为空（使用租户私网IP优先）
      INTERNAL_IP: '',
      INTERNAL_PORT: 0,
      SIGNALING_URL: '',
      AUTH_URL: '',
      IMAGE_ENDPOINT: '',
      LAN_TIMEOUT_MS: 0
    },
    key: '',
    theme: 'light',
    remember: '',
    icons: [],
    columns: {}
  }),
  actions: {
    setTheme(theme) {
      this.theme = theme;
    },
    setIcons(icons) {
      this.icons = icons;
    },
    setConfig(config) {
      this.login_server = config.default_server_config.login_server.base_url;
      this.main_server = config.default_server_config.main_server.base_url;
      this.eyes_server = config.default_server_config.eyes_server.base_url;
      if (config.default_server_config.internal_server) {
        this.internal_server = { ...config.default_server_config.internal_server };
      }
      this.key = config.key;
    },
  },
  persist: true
});
