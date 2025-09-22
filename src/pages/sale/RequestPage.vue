<template>
  <q-img src="~assets/request.png" class="absolute-full"></q-img>
  <q-page class="q-pa-md bg-request flex flex-center">
    <q-form @submit.prevent="handleRequest" class="q-gutter-md q-mt-lg">
      <div class="text-h4 text-center text-bold q-pb-xl">请反馈您的需求，让我们更好地为您服务</div>

      <div class="si-input q-pb-md border">
        <label for="supplier"><span class="text-negative">*</span>您的公司名称</label>
        <q-input v-model="requestForm.supplier" for="supplier" borderless rounded lazy-rules
          :rules="[val => !!val || '请输入公司名称']" placeholder="请填写您的公司名称" />
      </div>
      <div class="si-input q-pb-md border">
        <label for="username"><span class="text-negative">*</span>您的姓名</label>
        <q-input v-model="requestForm.username" for="username" borderless rounded lazy-rules
          :rules="[val => !!val || '请输入姓名']" placeholder="请填写您的姓名" />
      </div>
      <div class="si-input q-pb-md border">
        <label for="phonenum"><span class="text-negative">*</span>联系电话</label>
        <q-input v-model="requestForm.phonenum" for="phonenum" borderless rounded lazy-rules
          :rules="[val => !!val || '请输入联系电话']" placeholder="便于我们工作人员与您联系" />
      </div>
      <div class="si-input q-pb-md border">
        <label for="email"><span class="text-negative">*</span>邮箱</label>
        <q-input v-model="requestForm.email" for="email" borderless rounded lazy-rules
          :rules="[val => !!val || '请输入邮箱']" placeholder="便于我们工作人员与您联系" />
      </div>
      <div class="si-input q-pb-md border">
        <label for="addr_input"><span class="text-negative">*</span>选择省市区</label>
        <SIAddrInput v-model="requestForm.addr" popup-size="md" />
      </div>
      <div class="si-input q-pb-md border">
        <label for="message">留言</label>
        <q-input v-model="requestForm.message" type="textarea" for="message" autogrow borderless lazy-rules
          placeholder="请简单描述您的具体需求" />
      </div>
      <div class="si-input q-pt-lg" style="margin-top:250px;">
        <q-checkbox v-model="agreement" label="阅读并同意《服务条款》《法律声明》《隐私政策》" />
      </div>
      <div class="q-mt-lg">
        <q-btn unelevated rounded label="提 交" type="submit" color="primary" :loading="loading"
          style="width:300px;margin-left:100px">
          <template v-slot:loading>
            <q-spinner-pie class="on-left" />
            正在提交...
          </template>
        </q-btn>
      </div>
    </q-form>
  </q-page>
</template>
<script setup>
import { ref } from 'vue'
import SIAddrInput from 'src/components/siinputs/SIAddrInput.vue';
import { $dialog } from 'src/utils/notify';
import api from 'src/api/data'
const loading = ref(false)
const agreement = ref(false)
const requestForm = ref({})
// 展开地址选择器
const handleAddr = (val) => {
  Object.keys(val).forEach((key) => {
    requestForm.value[key] = val[key].value
  })
}
const handleRequest = () => {
  if (agreement.value) {
    loading.value = true
    handleAddr(requestForm.value.addr)
    api.dataNew('service/demands', { ...requestForm.value, addr: undefined }).then(() => {
      $dialog('提交成功', '您的需求已提交成功，我们会尽快与您联系！')
      requestForm.value = {}
    }).finally(() => {
      loading.value = false
    })
  } else {
    $dialog('提示', '请阅读并同意《服务条款》《法律声明》《隐私政策》')
  }
}
</script>
<style lang="scss" scoped>
.bg-request {
  background: none no-repeat center center / cover !important;
  color: $text-color;

  label span {
    display: inline-block !important;
    margin-right: 5px !important;
  }

  :deep(.q-field--outlined .q-field__control) {
    background: #fff;
    margin-top: 10px;
    margin-bottom: 8px;
  }

  :deep(.si-input) {


    .q-field__control {
      // min-height: 56px !important;
      min-width: 300px !important;
      background-color: #fff !important;
    }

    .q-field--auto-height.q-field--dense .q-field__control {
      min-width: 75px !important;
    }

    .q-textarea .q-field__control {
      min-width: 500px !important;
      min-height: 300px !important;
      border-radius: 10px !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
      overflow: scroll;
    }
  }
}
</style>
