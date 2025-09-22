<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/alerts" :param="{ tenant_id: userStore.tenant_id }" title="预警信息" actions
      :show-btn="false" :editable="0" :deleteable="false">
      <template #actions="{ props }">
        <q-btn color="primary" dense flat label="查看详情" :disable="props.row.alert_id === 0"
          @click="ws.handleAlert(props.row)" />
        <q-btn v-if="false" color="primary" dense flat label="轨迹跟踪"
          :to="`/inventory_history?matched_profile_id=${props.row.matched_profile_id}`" />
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { useUserStore } from 'src/stores/user';
import { useWebSocketStore } from 'src/stores/ws';
const userStore = useUserStore();
const ws = useWebSocketStore();
</script>
