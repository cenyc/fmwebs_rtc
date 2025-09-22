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
  { label: '未知', value: '0' },
  { label: '是', value: '1' },
  { label: '否', value: '2' }
];
const group = ref(props.modelValue.isystem);
const updateModelValue = (val) => {
  const newVal = { isystem: val };
  emit('update:modelValue', newVal);
};
</script>
