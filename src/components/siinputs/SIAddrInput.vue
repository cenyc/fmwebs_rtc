<template>
  <div class="flex q-gutter-sm">
    <s-i-select :model-value="modelValue.province" :options="provinceOptions" label="省份"
      :for="(isSearchMode ? 'search_' : '') + 'addr_input'" :rules="getRules('省份')" @update:model-value="loadCities"
      @filter="handleProvinceFilter" />
    <s-i-select :model-value="modelValue.city" :options="cityOptions" label="城市" :disable="!modelValue.province?.value"
      :rules="getRules('城市')" @update:model-value="loadAreas" />
    <s-i-select :model-value="modelValue.area" :options="areaOptions" label="区县" :disable="!modelValue.city?.value"
      :rules="getRules('区县')" @update:model-value="loadStreets" />
    <s-i-select :model-value="modelValue.street" :options="streetOptions" label="街道/乡镇"
      :disable="!modelValue.area?.value" :rules="getRules('街道')" @update:model-value="updateStreets" />
  </div>
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
  },
  popupSize: {
    type: String,
    default: 'sm'
  }
});
const isSearchMode = props.mode === 'search';
const emit = defineEmits(['update:modelValue', 'initFormData', 'fillFields']);
if (isSearchMode) emit('initFormData', {})
const getRules = (title) => {
  if (isSearchMode) return []
  return [val => !!val || (title + '不能为空')]
}

const formatOptions = (data) => {
  return data.map(item => ({ label: item.name, value: item.name, code: item.code }));
};
const updateModelValue = (value) => {
  emit('update:modelValue', { ...props.modelValue, ...value });
};
const loadProvinces = (name) => {
  // 这里可以调用接口获取省份数据
  data.dataList('govaddr/province', { page: 1, page_size: 50, name: name || '' }).then(res => {
    provinceOptions.value = formatOptions(res.data);
  });
}
const loadCities = (e) => {
  console.log('loadCities', e)
  // 这里可以调用接口获取城市数据
  data.dataList('govaddr/city', { page: 1, page_size: 50, province_code: e?.code }).then(res => {
    cityOptions.value = formatOptions(res.data);
    emit('update:modelValue', { province: e, city: null, area: null, street: null });
    emit('fillFields', isSearchMode ? { province: e.value, city: null, area: null, street: null } : { addr_code: '' });
  });
};
const loadAreas = (e) => {
  // 这里可以调用接口获取区县数据
  data.dataList('govaddr/area', {
    page: 1, page_size: 50,
    province_code: props.modelValue.province.code,
    city_code: e?.code
  }).then(res => {
    areaOptions.value = formatOptions(res.data);
    emit('update:modelValue', { ...props.modelValue, city: e, area: null, street: null });
    emit('fillFields', isSearchMode ? { city: e.value, area: null, street: null } : { addr_code: '' });
  });
};
const loadStreets = (e) => {
  // 这里可以调用接口获取街道数据
  data.dataList('govaddr/street', {
    page: 1, page_size: 50,
    province_code: props.modelValue.province.code,
    city_code: props.modelValue.city.code,
    area_code: e?.code
  }).then(res => {
    streetOptions.value = formatOptions(res.data);
    updateModelValue({ area: e, street: null });
    emit('fillFields', isSearchMode ? { area: e.value, street: null } : { addr_code: '' });
  });
};
const updateStreets = (e) => {
  updateModelValue({ street: e });
  emit('fillFields', isSearchMode ? { street: e.value } : { addr_code: e?.code });
};

const handleProvinceFilter = (val, update) => {
  console.log('handleProvinceFilter', val);
  update(() => {
    loadProvinces(val);
    // updateModelValue({ province: null });
  });
}

</script>
