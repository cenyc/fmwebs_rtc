<template>
  <q-page class="flex flex-center login-page">
    <!-- 主登录卡片 -->
    <q-card flat>
      <q-card-section class="text-left q-pt-xl">
        <div class="text-h6 text-weight-bold logo-title q-mb-lg">使用账号登录</div>
        <label for="phonenum">手机号</label>
        <q-input v-model="loginForm.phonenum" for="phonenum" filled lazy-rules :rules="phoneRules(true, '请输入手机号')"
          placeholder="请输入手机号" />
        <q-form @submit.prevent="handleLogin" class="q-gutter-md q-mt-none">
          <label for="login_name">账号</label>
          <!-- <q-input v-model="loginForm.login_name" for="login_name" filled lazy-rules
            :rules="rules.username(true, '请输入登录名')" placeholder="请输入登录账号" /> -->
          <q-select v-model="loginForm.login_name" use-input filled emit-value map-options :options="filteredOptions"
            style="padding-bottom:20px" popup-content-class="br10" @filter="filterOptions" @new-value="handleNewValue"
            :placeholder="loginForm.login_name ? '' : '选择或输入账号'">
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section style="flex-direction:row">
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.value }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.expired }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template #no-option>
              <q-item>
                <q-item-section>
                  <q-item-label class="text-amber-2">
                    没有找到匹配项
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <label for="password">密码</label>
          <q-input v-model="loginForm.password" for="password" filled :type="showPassword ? 'text' : 'password'"
            lazy-rules :rules="rules.password(true, '密码不能为空')" style="padding-bottom:5px" placeholder="请输入登录密码">
            <template #append>
              <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>

          <div class="flex justify-between items-center q-mt-md">
            <q-checkbox v-model="loginForm.remember" label="记住密码" color="primary" />
            <q-btn flat label="忘记密码?" color="primary" to="/login/resetpwd" />
          </div>

          <div class="q-mt-lg">
            <q-btn unelevated label="登 录" type="submit" color="primary" class="full-width vibrant-btn"
              :loading="loading">
              <template v-slot:loading>
                <q-spinner-pie class="on-left" />
                正在验证...
              </template>
            </q-btn>
            <p class="q-mt-sm">
              <label for="login-btn">还没有账号？</label>
              <q-btn id="login-btn" style="margin-top:-3px" dense flat label="立即注册" color="primary"
                to="/login/register" />
            </p>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from 'src/stores/config'
import { useUserStore } from 'src/stores/user'
import { $success, $error } from 'src/utils/notify'
import { rules } from 'src/utils/rules'
import api from 'src/api/auth'
import xxtea from 'src/utils/xxtea'
import { formatDate } from 'src/utils/tools'
const router = useRouter()
const configStore = useConfigStore()
const userStore = useUserStore()
const redirect = router.currentRoute.value.query.redirect || "/";
const showPassword = ref(false)
const loading = ref(false)
// 表单数据
const loginForm = ref({
  phonenum: '',
  login_name: '',
  password: '',
  remember: false
})
const loginNames = ref([])
const filteredOptions = ref([])
// 检查本地存储是否有记住的密码
onMounted(() => {
  if (configStore.remember !== "") {
    try {
      const remember = xxtea.decryptFromBase64(configStore.remember, configStore.key)
      const credentials = JSON.parse(remember)
      loginForm.value = credentials
      if (loginForm.value.phonenum) {
        console.log('phonenum = ', loginForm.value.phonenum)
        getPhone(loginForm.value.phonenum)
      }
    } catch (e) {
      console.error('解析保存的凭证失败:', e)
    }
  }
})
const getPhone = async (val) => {
  try {
    if (!val) return true
    const res = await api.checkPhone({ phonenum: val })
    // console.log('res = ', res)
    if (res.code === 100000 && res.data.length > 0) {
      // 更新 login_name
      loginNames.value = res.data.map(item => ({
        label: item.username,
        value: item.login_name,
        expired: formatDate(item.deleted_at) + '到期'
      }))
      return true
    }
    return !res || '手机号不存在'
  } catch (error) {
    console.log('error = ', error)
    return '手机号验证失败'
  }
}
// 手机验证
const phoneRules = (required = true, message) => [
  ...rules.phone(required, message),
  getPhone
]
// 过滤选项的方法
const filterOptions = (val, update) => {
  update(() => {
    if (val === '') {
      filteredOptions.value = loginNames.value
    } else {
      const needle = val.toLowerCase()
      filteredOptions.value = loginNames.value.filter(
        v => v.value.toLowerCase().includes(needle)
      )
    }
  })
}
// 处理用户输入新值
const handleNewValue = (val, done) => {
  console.log('handleNewValue = ', val)
  if (val.length < 3 || val.length > 20) {
    return $error('用户名至少3个字符，不能超过20个字符')
  }
  // loginNames.value 是个对象数组，所以不能用 includes 方法来判断是否包含某个值
  if (val.length > 0 && !loginNames.value.some(item => item.value === val)) {
    loginNames.value.push({ label: val, value: val, expired: '' })
  }
  done(val)
}
// 登录处理
const handleLogin = () => {
  loading.value = true

  userStore.login(loginForm.value).then(res => {
    if (res.code === 100000) {
      $success(res.message)
      // console.log('router = ', router.getRoutes())
      router.push(redirect)
    } else {
      console.log('res = ', res)
      $error({ message: res.message })
    }
  }).catch(err => {
    console.log('errerr = ', err)
    // $error(err)
  }).finally(() => {
    loading.value = false
  })
}
</script>
<style lang="scss" scoped>
.q-item__label {
  width: 25%;
  line-height: 2.4em !important;


}

.q-item__label:last-child {
  width: 50% !important;
  text-align: right;
}
</style>
