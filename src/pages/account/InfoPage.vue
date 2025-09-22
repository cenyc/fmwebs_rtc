<template>
  <q-page class="q-pa-md">
    <p>酒店账号信息</p>
    <q-card flat>
      <q-card-section>
        <div class=" text-subtitle2">酒店名称：<span>{{ userInfo.tenant_info?.supplier || '无' }}</span>
        </div>
      </q-card-section>
      <q-card-section class="q-pb-xl">
        <div class="row">
          <div class="col-1">
            <!-- 头像 -->
            <q-avatar size="100px" class="float-left">
              <img :src="userStore.avatar" />
              <q-badge color="white" align="top" class="absolute-bottom-right" rounded>
                <q-file ref="fileInput" accept="image/*" @update:model-value="convertToBase64" style="display:none" />
                <q-icon name="svguse:icons.svg#camera" color="primary" size="16px" @click="fileInput.pickFiles()" />
              </q-badge>
            </q-avatar>
          </div>
          <div class="col-11 account-info">
            <div class="row q-pa-md q-mb-lg">
              <div class="col-3 flex items-center">
                <label class="text-subtitle2" for="login_name">登录名：</label>
                <span v-if="!reon.login_name">
                  {{ userInfo.account.login_name }}<q-icon v-if="tempInfo.account.login_name != 'admin'" class="q-ml-sm"
                    color="primary" size="14px" name="svguse:icons.svg#edit" @click="handleEdit('login_name')" />
                </span>
                <q-input v-else for="login_name" :ref="(el) => refs['login_name'] = el" :readonly="!reon.login_name"
                  :rules="rules.username()" v-model="tempInfo.account.login_name" borderless dense>
                  <template #append>
                    <q-btn color="primary" size="sm" label="确定" dense unelevated hide-bottom-space
                      @click="handleUpdate('account', 'login_name')" />
                  </template>
                </q-input>
              </div>
              <div class="col-3 flex items-center">
                <label class="text-subtitle2">登录密码：</label>
                <span>{{ userInfo.account?.password ? '已设置' : '待设置' }}</span>
                <q-icon class=" q-ml-sm" color="primary" size="14px" name="svguse:icons.svg#edit"
                  @click="showFormDialog = true" />
                <SIDialog v-model="showFormDialog" :fields="formFields" :initial-data="currentItem" mode="edit"
                  title="设置密码" width="500px" label-width="80px" @submit="handleFormSubmit" />
              </div>
              <div class="col-3 flex items-center">
                <label class="text-subtitle2">账号ID：</label>
                <span>{{ userInfo.account.id }}</span>
                <q-icon class="q-ml-sm" color="primary" size="14px" name="svguse:icons.svg#copy" @click="copyText" />
              </div>
              <div class="col-3 flex items-center">
                <label class="text-subtitle2" for="email">安全邮箱：</label>
                <span v-if="!reon.email">
                  {{ userInfo.account.email }}<q-icon class="q-ml-sm" color="primary" size="14px"
                    name="svguse:icons.svg#edit" @click="handleEdit('email')" />
                </span>
                <q-input v-else for="email" :ref="(el) => refs['email'] = el" :readonly="!reon.email"
                  :rules="rules.email()" v-model="tempInfo.account.email" borderless dense>
                  <template #append>
                    <q-btn color="primary" size="sm" label="确定" dense unelevated hide-bottom-space
                      @click="handleUpdate('account', 'email')" />
                  </template>
                </q-input>
              </div>
              <div class="col-3 flex items-center" v-if="userInfo.tenant_info">
                <label class="text-subtitle2" for="contacts">账号联系人：</label>
                <span v-if="!reon.contacts">
                  {{ userInfo.tenant_info?.contacts }}<q-icon class="q-ml-sm" color="primary" size="14px"
                    name="svguse:icons.svg#edit" @click="handleEdit('contacts')" />
                </span>
                <q-input v-else for="contacts" :ref="(el) => refs['contacts'] = el" :readonly="!reon.contacts"
                  :rules="rules.required()" v-model="tempInfo.tenant_info.contacts" borderless dense>
                  <template #append>
                    <q-btn color="primary" size="sm" label="确定" dense unelevated hide-bottom-space
                      @click="handleUpdate('tenant_info', 'contacts')" />
                  </template>
                </q-input>
              </div>
              <div class="col-3 flex items-center" v-if="userInfo.tenant_info">
                <label class="text-subtitle2" for="phone_num">联系人电话：</label>
                <span v-if="!reon.phone_num">
                  {{ userInfo.tenant_info?.phone_num }}<q-icon class="q-ml-sm" color="primary" size="14px"
                    name="svguse:icons.svg#edit" @click="handleEdit('phone_num')" />
                </span>
                <q-input v-else for="phone_num" :ref="(el) => refs['phone_num'] = el" :readonly="!reon.phone_num"
                  :rules="rules.phone()" v-model="tempInfo.tenant_info.phone_num" borderless dense>
                  <template #append>
                    <q-btn color="primary" size="sm" label="确定" dense unelevated hide-bottom-space
                      @click="handleUpdate('tenant_info', 'phone_num')" />
                  </template>
                </q-input>
              </div>
              <div class="col-3 flex items-center">
                <label class="text-subtitle2">注册时间：</label>
                <span>{{ formatDate(userInfo.account.created_at) || '-'
                }}</span>
              </div>
              <div class="col-3 flex items-center" v-if="false">
                <label class="text-subtitle2">验证码登录： </label>
                <q-toggle v-model="tempInfo.account.is_sms" color="primary"
                  @update:model-value="handleUpdate('account', 'is_sms', $event)" />
              </div>
              <div class="col-3 flex items-center">
                <label class="text-subtitle2">上次登录：</label>
                <span>{{ userInfo.account.device_time || '-' }}</span>
              </div>
              <div class="col-3 flex items-center" v-if="userInfo.tenant_info">
                <label class="text-subtitle2">客户地址：</label>
                <span>{{ userInfo.tenant_info?.full_address || '-' }}</span>
              </div>
            </div>
            <div class="row q-pa-md" v-if="userInfo.tenant_info">
              <div class="col-1">
                <div class="text-subtitle2 q-pt-sm">开票信息</div>
              </div>
              <div class="col-11">
                <div class="row">
                  <div class="col-3 flex items-center">
                    <label for="supplier"><em>企业名称</em></label>
                    <span v-if="!reon.supplier && tempInfo.tenant_info.supplier === ''">-</span>
                    <q-input v-else for="supplier" :ref="(el) => refs['supplier'] = el" :readonly="!reon.supplier"
                      :rules="rules.required()" v-model="tempInfo.tenant_info.supplier" borderless dense
                      placeholder="请输入企业名称" />
                  </div>
                  <div class="col-3 flex items-center">
                    <label for="tax_num"><em>纳税人识别号</em></label>
                    <span v-if="!reon.supplier && tempInfo.tenant_info.tax_num === ''">-</span>
                    <q-input v-else for="tax_num" :readonly="!reon.supplier" v-model="tempInfo.tenant_info.tax_num"
                      borderless dense placeholder="请输入纳税人识别号" />
                  </div>
                  <div class="col-3 flex items-center">
                    <label for="address"><em>单位地址</em></label>
                    <span v-if="!reon.supplier && tempInfo.tenant_info.address === ''">-</span>
                    <q-input v-else for="address" :readonly="!reon.supplier" v-model="tempInfo.tenant_info.address"
                      borderless dense placeholder="请输入单位地址" />
                  </div>
                  <div class="col-3 text-right">
                    <q-icon v-if="!reon.supplier" class="q-ml-sm" color="primary" size="14px"
                      name="svguse:icons.svg#edit" @click="handleEdit('supplier')" />
                  </div>
                  <div class="col-3 flex items-center">
                    <label for="telephone"><em>电话</em></label>
                    <span v-if="!reon.supplier && tempInfo.tenant_info.telephone === ''">-</span>
                    <q-input v-else for="telephone" :readonly="!reon.supplier" v-model="tempInfo.tenant_info.telephone"
                      borderless dense placeholder="请输入电话" />
                  </div>
                  <div class="col-3 flex items-center">
                    <label for="bank_name"><em>开户银行</em></label>
                    <span v-if="!reon.supplier && tempInfo.tenant_info.bank_name === ''">-</span>
                    <q-input v-else for="bank_name" :readonly="!reon.supplier" v-model="tempInfo.tenant_info.bank_name"
                      borderless dense placeholder="请输入开户银行" />
                  </div>
                  <div class="col-3 flex items-center">
                  </div>
                  <div class="col-3 q-mt-md text-right">
                    <q-btn v-if="reon.supplier" color="primary" size="sm" label="确定" dense unelevated hide-bottom-space
                      @click="handleUpdate('tenant_info', 'supplier')" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref, nextTick } from 'vue'
