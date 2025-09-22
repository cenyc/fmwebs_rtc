import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    login_server: '',
    main_server: '',
    eyes_server: '',
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
      this.key = config.key;
    },
  },
  persist: true
});
