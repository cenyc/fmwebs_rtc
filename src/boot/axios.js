import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useConfigStore } from 'src/stores/config'
import { useUserStore } from 'src/stores/user'
import { $error } from 'src/utils/notify'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ timeout: 5000 })
// 添加请求拦截器
api.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    // 统一注入token
    const user = useUserStore()
    if (user.token) {
      config.headers['Authorization'] = 'token ' + user.token
    }
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
api.interceptors.response.use(
  function (response) {
    // 对响应数据做点什么
    // return response
    const { code, message, data } = response.data
    // 根据返回的code值来做不同的处理（和后端约定）
    // eyes_server 返回数据没有 code字段，此处兼容处理
    if (code === 100000 || code === undefined || data) {
      return response.data
    } else {
      // token超时
      const res = response.data
      if (res && res.code === 401) {
        // TODO 超时退出
        console.log("超时退出1")
        useUserStore().removeUser()
      }
      // 业务错误
      if (message) {
        const err = new Error(message)
        $error(err.message)
        return Promise.reject(err)
      }
      // 未知错误
      return Promise.reject(new Error('未知错误'))
    }
  },
  function (error) {
    // 对响应错误做点什么
    // token超时
    if (error.response && error.response.data &&
      (error.response.data.code === 10104 || error.response.data.code === 20105)) { //401 20105
      // TODO 超时退出
      console.log("超时退出2")
      useUserStore().removeUser()
    }
    console.log("error=", error)
    const err = new Error(error.response?.data.error || error.message)
    $error(err.message || err.toString())
    return Promise.reject(error)
  }
)

function get(url, params, baseURL) {
  return api.get(url, {
    baseURL: baseURL,
    params
  })
}

function post(url, data, baseURL) {
  return api.post(url, data, {
    baseURL: baseURL
  })
}

const get_server = (server) => {
  return {
    get: (url, params) => {
      return get(url, params, useConfigStore()[server])
    },
    post: (url, data) => {
      return post(url, data, useConfigStore()[server])
    }
  }
}
const login_server = get_server('login_server')
const main_server = get_server('main_server')
const eyes_server = get_server('eyes_server')

export default defineBoot((/*{ app }*/) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  // app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  // app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  // app.provide('api', api)
  const userStore = useUserStore()
  if (userStore.token) {
    console.log('====已有token，不再初始化API服务====')
    return;
  }
  const configStore = useConfigStore()
  console.log('====初始化API服务====')
  // 异步加载配置文件
  async function fetchConfig() {
    const response = await fetch('/conf.json?t=' + Date.now())
    const config = await response.json()
    console.log('====初始化配置====', config)
    configStore.setConfig(config)
  }
  fetchConfig()

  /**
 * 从SVG字符串中提取所有symbol的ID
 * @param {string} svgString - SVG文件内容
 * @returns {string[]} symbol ID数组
 */
  function getSymbolIdsFromSvgString(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const symbols = doc.querySelectorAll('symbol');
    return Array.from(symbols).map(symbol => symbol.id);
  }
  fetch('icons.svg')
    .then(response => response.text())
    .then(svgString => {
      const symbolIds = getSymbolIdsFromSvgString(svgString);
      console.log('====所有symbol ID:====', symbolIds);
      configStore.setIcons(symbolIds);
    })
    .catch(error => console.error('加载SVG失败:', error));
})

export { login_server, main_server, eyes_server }
