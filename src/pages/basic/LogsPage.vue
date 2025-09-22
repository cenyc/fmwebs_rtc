<template>
  <q-page class="q-pa-md">
    <SITable dir="logs/users" title="用户管理日志" :page-size="5" :show-btn="false" :editable="0" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
