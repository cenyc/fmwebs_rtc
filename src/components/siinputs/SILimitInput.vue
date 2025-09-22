<!-- 权限组选择器 -->
<template>
  <q-select dense outlined clearable use-input :model-value="modelValue?.limits_name" :options="limitsOptions"
    :disable="selectedTenantId.length == 0" :for="(isSearchMode ? 'search_' : '') + 'limits_input'" :rules="getRules()"
    lazy-rules popup-content-class="br10" @update:model-value="updateModelValue" @filter="handleLimitsFilter"
    label="权限组名" />
</template>
<script setup>
import { ref } from 'vue';
import { useEventBus } from 'src/utils/event';
import api from 'src/api/data';
const { on } = useEventBus();
const emit = defineEmits(['update:modelValue', 'fillFields']);
const props = defineProps({
  modelValue: Object,
  mode: String
});
const isSearchMode = props.mode === 'search';
const limitsOptions = ref([]);
console.log('SIlimitsInput======', props.modelValue, emit);
const selectedTenantId = ref('')
on(props.mode + '-role->limit', (payload) => {
  console.log(props.mode + '-role->limit:', payload)
  selectedTenantId.value = payload
})
const getRules = () => {
  if (isSearchMode) return []
  return [val => !!val || '权限组不能为空']
}
const updateModelValue = (value) => {
  if (!value) value = { value: '', limits_id: '', tenant_id: '' };
  console.log('updateModelValue', value)
  emit('update:modelValue', { limits_name: value.value, limits_id: value.limits_id });
  // selectedTenantId.value = value.tenant_id;
  if (isSearchMode) {
    emit('fillFields', { limits_name: value.value });
  }
};

function handleLimitsFilter(val, update) {
  console.log('handleLimitsFilter', val, limitsOptions.value);
  // if (val.length < 1 && limitsOptions.value.length) {
  //   update(() => { })
  //   return;
  // };
  const condition = val ? { limits_name: val } : {};
  const tenant_id = selectedTenantId.value;
  if (tenant_id) condition.tenant_id = tenant_id;
  api.dataList('resource/limits', { page: 1, page_size: 50, ...condition }).then(res => {
    limitsOptions.value = res.data.map((item) => ({ label: item.limits_name + ' : ' + item.description, value: item.limits_name, limits_id: item.limits_id, tenant_id: item.tenant_id }));
    update(() => { });
  });
}
// onUnmounted(() => {
//   limitsOptions.value = [];
//   selectedTenantId.value = '';
// });
</script>
