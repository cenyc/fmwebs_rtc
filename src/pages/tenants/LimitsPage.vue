<template>
  <q-page class="q-pa-md">
    <SITable dir="resource/limits" title="权限组" label-width="80px" :exclude-inputs="['limit_input']" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
