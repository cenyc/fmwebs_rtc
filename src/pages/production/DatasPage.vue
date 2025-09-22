<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/gathers" title="信息采集数据" :param="{ tenant_id: userStore.tenant_id }" :show-btn="false"
      :exclude-inputs="['tenant-id_input']">
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
import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();
</script>
