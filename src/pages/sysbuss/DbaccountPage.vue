<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/profiles" title="用户信息" :show-btn="false" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
