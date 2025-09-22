<template>
  <q-page class="q-pa-md">
    <SITable dir="apikey" title="应用密钥" :show-btn="false">
      <template #body-cell="props">
        <div v-if="props.col.name == 'created_at' || props.col.name == 'expires_at'"> {{ formatDate(props.value) }}
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { formatDate } from 'src/utils/tools';
</script>
