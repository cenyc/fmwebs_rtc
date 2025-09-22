<template>
  <q-page class="q-pa-md">
    <q-tabs v-model="tab" class="text-grey q-mb-sm" active-color="primary" align="left" narrow-indicator>
      <q-tab name="省份" label="省份" />
      <q-tab name="城市" label="城市" />
      <q-tab name="区县" label="区县" />
      <q-tab name="街道乡镇" label="街道乡镇" />
    </q-tabs>
    <q-tab-panels v-model="tab" animated class="bg-transparent">
      <q-tab-panel name="省份" class="q-pa-none">
        <SITable dir="govaddr/province" title="省份" />
      </q-tab-panel>
      <q-tab-panel name="城市" class="q-pa-none">
        <SITable dir="govaddr/city" title="城市" :exclude-fields="['city_code', 'area_code', 'street_code']" />
      </q-tab-panel>
      <q-tab-panel name="区县" class="q-pa-none">
        <SITable dir="govaddr/area" title="区县" :exclude-fields="['area_code', 'street_code']" />
      </q-tab-panel>
      <q-tab-panel name="街道乡镇" class="q-pa-none">
        <SITable dir="govaddr/street" title="街道乡镇" :exclude-fields="['street_code']" dialog-width="850px" />
      </q-tab-panel>
    </q-tab-panels>

  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { ref } from 'vue';
const tab = ref('省份');
</script>
<style scoped>
.q-tab {
  min-height: 32px;
  max-height: 32px;
}
</style>
