<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/devices" title="设备信息" :exclude-inputs="['tenant-id_input']"
      :param="{ tenant_id: userStore.tenant_id }" :show-btn="true">
      <template #body-cell="props">
        <div v-if="props.col.name == 'func_type'">
          <q-icon name="videocam" size="xs" color="positive" v-if="props.value">
            <q-tooltip>监控</q-tooltip>
          </q-icon>
          <q-icon name="photo_camera" size="xs" color="negative" v-else>
            <q-tooltip>采集</q-tooltip>
          </q-icon>
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();
</script>
