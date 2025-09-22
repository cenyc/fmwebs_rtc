<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/alerts" title="告警处理" :show-btn="false" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
