<template>
  <q-page class="q-pa-md">
    <SITable dir="logs/users" title="账号日志" :page-size="5" :param="{ id: userStore.id }" :show-btn="false"
      :editable="0" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();
</script>
