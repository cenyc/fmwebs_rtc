<template>
  <q-page class="q-pa-md">
    <SITable dir="service/demands" title="留言数据库" :show-btn="false" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
