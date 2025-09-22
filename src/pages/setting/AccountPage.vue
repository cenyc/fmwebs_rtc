<template>
  <q-page class="q-pa-md">
    <SITable dir="user/account" title="账号" delete-field="username" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
