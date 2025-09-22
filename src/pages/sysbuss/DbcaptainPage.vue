<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/capturelogs" title="人员抓拍数据库" :show-btn="false" :editable="0">
      <template #actions="{ props }">
        <q-btn color="primary" dense flat label="轨迹跟踪"
          :to="`/inventory_history?matched_profile_id=${props.row.matched_profile_id}`"></q-btn>
      </template>
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
