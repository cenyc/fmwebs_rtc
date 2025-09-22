<!-- 人员类型选择器 -->
<template>
  <s-i-select emit-value map-options :model-value="modelValue?.[fieldName]" :options="typesOptions"
    :for="(isSearchMode ? 'search_' : '') + fieldName" :rules="getRules()" lazy-rules
    @update:model-value="updateModelValue" @filter="handleProfilesFilter" @new-value="handleNewValue" />
</template>
<script setup>
import SISelect from '../SISelect.vue';
import { ref } from 'vue';
import { useUserStore } from 'src/stores/user';
import api from 'src/api/main';
const userStore = useUserStore();
const props = defineProps({
  modelValue: Object,
  fieldName: String,
  extra: Object,
  mode: String
});
console.log('props.extra', props.extra);
const emit = defineEmits(['update:modelValue', 'fillFields']);
console.log('modelValue', props.modelValue);
const isSearchMode = props.mode === 'search';
const typesOptions = ref([]);
const getRules = () => {
  if (isSearchMode) return []
  return [val => !!val || '人员类型不能为空']
}
const updateModelValue = (value) => {
  // if (!value) value = { [props.fieldName]: '' };
  console.log('updateModelValue', value)
  emit('update:modelValue', { [props.fieldName]: value });

  if (isSearchMode) {
    emit('fillFields', { [props.fieldName]: value });
  }
};
const handleNewValue = (val, done) => {
  console.log('handleNewValue = ', val)
  done({ label: val, value: val })
}
function handleProfilesFilter(val, update) {
  console.log('handleProfilesFilter', val, typesOptions.value);
  const condition = {}
  val && (condition[props.extra.label] = val);
  userStore.is_system == '2' && (condition.tenant_id = userStore.tenant_id);
  api.dataList('fs/profiles' + props.extra.dir, { page: 1, page_size: 50, ...condition }).then(res => {
    update(() => {
      if (res.data.length === 0) {
        typesOptions.value = [{ label: val, value: val }];
        return;
      }
      typesOptions.value = res.data.map((item) => ({ label: `${item[props.extra.label]} (${item.id})`, value: item.id }));
    });
  });
}
</script>
