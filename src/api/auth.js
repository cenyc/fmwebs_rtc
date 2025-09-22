import { login_server as api } from "src/boot/axios";

export default {
  checkPhone(phone) {
    return api.get('/user/phone/account', phone)
  },
  // 登录
  signin(credentials) {
    return api.post('/signin', credentials)
  },
  refreshToken() {
    return api.post('/token')
  },
  // 获取用户信息
  getMe() {
    return api.get('/auth/me')
  },
  getMenuList(parameter) {
    return api.get('/menu/list', parameter)
  },
  // 登出
  logout(parameter) {
    return api.post('/logout', parameter)
  }
};
