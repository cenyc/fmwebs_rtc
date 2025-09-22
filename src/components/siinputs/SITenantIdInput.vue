<template>
  <s-i-select :model-value="supplier" :options="tenantsOptions"
    :for="(isSearchMode ? 'search_' : '') + 'tenant-id_input'" :rules="getRules()" lazy-rules
    @update:model-value="updateModelValue" @filter="handleTenantsFilter" label="租户ID" />
</template>
<script setup>
import { computed, ref } from 'vue'
import SISelect from '../SISelect.vue';
import api from 'src/api/data';
const props = defineProps({
  modelValue: Object,
  mode: String
});
const tenantsOptions = ref([])
const supplier = computed({
  get: () => props.modelValue?.tenant_name,
  set: (value) => { emit('update:modelValue', value) }
})
const isSearchMode = props.mode === 'search'
const emit = defineEmits(['update:modelValue', 'fillFields']);
// const { send } = useEventBus()
const getRules = () => {
  if (isSearchMode) return []
  return [val => !!val || '租户ID不能为空']
}
const fillFields = (newValue) => {
  if (!isSearchMode) return
  emit('fillFields', newValue)
  // send(props.mode + '_type_id', newValue)
}
const updateModelValue = (value) => {
  if (!value) { supplier.value = { tenant_id: '' }; isSearchMode && fillFields({ tenant_id: '' }); return }
  supplier.value = value
  const newValue = { tenant_id: value.tenant_id }
  emit('update:modelValue', { ...newValue, tenant_name: value.label })
  fillFields(newValue)
}
const handleTenantsFilter = (val, update) => {
  const condition = val.length > 0 ? { supplier: val } : {}
  api.dataList('customer', condition).then(res => {
    tenantsOptions.value = res.data.map(v => ({ label: v.supplier, value: v.supplier, tenant_id: v.tenant_id }))
    update(() => tenantsOptions.value)
  })
}
!isSearchMode && props.modelValue.tenant_id && api.dataList('customer', { tenant_id: props.modelValue.tenant_id }).then(res => {
  console.log('取到租户名称：', res.data[0].supplier)
  supplier.value = { tenant_id: res.data[0].tenant_id, tenant_name: res.data[0].supplier }
})
</script>
