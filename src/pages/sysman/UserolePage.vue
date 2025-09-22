<template>
  <q-page class="q-pa-md">
    <SITable dir="resource/link/role" title="用户权限" label-width="80px" dialog-width="900px" :editable="false" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
