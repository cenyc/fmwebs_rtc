<template>
  <q-option-group :options="options" type="radio" v-model="group" inline dense @update:model-value="updateModelValue" />
</template>
<script setup>
import { ref } from 'vue';
const props = defineProps({
  modelValue: Object,
  mode: String
});
const emit = defineEmits(['update:modelValue']);
// console.log("用户类型选择器：", props.modelValue);
const options = [
  { label: '管理员', value: '1' },
  { label: '一般员工', value: '2' },
  { label: '内置管理员', value: '3' }
];
const group = ref(props.modelValue.ismanager);
const updateModelValue = (val) => {
  const newVal = { ismanager: val };
  emit('update:modelValue', newVal);
};
</script>
