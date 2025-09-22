<template>
  <div class="si-input row q-gutter-sm">
    <div v-for="field in fields" :key="field"
      :class="field.name + ' ' + (field.type?.indexOf('addr') > -1 ? 'col-12 flex' : 'col-1')">
      <q-input :label="field.label" v-if="!field.type || ['text', 'date', 'textarea'].includes(field.type)" borderless
        clearable v-model="formData[field.name]" :type="field.type" :rules="[]" :filled="field.filled || false"
        :dense="field.dense || true" :for="'search_' + field.name" bg-color="primary" @blur="handleInputBlur()" />
      <q-input :label="field.label" v-else-if="field.type === 'number'" borderless v-model.number="formData[field.name]"
        type="number" :rules="[]" :filled="field.filled || false" :dense="field.dense || true"
        :for="'search_' + field.name" @blur="handleInputBlur()" />
      <component v-else :is="SIInputs[field.type]" v-model="formData[field.name]" :field-name="field.fields?.[0]"
        :extra="field.extra" @fill-fields="handleFillFields" mode="search" @initFormData="initFormData"
        :label="field.label" />
    </div>
    <q-space />
    <div class="col-1">
      <q-btn color="primary" rounded dense unelevated label="查询" @click="handleSearch()" />
      <q-btn color="grey-4" rounded dense unelevated label="重置" class="q-ml-sm reset-btn" @click="handleReset()" />
    </div>
  </div>
</template>
<script setup>
import SIInputs from './siinputs'
import { ref } from 'vue';

const emit = defineEmits(['fill-search', 'search']);
function handleFillFields(fieldData) {
  // 数据中转
  console.log('emit search components fieldData: ', fieldData)
  emit('fill-search', fieldData);
}
function handleInputBlur() {
  // 输入框失焦时触发
  console.log('handleInputBlur: ', formData);
  emit('fill-search', formData.value);
}
const props = defineProps({
  fields: {
    type: Array,
    default: () => []
  },
  param: {
    type: Object,
    default: () => ({})
  }
});
// 过滤掉param中的字段
const fields = props.fields.filter(field => !props.param || !Object.keys(props.param).includes(field.name));
console.log('searchFields: ', fields);
const formData = ref({ ...props.param });
// 初始化表单数据
const initFormData = (key) => {
  console.log('------initFormData: ', props.fields)
  props.fields.forEach(field => {
    if (key && key !== field.name) return;
    if (/_input$/.test(field.type) && field.fields) {
      formData.value[field.name] = field.fields.reduce((acc, key) => {
        // console.log("xxx search xxx", acc, key)
        acc[key] = ''
        return acc
      }, {})
    } else {
      formData.value[field.name] = field.default || ''
    }
  })
  console.log('initFormData: ', formData.value)
}
const handleSearch = () => {
  emit('search', formData.value);
}
const handleReset = () => {
  initFormData();
  emit('fill-search', null);
}
</script>
<style lang="scss" scoped>
.col-2 {
  margin-right: 10px;
}

.q-btn--rounded {
  width: 80px;
}

.reset-btn {
  color: $text-color !important;
}
</style>
