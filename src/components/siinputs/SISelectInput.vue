<template>
  <s-i-select dense borderless emit-value map-options :model-value="modelValue?.[fieldName]" :options="selectOptions"
    :for="(isSearchMode ? 'search_' : '') + fieldName" @update:model-value="updateModelValue">
    <template #no-option>
      <q-item>
        <q-item-section>
          没有可用数据
        </q-item-section>
      </q-item>
    </template>
  </s-i-select>
</template>
<script setup>
import SISelect from '../SISelect.vue';
import { ref } from 'vue';
const props = defineProps({
  modelValue: Object,
  fieldName: String,
  extra: Object,
  mode: String
});
const emit = defineEmits(['update:modelValue', 'fillFields']);
console.log('select modelValue', props.modelValue);
const isSearchMode = props.mode === 'search';
const selectOptions = ref([]);
props.extra?.forEach((item, index) => {
  selectOptions.value.push({ label: item, value: index });
});
console.log('selectOptions', selectOptions.value);

const updateModelValue = (value) => {
  // if (value) value = { label: '', value: '', [props.fieldName]: '' };
  console.log('updateModelValue', value)
  emit('update:modelValue', { [props.fieldName]: value });

  if (isSearchMode) {
    emit('fillFields', { [props.fieldName]: value });
  }
};

</script>
