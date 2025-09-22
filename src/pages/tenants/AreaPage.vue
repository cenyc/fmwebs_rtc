<template>
  <q-page class="q-pa-md">
    <SITable dir="role" title="租户角色" label-width="80px" :exclude-inputs="['role_input']" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
