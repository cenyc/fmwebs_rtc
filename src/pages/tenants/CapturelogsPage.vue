<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/capturelogs" title="抓拍记录" :show-btn="false">
      <template #body-cell="props">
        <div v-if="props.col.name == 'has_alert'">
          <q-icon name="check" size="xs" color="positive" v-if="props.value"></q-icon>
          <q-icon name="clear" size="xs" color="negative" v-else></q-icon>
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