import { formatDate } from 'src/utils/tools'
import api from 'src/api/data'
import main from 'src/api/main'
import SIDialog from 'src/components/SIDialog.vue'
import { $success } from 'src/utils/notify'
import { rules } from 'src/utils/rules'
import { useUserStore } from 'src/stores/user'
const userStore = useUserStore()
const base64Image = ref('')
const fileInput = ref(null)
const userInfo = ref({ account: {}, tenant_info: {} })
const tempInfo = ref({ account: {}, tenant_info: {} })
const refs = ref({})
const reon = ref({})
const showFormDialog = ref(false)
const currentItem = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const formFields = ref([
  {
    name: 'oldPassword',
    label: '旧密码',
    type: 'password',
    rules: rules.oldPassword(userStore.name),
  }, {
    name: 'newPassword',
    label: '新密码',
    type: 'password',
    rules: rules.password(true, '请输入新密码'),
  }, {
    name: 'confirmPassword',
    label: '确认密码',
    type: 'password',
  }
])
const handleFormSubmit = ({ data }) => {
  console.log('表单提交', data)
  api.dataPost('user/passswd/update', {
    id: data.id,
    password: data.newPassword
  }).then(() => {
    $success('更新成功！')
    showFormDialog.value = false
  })
}
const convertToBase64 = (file) => {
  if (!file) return

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    base64Image.value = reader.result
    // 更新头像
    main.dataPost('header/file/upload/img', {
      img_parent: userInfo.value.account.id + '.png',
      image_base64: base64Image.value,
    }).then(res => {
      console.log('上传结果', res)
      userStore.avatar = base64Image.value
      $success('更新成功！')
    })
  }
  reader.onerror = (error) => {
    console.error('Error converting file:', error)
  }
}
api.dataGet('user/account/info').then(res => {
  console.log('账户信息', res)
  userInfo.value = res.data
  tempInfo.value = JSON.parse(JSON.stringify(userInfo.value))
  currentItem.value.id = userInfo.value.account.id
})
const handleEdit = async (key) => {
  console.log('编辑', key, refs.value[key])
  reon.value = { [key]: true }
  await nextTick()
  refs.value[key]?.focus()
}
const handleUpdate = (dic, key, val) => {
  // 处理验证
  if (val !== undefined) {
    tempInfo.value[dic][key] = val
  } else {
    if (!refs.value[key]?.validate()) return
  }

  let dir = 'user/account'
  let id = userInfo.value.account.id
  const condition = {}
  if (dic != 'account') {
    dir = 'customer'
    id = userInfo.value.tenant_info.id
    if (key === 'supplier') {
      const tempDic = tempInfo.value[dic]
      condition.tax_num = tempDic.tax_num
      condition.address = tempDic.address
      condition.telephone = tempDic.telephone
      condition.bank_name = tempDic.bank_name
    }
  }

  console.log('更新', tempInfo.value[dic], key)
  api.dataPost(dir + '/update', {
    id: id,
    [key]: tempInfo.value[dic][key],
    ...condition
  }).then(res => {
    console.log('更新结果', res)
    $success('更新成功！')
    userInfo.value[dic][key] = tempInfo.value[dic][key]
    // 遍历处理condition中的数据
    for (const k in condition) {
      userInfo.value[dic][k] = tempInfo.value[dic][k]
    }
  }).catch(() => {
    tempInfo.value[dic][key] = userInfo.value[dic][key]
    // 遍历处理condition中的数据
    for (const k in condition) {
      tempInfo.value[dic][k] = userInfo.value[dic][k]
    }
  }).finally(() => {
    reon.value = {}
  })
}
// 拷贝到剪贴板
const copyText = () => {
  navigator.clipboard.writeText(userInfo.value.account.id).then(() => {
    $success('已成功复制到剪贴板')
  })
}
</script>
<style lang="scss" scoped>
span {
  font-weight: normal;
}

em {
  font-style: normal;
  margin-right: 20px;
  color: #727272
}

label {
  min-width: 105px;
  padding-bottom: 0 !important;
  line-height: 40px;
}

.q-icon {
  cursor: pointer;
}

.q-btn {
  border-radius: 50px;
  padding: 5px 15px;
  font-size: 12px !important;
}

:deep(.q-toggle) {
  .q-toggle__thumb {
    width: 18px;
    height: 18px;
    top: 9px;
  }

  .q-toggle__inner {
    padding: 0.2em 0.26em;
  }

  .q-toggle__track {
    height: 20px;
    border-radius: 10px;
  }
}


.account-info>.row {
  border: 1px solid #f0f0f0;
  border-radius: 20px;
}

body.body--light {
  .account-info>.row {
    color: $text-color;
  }
}

.col-3 {

  // padding: 10px 0;
  :deep(.q-field__bottom) {
    padding: 0 !important;

    .q-field__messages {
      text-align: left !important;
    }
  }

  // :deep(.q-toggle .relative-position) {
  //   position: absolute;
  // }
}
</style>
