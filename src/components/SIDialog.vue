<template>
  <q-dialog v-model="showDialog" persistent @before-show="initFormData">
    <q-card :style="cardStyle" flat class="q-pa-md">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn icon="close" outline round dense v-close-popup />
      </q-card-section>
      <q-card-section v-if="mode === 'delete'">
        <div class="text-subtitle2">确定要删除 <b class="text-negative">{{ formData[props.deleteField] || 'id 为 ' +
          props.initialData.id + ' 的数据' }}</b>
          吗？
        </div>
      </q-card-section>
      <q-card-section v-else>
        <q-form v-if="customForm" ref="formRef" @submit="onSubmit">
          <slot name="custom-form" :props="formData"></slot>
        </q-form>
        <q-form v-else ref="formRef" @submit="onSubmit" class="row">
          <!-- 动态渲染表单字段 -->
          <template v-for="field in fields" :key="field.name">
            <div v-if="field.name != 'id'" :class="`si-input border q-pl-md col-${defaultSpan || field.span || 12}`">
              <!-- 文本输入框 -->
              <label :style="`width:${labelWidth}`" :for="field.name"><span v-if="field.required">*</span>{{ field.label
                }}</label>
              <q-input :label="field.label"
                v-if="!field.type || ['text', 'password', 'date', 'textarea'].includes(field.type)" borderless
                lazy-rules v-model="formData[field.name]" :type="showPassword ? 'text' : field.type"
                :rules="getRules(field)" :filled="field.filled || false" :dense="field.dense || true" :for="field.name"
                bg-color="primary">
                <template v-if="field.type === 'password'" #append>
                  <q-icon size="16px" :name="'svguse:icons.svg#' + (showPassword ? 'visibility' : 'visibility_off')"
                    class="cursor-pointer" @click="showPassword = !showPassword" />
                </template>
              </q-input>

              <!-- 数字输入框 -->
              <q-input :label="field.label" v-else-if="field.type === 'number'" borderless
                v-model.number="formData[field.name]" type="number" :rules="field.rules" :filled="field.filled || false"
                :dense="field.dense || true" :for="field.name" />

              <!-- 下拉选择框 -->
              <q-select v-else-if="field.type === 'select'" v-model="formData[field.name]" :options="field.options"
                :rules="field.rules" filled dense emit-value map-options popup-content-class="br10" />

              <!-- 日期选择器 -->
              <q-input :label="field.label" v-else-if="field.type === 'datetime'" borderless
                v-model="formData[field.name]" type="datetime-local" :rules="field.rules" dense />

              <!-- 文本域 -->
              <q-input :label="field.label" v-else-if="field.type === 'textarea'" v-model="formData[field.name]"
                type="textarea" :rules="field.rules" filled dense />

              <!-- 文件上传 -->
              <q-file v-else-if="field.type === 'file'" v-model="formData[field.name]" filled dense />

              <!-- 开关 -->
              <q-toggle v-else-if="field.type === 'toggle'" v-model="formData[field.name]" />

              <!-- 自定义组件 -->
              <component :label="field.label" :is="SIInputs[field.type]" v-else v-model="formData[field.name]"
                :mode="mode" :field-name="field.fields?.[0]" :extra="field.extra" :rules="field.rules"
                @fill-fields="handleFillFields" />
            </div>
          </template>
        </q-form>
      </q-card-section>

      <q-card-actions class="q-pa-lg">
        <q-btn rounded unelevated size="md" padding="3px 36px" :label="isDeleteMode ? '确认' : '保存'" type="submit"
          color="primary" class="q-mr-lg" :loading="submitting" @click="onSubmit" />
        <q-btn rounded unelevated size="md" padding="3px 36px" label="取消" color="gray-btn-color" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { rules } from '../utils/rules'
