<template>
  <s-i-select :model-value="modelValue.province_code" :options="provinceOptions" label="省份"
    :for="(isSearchMode ? 'search_' : '') + 'addr_input'" :rules="getRules('省份')" @update:model-value="loadCities"
    @filter="handleProvinceFilter" />
  <s-i-select v-if="modelValue.city_code !== undefined" :model-value="modelValue.city_code" :options="cityOptions"
    label="城市" :disable="!modelValue.province_code?.value" :rules="getRules('城市')" @update:model-value="loadAreas" />
  <s-i-select v-if="modelValue.area_code !== undefined" :model-value="modelValue.area_code" :options="areaOptions"
    label="区县" :disable="!modelValue.city_code?.value" :rules="getRules('区县')" @update:model-value="loadStreets" />
  <s-i-select v-if="modelValue.street_code !== undefined" :model-value="modelValue.street_code" :options="streetOptions"
    label="街道/乡镇" :disable="!modelValue.area_code?.value" :rules="getRules('街道')" @update:model-value="updateStreets" />
</template>
<script setup>
import SISelect from '../SISelect.vue';
import { ref } from 'vue';
import data from 'src/api/data';
const provinceOptions = ref([]);
const cityOptions = ref([]);
const areaOptions = ref([]);
const streetOptions = ref([]);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  mode: {
    type: String,
    default: ''
  }
});
const isSearchMode = props.mode === 'search';
const emit = defineEmits(['update:modelValue', 'initFormData', 'fillFields']);
if (isSearchMode) emit('initFormData', 'addr-id_input')
console.log('SIAddrIdInput', props.modelValue);
const getRules = (title) => {
  if (isSearchMode) return []
  return [val => !!val || (title + '不能为空')]
}
const formatOptions = (data) => {
  return data.map(item => ({ label: `${item.name}(${item.code})`, value: item.code, code: item.code }));
};
const updateModelValue = (value) => {
  emit('update:modelValue', { ...props.modelValue, ...value });
};
// const fillFields = (value) => {
//   if (isSearchMode) emit('fillFields', value);
//   else emit('fillFields', { addr_code: value });
// };
const getUndefined = (key) => {
  return props.modelValue[key] === undefined ? undefined : null;
};
const loadProvinces = (name) => {
  // 这里可以调用接口获取省份数据
  data.dataList('govaddr/province', { page: 1, page_size: 50, name: name || '' }).then(res => {
    provinceOptions.value = formatOptions(res.data);
  });
}
const loadCities = (e) => {
  emit('fillFields', { province_code: e.value, city_code: null, area_code: null, street_code: null });
  emit('update:modelValue', { province_code: e, city_code: getUndefined('city_code'), area_code: getUndefined('area_code'), street_code: getUndefined('street_code') });
  if (props.modelValue.city_code === undefined) return;
  console.log('loadCities', e)
  // 这里可以调用接口获取城市数据
  data.dataList('govaddr/city', { page: 1, page_size: 50, province_code: e?.code }).then(res => {
    cityOptions.value = formatOptions(res.data);
    console.log('loadedCities', cityOptions.value);
  });
};
const loadAreas = (e) => {
  emit('fillFields', { city_code: e.value, area_code: null, street_code: null });
  emit('update:modelValue', { ...props.modelValue, city_code: e, area_code: getUndefined('area_code'), street_code: getUndefined('street_code') });
  if (props.modelValue.area_code === undefined) return;
  console.log('loadAreas', e)
  // 这里可以调用接口获取区县数据
  data.dataList('govaddr/area', {
    page: 1, page_size: 50,
    province_code: props.modelValue.province_code.code,
    city_code: e?.code
  }).then(res => {
    areaOptions.value = formatOptions(res.data);
  });
};
const loadStreets = (e) => {
  emit('fillFields', { area_code: e.value, street_code: null });
  updateModelValue({ area_code: e, street_code: getUndefined('street_code') });
  if (props.modelValue.street_code === undefined) return;
  console.log('loadStreets', e)
  // 这里可以调用接口获取街道数据
  data.dataList('govaddr/street', {
    page: 1, page_size: 50,
    province_code: props.modelValue.province_code.code,
    city_code: props.modelValue.city_code.code,
    area_code: e?.code
  }).then(res => {
    streetOptions.value = formatOptions(res.data);
  });
};
const updateStreets = (e) => {
  updateModelValue({ street_code: e });
  emit('fillFields', { street_code: e.value });
};

const handleProvinceFilter = (val, update) => {
  console.log('handleProvinceFilter', val);
  update(() => {
    loadProvinces(val);
    // updateModelValue({ province: null });
  });
}

</script>
