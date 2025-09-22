<template>
  <s-i-select :model-value="modelValue?.department" :options="deptsOptions"
    :for="(isSearchMode ? 'search_' : '') + 'dept_input'" :rules="getRules()" lazy-rules
    @update:model-value="updateModelValue" @filter="handleDeptsFilter" label="部门" />
</template>
<script setup>
import SISelect from '../SISelect.vue';
import { ref } from 'vue'
import api from 'src/api/data';
const props = defineProps({
  modelValue: Object,
  mode: String
});
const deptsOptions = ref([])
const isSearchMode = props.mode === 'search'
const emit = defineEmits(['update:modelValue', 'fillFields']);
const getRules = () => {
  if (props.mode === 'search') return []
  return [val => !!val || '部门不能为空']
}
const updateModelValue = (value) => {
  if (!value) { value = { value: '' } }
  const newValue = { department: value.value }
  emit('update:modelValue', newValue)
  isSearchMode && emit('fillFields', newValue)
}
const handleDeptsFilter = (val, update) => {
  const condition = val.length > 0 ? { dep_name: val } : {}
  api.dataList('user/dep', condition).then(res => {
    deptsOptions.value = res.data.map(v => ({ label: v.dep_name, value: v.dep_name }))
    update(() => deptsOptions.value)
  })
}
</script>
