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
// console.log("系统账号选择器：", props.modelValue);
const options = [
  { label: '男', value: '1' },
  { label: '女', value: '2' },
  { label: '保密', value: '0' }
];
const group = ref(props.modelValue.gender);
const updateModelValue = (val) => {
  const newVal = { gender: val };
  emit('update:modelValue', newVal);
};
</script>
