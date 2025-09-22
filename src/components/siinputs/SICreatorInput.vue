<template>
  <s-i-select emit-value map-options :model-value="modelValue?.username" :options="usersOptions"
    :for="(isSearchMode ? 'search_' : '') + 'creator_input'" :rules="[]" @update:model-value="updateModelValue"
    @filter="handleUsersFilter" @new-value="handleNewValue" label="操作人" />
</template>
<script setup>
import SISelect from '../SISelect.vue';
import { ref } from 'vue';
import api from 'src/api/data';

const emit = defineEmits(['update:modelValue', 'fillFields']);
const props = defineProps({
  modelValue: Object,
  mode: String
});
const isSearchMode = props.mode === 'search';
const usersOptions = ref([]);
console.log('SICreatorInput======', props.modelValue, emit);
const updateModelValue = (value) => {
  if (!value) value = { value: '' };
  else { value = { value } }
  console.log('updateModelValue', value)
  const username = value.value;
  emit('update:modelValue', { username });
  emit('fillFields', { creator: username });
}
// 处理用户输入新值
const handleNewValue = (val, done) => {
  console.log('handleNewValue = ', val)
  // usersOptions.value 是个对象数组，所以不能用 includes 方法来判断是否包含某个值
  if (val.length > 0 && !usersOptions.value.some(item => item.value === val)) {
    usersOptions.value.push({ label: val, value: val })
    updateModelValue({ label: val, value: val });
    // return;
  }
  done(val)
}
function handleUsersFilter(val, update) {
  update(() => {
    console.log('handleLimitsFilter', val, usersOptions.value);
    api.dataList('user', { page: 1, page_size: 50, username: val }).then(res => {
      if (res.data.length === 0) {
        usersOptions.value = [{ label: val, value: val }];
        return;
      }
      usersOptions.value = res.data.map((item) => ({ label: item.username + ' : ' + item.department, value: item.username }));
    });
  });
}
</script>
