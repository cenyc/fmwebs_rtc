<template>
  <s-i-select ref="self" :use-input="false" v-model="modelValue" :options="options" label="请选择时间粒度"
    @update:model-value="upModelValue" />
</template>
<script setup>
import { ref } from "vue";
import SISelect from "../SISelect.vue";
const emit = defineEmits(["fillFields"]);
const upModelValue = (val) => {
  emit("fillFields", { range_type: val.value });
};
const self = ref(null)
const modelValue = ref("日")
const options = [
  {
    label: "日",
    value: "date",
  },
  {
    label: "周",
    value: "week",
  },
  {
    label: "月",
    value: "month",
  },
];
</script>
