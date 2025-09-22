<template>
  <q-page class="flex flex-center login-page">
    <!-- 注册卡片 -->
    <q-card flat>
      <q-card-section class="text-left q-pt-xl">
        <div class="text-h6 text-weight-bold logo-title">注册账号</div>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md q-mt-lg">
          <label for="login_name"><span class="text-negative">*</span>登录名</label>
          <q-input outlined v-model="registerForm.login_name" type="text" for="login_name"
            :rules="rules.username(true, '请输入登录名')" lazy-rules placeholder="请输入登录名" />
          <label for="phonenum"><span class="text-negative">*</span>手机号</label>
          <q-input ref="phoneRef" outlined v-model="registerForm.phonenum" type="text" for="phonenum"
            :rules="rules.phone(true, '请输入手机号')" lazy-rules placeholder="请输入手机号">
            <template #prepend>
              <div class=" text-subtitle1">+86</div>
            </template>
          </q-input>
          <label for="verify_code"><span class="text-negative">*</span>验证码</label>
          <q-input outlined v-model="registerForm.code" type="text" for="verify_code" :rules="rules.required('请输入验证码')"
            lazy-rules placeholder="输入验证码">
            <template #append>
              <q-btn flat :label="codeLabel" :disable="countdown > 0 || loading" @click="handleSendCode"
                color="primary" />
            </template>
          </q-input>
          <label for="password"><span class="text-negative">*</span>登录密码</label>
          <q-input outlined v-model="registerForm.password" :type="showPassword ? 'text' : 'password'" for="password"
            :rules="rules.password(true, '密码不能为空')" lazy-rules placeholder="设置您的登录密码">
            <template #append>
              <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>
          <label for="password_confirm"><span class="text-negative">*</span>确认登录密码</label>
          <q-input outlined v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" for="password_confirm"
            :rules="rules.confirmPassword(registerForm.password, true, '请再次输入密码')" lazy-rules placeholder="请再次输入登录密码">
            <template #append>
              <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>
          <label for="enterprise">您的企业名称</label>
          <q-input outlined v-model="registerForm.supplier" type="text" for="enterprise" lazy-rules
            placeholder="输入您的企业名称(选填)" />
          <label for="email">邮箱</label>
          <q-input outlined v-model="registerForm.email" type="text" for="email" :rules="rules.email(false)" lazy-rules
            placeholder="输入您的邮箱(选填)" />
          <q-checkbox v-model="agreement" label="阅读并同意《服务条款》《法律声明》《隐私政策》" style="margin-top:0" />
          <div class="q-mt-lg">
            <q-btn unelevated label="同意协议并注册" type="submit" color="primary" class="full-width vibrant-btn"
              :loading="loading">
              <template v-slot:loading>
                <q-spinner-pie class="on-left" />
                正在验证...
              </template>
            </q-btn>
            <p class="q-mt-sm">
              <q-btn style="margin-top:-3px" dense flat label="返回登录页" color="primary" to="/login" />
            </p>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref, computed } from 'vue'
import { rules } from 'src/utils/rules'
import { $error, $success } from 'src/utils/notify'
import { useRouter } from 'vue-router'
import api from 'src/api/data'
const router = useRouter()
const loading = ref(false)
const agreement = ref(false)
const showPassword = ref(false)
const confirmPassword = ref('')
const phoneRef = ref(null)
const countdown = ref(0)
// 表单数据
const registerForm = ref({
  login_name: '',
  phonenum: '',
  code: '',
  password: '',
  supplier: '',
  email: ''
})
const codeLabel = computed(() => {
  return countdown.value > 0 ? `${countdown.value}秒后重试` : '获取验证码'
})
const handleSendCode = () => {
  if (countdown.value > 0) return
  if (!phoneRef.value.validate()) return
  loading.value = true
  api.dataGet('user/reback/code', {
    phonenum: registerForm.value.phonenum,
    regnew: '1'
  }).then(() => {
    $success('验证码已发送，请注意查收')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  }).finally(() => { loading.value = false })
}
const handleRegister = () => {
  console.log('新用户注册：', registerForm.value)
  if (agreement.value === false) { return $error('请先阅读并同意《服务条款》《法律声明》《隐私政策》'); }
  loading.value = true
  api.dataPost('register', registerForm.value).then(() => {
    $success('用户注册成功', () => { router.push('/login') })
  }).finally(() => {
    loading.value = false
  })
}
</script>
