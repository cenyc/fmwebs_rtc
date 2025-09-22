import { defineStore } from "pinia";
import { addDynamicRoute } from "src/router";
import { useConfigStore } from './config'
import auth from "src/api/auth";
import main from 'src/api/main'
import xxtea from "src/utils/xxtea";
const options = {
  state: () => ({
    token: '',
    id: '',
    name: '',
    username: '',
    phonenum: '',
    tenant_id: '',
    is_system: '',
    menu: {},
    home: '',
    avatar: 'src/assets/avatar.png',
    refreshTimer: null,
    tokenTime: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    setUser(user) {
      this.id = user.id
      this.name = user.login_name
      this.token = user.data
      this.tokenTime = new Date().getTime()
      this.username = user.username
      this.phonenum = user.phonenum
      this.tenant_id = user.tenant_id
      this.is_system = user.is_system
      this.setAvatar(user.id)
    },
    setAvatar(userId) {
      // 处理头像
      main.dataGet('obs/files/share', { img_parent: userId + '.png' }).then(res => {
        console.log('文件信息', res)
        // 判断 url是不是图片
        fetch(res.data.url).then(response => {
          if (response.headers.get('content-type').includes('image')) {
            this.avatar = res.data.url
          } else {
            console.log('头像不是图片', response.headers.get('content-type'))
          }
        })
      })
    },
    removeUser() {
      // ✅ 同时清除内存状态和存储数据
      this.$reset()
      options.persist.storage.removeItem(options.persist.key)
      location.reload()
    },
    setRoutes() {
      // console.log("menu = ", Object.keys(this.menu))
      let hasHome = false, hasChildren = false;
      const page = str => `${str[0].toUpperCase()}${str.slice(1)}`;
      for (let item in this.menu) {
        let parent = {}, children = []
        // console.log('item = ', this.menu[item])
        const main = this.menu[item].main
        // console.log('main = ', main)
        if (this.menu[item].sub) {
          this.menu[item].sub.forEach(subItem => {
            const menu_arr = subItem.menu_name.split('_')
            // 如果有多个_ 则合并到 menu_arr[1]
            if (menu_arr.length > 2) {
              for (let i = 2; i < menu_arr.length; i++) {
                menu_arr[1] += page(menu_arr[i])
              }
            }
            children.push({
              path: hasHome ? ('/' + subItem.menu_name) : '',
              name: subItem.menu_number,
              meta: { title: subItem.description },
              component: () => import(`src/pages/${menu_arr[0]}/${page(menu_arr[1])}Page.vue`)
            })
            // console.log("subItem = ", subItem)
            if (!hasHome) { this.home = subItem.menu_name }
            hasHome = true;
          })
          parent = {
            path: '/' + (hasChildren ? main.menu_name : ''),
            component: () => import('src/layouts/MainLayout.vue'),
          }
          hasChildren = true;
        } else {
          // continue;
          children.push({
            path: '',
            name: main.menu_number + '00',
            component: () => import(`src/pages/${page(main.menu_name)}Page.vue`)
          })
          parent = {
            path: '/' + (main.menu_name),
            component: () => import('src/layouts/MainLayout.vue'),
          }
        }
        // console.log('children = ', children)
        // const redirect = isHome ? '/home' : '/' + this.menu[item].sub[0].menu_name

        parent.name = main.menu_number
        parent.component = () => import('src/layouts/MainLayout.vue') //shallowRef(layout)
        parent.children = children

        // console.log('parent = ', parent)
        addDynamicRoute(parent)
      }
    },
    getMenu() {
      return new Promise((resolve, reject) => {
        auth.getMenuList().then(res => {
          if (res.data && res.data.length > 0) {
            res.data.forEach(item => {
              // console.log("item = ", item)
              if (/*item.leader_id.trim() == '' &&*/ item.level == '1') {
                this.menu[item.menu_number] = { main: item }
              } else {
                if (this.menu[item.leader_id]) {
                  this.menu[item.leader_id].sub = this.menu[item.leader_id].sub || []
                  this.menu[item.leader_id].sub.push(item)
                }
              }
            });
            // 判断 this.menu = {}
            if (Object.keys(this.menu).length == 0) {
              reject("menu数据错误，请联系管理员！")
              this.logout()
              return;
            }
            this.setRoutes()
            resolve(res)
          } else {
            // const err = { message: "menu数据为空，请联系管理员！" }
            reject("menu数据为空，请联系管理员！")
            this.logout()
          }
        }).catch(err => {
          reject(err)
          // $err-or(err)
          this.logout()
        })
      })
    },
    login(data) {
      // const loginForm = {}
      // // 判断data.login_name是不是大陆手机号
      // if (data.login_name && data.login_name.length == 11) {
      //   // 判断是不是大陆手机号
      //   const reg = /^1[3-9]\d{9}$/
      //   // /^(13[0-9]|14[01456789]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
      //   if (!reg.test(data.login_name)) {
      //     loginForm.login_name = data.login_name
      //   } else {
      //     loginForm.phonenum = data.login_name
      //   }
      // } else {
      //   loginForm.login_name = data.login_name
      // }
      // loginForm.password = data.password
      // loginForm.remember = data.remember
      const dataStr = JSON.stringify(data)
      console.log('加密前的 Login 数据', dataStr)
      return new Promise((resolve, reject) => {
        const configStore = useConfigStore()
        // TODO Data加密
        const encrypt_data = xxtea.encryptToBase64(dataStr, configStore.key) //abcdef
        console.log('加密后的 Login 数据', encrypt_data)
        auth.signin(encrypt_data).then(res => {
          console.log('加密后的 Login 返回', res)
          // 记住密码
          if (data.remember) {
            configStore.remember = encrypt_data;
          } else {
            configStore.remember = '';
          }
          // 设置token
          this.setUser(res)
          this.getMenu().then(() => {
            resolve(res);
          }).catch(err => {
            console.log('getMenu 错误', err)
            reject(err);
          })
        }).catch(err => {
          console.log('加密后的 Login 错误', err)
          reject(err);
        });
      });
    },
    // 刷新 token
    async refreshToken() {
      try {
        const res = await auth.refreshToken()
        console.log('refreshToken 返回', res)
        this.token = res.data
        this.tokenTime = new Date().getTime()
        return true
      } catch (err) {
        console.log('refreshToken 错误', err)
        this.$reset()
        options.persist.storage.removeItem(options.persist.key)
        return false
      }
    },
    startTokenRefresh() {
      // 先清除已有定时器
      this.stopTokenRefresh()
      // 根据tokenTime计算下一次刷新时间
      const now = new Date().getTime()
      const timeDiff = 550000 - now + this.tokenTime
      console.log('距离下一次刷新时间：', timeDiff)
      this.refreshTimer = setTimeout(async () => {
        const success = await this.refreshToken()
        if (!success) {
          this.stopTokenRefresh()
        } else {
          // 重新设置定时器
          this.startTokenRefresh()
        }
      }, timeDiff)
    },
    // 停止 token 刷新
    stopTokenRefresh() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    logout() {
      return new Promise((resolve, reject) => {
        auth.logout({
          "login_name": this.name
        }).then(res => {
          this.removeUser();
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      })
    }
  },
  // 持久化设置
  persist: {
    storage: sessionStorage,	//修改存储位置
    key: 'user',	//设置存储的key,在这里是存在sessionStorage时的键
    pick: ['token', 'tokenTime', 'id', 'name', 'username', 'phonenum', 'tenant_id', 'is_system', 'menu', 'avatar'],	//指定要持久化的字段
  },
}
export const useUserStore = defineStore("user", options)