import SIInputs from './siinputs'
import { formatDate } from '../utils/tools'
import fieldTool from '../utils/fields'
const submitting = ref(false)
const showPassword = ref(false)
const props = defineProps({
  modelValue: Boolean, // 控制对话框显示
  fields: { // 表单字段配置
    type: Array,
    required: true,
    default: () => []
  },
  initialData: { // 初始数据（编辑模式时传入）
    type: Object,
    default: () => ({})
  },
  mode: { // 模式：'add' 或 'edit'
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'delete'].includes(value)
  },
  title: { // 对话框标题
    type: String,
    default: ''
  },
  width: { // 对话框宽度
    type: String,
    default: ''
  },
  labelWidth: { // 标签宽度
    type: String,
    default: ''
  },
  // 删除模式使用的字段
  deleteField: {
    type: String,
    default: ''
  },
  // 是否自定义表单
  customForm: {
    type: Boolean,
    default: false
  },
  // 默认字段布局
  defaultSpan: {
    type: Number,
    default: 0
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])
const isDeleteMode = computed(() => props.mode === 'delete')
const fields = computed(() => props.fields.filter(
  field => fieldTool.isExcludeField(field.name, props.mode) === false
))
console.log('isDeleteMode', isDeleteMode)
const cardStyle = computed(() => ({
  minWidth: isDeleteMode.value ? '400px' : (props.fields.length > 6 ? '900px' : props.width)
}))
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
// const dialogTitle = computed(() => {
//   return (props.mode === 'add' ? '新增' : '编辑') + props.title
// })
const formRef = ref(null)
const formData = ref({})

// 初始化表单数据
const initFormData = () => {
  const data = {}
  props.fields.forEach(field => {
    if (/_input$/.test(field.type) && field.fields) {
      data[field.name] = field.fields.reduce((acc, key) => {
        // console.log("xxxxx", acc, key)
        acc[key] = props.initialData?.[key] || ''
        return acc
      }, {})
    } else {
      // 时间格式化
      if (field.type === 'datetime' && props.initialData[field.name])
        data[field.name] = formatDate(props.initialData[field.name])
      else if (field.type === 'toggle')
        data[field.name] = props.initialData[field.name]
      else
        data[field.name] = props.initialData[field.name] || field.default || ''
    }
  })
  // 添加id字段
  if (props.mode === 'edit') {
    data['id'] = props.initialData.id
  }
  formData.value = data
}

// 监听显示状态变化
// watch(() => props.modelValue, (val) => {
//   if (val) initFormData()
// })
const getRules = (field) => {
  // 处理特殊情况
  if (field.name === 'confirmPassword') {
    return rules.confirmPassword(formData.value['newPassword'], true, '请再次输入新密码')
  } else {
    return field.rules || []
  }
}
// 填充字段
const handleFillFields = (fieldData) => {
  for (const key in fieldData) {
    console.log('handleFillFields', key, fieldData[key])
    formData.value[key] = fieldData[key]
  }
}
// 提交表单
const onSubmit = async () => {
  submitting.value = true
  try {
    if (isDeleteMode.value) return emit('submit', {
      data: { id: props.initialData.id, delete_flag: '1' },
      mode: props.mode
    })
    const valid = await formRef.value.validate()
    if (valid) {
      // 还原自定义组件的表单数据
      const customData = {}
      for (const field of props.fields) {
        if (/_input$/.test(field.type)) {
          for (const key in formData.value[field.name]) { //of field.fields
            console.log('key:', key, field.name)
            // formData.value[field.name][key] = formData.value[key + '_' + field.name] || ''
            const customField = formData.value[field.name][key]
            if (typeof customField === 'object' && customField !== null) {
              // console.log('customField 正值:', JSON.stringify(customField))
              customData[key] = customField.value || customField;
            } else {
              customData[key] = customField;
            }
          }
          // 删除自定义组件的表单数据
          // delete formData.value[field.name]
        } else {
          customData[field.name] = formData.value[field.name]
        }
      }
      // 强制填充id
      if (props.mode === 'edit') {
        customData.id = props.initialData.id
      }
      console.log('表单数据:', customData)
      emit('submit', {
        data: customData,
        mode: props.mode
      })
      // showDialog.value = false
    }
  } finally {
    submitting.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  resetForm: initFormData
})
</script>
<style lang="scss" scoped>
span {
  color: $negative;
}

.q-card {
  border: 1px solid $border-color;
  border-radius: 20px;
}
</style>
