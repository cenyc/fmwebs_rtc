<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="aly/history/capture" title="轨迹查询" :show-btn="false">
      <template #body-cell="props">
        <div v-if="props.col.name == 'capture_image_url'">
          <q-img :src="props.value" style="height: 100px; border-radius: 4px;" />
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
