/**
 * 常用验证规则集合
 */
import api from '../api/data'
import xxtea from "src/utils/xxtea"
import { useConfigStore } from 'src/stores/config'
import { useUserStore } from 'src/stores/user'
const configStore = useConfigStore()
const userStore = useUserStore()
export const rules = {
  // 必填验证
  required: (message = '此项为必填项') => [
    val => !!val || message
  ],

  // 用户名验证
  username: (required = true, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || val.length >= 3 || '用户名至少3个字符',
    val => !val || val.length <= 20 || '用户名不能超过20个字符',
    val => !val || /^[a-zA-Z0-9_]+$/.test(val) || '只能包含字母、数字和下划线'
  ],

  // 邮箱验证
  email: (required = true, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '请输入有效的邮箱地址'
  ],

  // 手机号验证(中国)
  phone: (required = false, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || /^1[3-9]\d{9}$/.test(val) || '请输入有效的手机号码'
  ],

  // 密码验证
  password: (required = true, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || val.length >= 6 || '密码至少6位',
    // val => !val || /[A-Z]/.test(val) || '必须包含至少一个大写字母',
    // val => !val || /[a-z]/.test(val) || '必须包含至少一个小写字母',
    // val => !val || /[0-9]/.test(val) || '必须包含至少一个数字'
  ],

  // 确认密码验证(需传入原始密码的ref)
  confirmPassword: (passwordRef, required = true, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || val === passwordRef || '两次输入的密码不一致'
  ],

  // 数字范围验证
  numberRange: (min, max, required = false) => [
    ...(required ? rules.required() : []),
    val => val === null || val === '' || !isNaN(val) || '必须输入数字',
    val => val === null || val === '' || (val >= min && val <= max) || `数值必须在${min}-${max}之间`
  ],

  // 6位数字验证码验证
  code: (required = true, message) => [
    ...(required ? rules.required(message) : []),
    val => !val || /^\d{6}$/.test(val) || '验证码为6位数字'
  ],

  // URL验证
  url: (required = false) => [
    ...(required ? rules.required() : []),
    val => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val) || '请输入有效的URL'
  ],

  // 自定义正则验证
  regex: (pattern, message, required = false) => [
    ...(required ? rules.required() : []),
    val => !val || pattern.test(val) || message
  ],
  /**
   * 生成带动态参数的验证规则
   * @param {...any} args 规则参数
   * @returns {Array} 验证规则数组
   */
  create: (...args) => {
    return rules.regex(...args)
  },
  // 长度范围验证
  lengthRange: (min, max, required = false) => [
    ...(required ? rules.required() : []),
    val => !val || (val.length >= min && val.length <= max) || `长度必须在${min}-${max}个字符之间`
  ],
  /**
   * 验证旧密码是否正确（异步）
   * @param {Ref} passwordRef 当前密码的ref引用
   * @param {Function} errorCallback 错误回调函数
   * @returns {Array} 验证规则数组
   */
  oldPassword: () => {
    return [
      val => !!val || '请输入旧密码',
      async val => {
        try {
          // 调用API验证旧密码
          const dataStr = JSON.stringify({
            login_name: userStore.name,
            password: val
          })
          const encrypt_data = xxtea.encryptToBase64(dataStr, configStore.key)
          const response = await api.dataPost('user/passswd/check', encrypt_data)
          if (response.message === 'success') {
            // 更新token
            userStore.token = response.data
            return true
          }
          // 假设API返回 { valid: true } 表示验证通过
          return '旧密码不正确'
        } catch (error) {
          // 错误处理
          let message = '验证旧密码时出错';
          if (error.response?.data?.message === 'failed') {
            message = '旧密码不正确'
          }
          // errorCallback?.(message) // 如果有错误回调则调用
          return message
        }
      }
    ]
  }
}
// 在组件中组合多个规则
// import { rules } from '@/utils/rules'

// 自定义组合规则
// const customRules = [
//   ...rules.required('自定义必填消息'),
//   ...rules.lengthRange(5, 20),
//   ...rules.create(rules.regex, /^[a-z]+$/, '只能包含小写字母')
// ]
