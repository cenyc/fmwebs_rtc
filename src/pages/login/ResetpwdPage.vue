<template>
  <q-page class="flex flex-center login-page">
    <!-- 重置密码卡片 -->
    <q-card flat>
      <q-card-section class="text-left q-pt-xl">
        <div class="row">
          <div class="col-6 cursor-pointer text-primary" :class="{ 'text-h6 text-weight-bold logo-title': isMobile }"
            @click="isMobile = true; resetpwdForm.email = ''">手机号找回密码</div>
          <div class="col-6 cursor-pointer text-right text-primary"
            :class="{ 'text-h6 text-weight-bold logo-title': !isMobile }"
            @click="isMobile = false; resetpwdForm.phonenum = ''">
            邮箱找回密码
          </div>
        </div>
        <q-form @submit.prevent="handleResetpwd" class="q-gutter-md q-mt-lg">
          <label for="login_name">账号</label>
          <q-input v-if="isMobile" outlined ref="phoneRef" v-model="resetpwdForm.phonenum" type="text" for="login_name"
            :rules="rules.phone(true, '请输入手机号')" lazy-rules placeholder="请输入手机号">
            <template #prepend>
              <div class=" text-subtitle1">+86</div>
            </template>
          </q-input>
          <q-input v-else outlined ref="emailRef" v-model="resetpwdForm.email" type="text" for="login_name"
            :rules="rules.email(true, '邮箱不能为空')" lazy-rules placeholder="请输入邮箱" />
          <label for="verify_code">验证码</label>
          <q-input outlined v-model="resetpwdForm.code" type="text" for="verify_code"
            :rules="rules.code(true, '请输入验证码')" lazy-rules placeholder="输入验证码">
            <template #append>
              <q-btn flat :label="codeLabel" :disable="countdown > 0 || loading" @click="handleSendCode"
                color="primary" />
            </template>
          </q-input>
          <label for="password">新密码</label>
          <q-input outlined v-model="resetpwdForm.password" :type="showPassword ? 'text' : 'password'" for="password"
            :rules="rules.password(true, '新密码不能为空')" lazy-rules placeholder="设置新密码">
            <template #append>
              <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>
          <label for="password_confirm">确认新密码</label>
          <q-input outlined v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" for="password_confirm"
            :rules="rules.confirmPassword(resetpwdForm.password, true, '请再次输入新密码')" lazy-rules placeholder="请再次输入新密码">
            <template #append>
              <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>
          <div class="q-mt-lg">
            <q-btn unelevated label="提 交" type="submit" color="primary" class="full-width vibrant-btn"
              :loading="loading">
              <template v-slot:loading>
                <q-spinner-pie class="on-left" />
                正在提交...
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
import { useRouter } from 'vue-router'
import { rules } from 'src/utils/rules'
import api from 'src/api/data'
import { $success } from 'src/utils/notify'
const router = useRouter()
const loading = ref(false)
const isMobile = ref(true)
const phoneRef = ref(null)
const emailRef = ref(null)
const showPassword = ref(false)
const confirmPassword = ref('')
const countdown = ref(0)
// 表单数据
const resetpwdForm = ref({
  phonenum: '',
  email: '',
  code: '',
  password: ''
})
const codeLabel = computed(() => {
  return countdown.value > 0 ? `${countdown.value}秒后重试` : '获取验证码'
})
const handleSendCode = () => {
  if (countdown.value > 0) return
  let condition = null
  if (isMobile.value) {
    if (!phoneRef.value.validate()) return
    condition = { phonenum: resetpwdForm.value.phonenum }
  } else {
    if (!emailRef.value.validate()) return
    condition = { email: resetpwdForm.value.email }
  }
  loading.value = true

  api.dataGet('user/reback/code', condition).then(res => {
    console.log('发送验证码：', res)
    $success('验证码已发送，请注意查收')
    setTimeout(() => {
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value === 0) clearInterval(timer)
      }, 1000)
    }, 1000)
  }).finally(() => {
    loading.value = false
  })
}
const handleResetpwd = () => {
  console.log('重置密码：', resetpwdForm.value)
  loading.value = true
  api.dataPost('user/reback/password', resetpwdForm.value).then(() => {
    $success('密码重置成功', () => { router.push('/login') })
  }).finally(() => {
    loading.value = false
  })
}
</script>
