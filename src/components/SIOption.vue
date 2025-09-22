<template>
  <q-option-group :options="extra" :type="type" v-model="group" inline dense @update:model-value="updateModelValue" />
</template>
<script setup>
import { ref } from 'vue';
const props = defineProps({
  modelValue: Object,
  fieldName: String,
  extra: Object,
  type: {
    type: String,
    default: 'radio'
  }
});
const emit = defineEmits(['update:modelValue']);
// console.log("系统账号选择器：", props.modelValue);
const group = ref(props.modelValue?.[props.fieldName] || props.extra[0].value);
const updateModelValue = (val) => {
  const newVal = { [props.fieldName]: val };
  emit('update:modelValue', newVal);
};
</script>
