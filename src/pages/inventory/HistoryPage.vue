<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="aly/history/capture" title="轨迹跟踪" :show-btn="false" :actions="false" :param="param">
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
import { computed } from 'vue';
import { useRoute } from 'vue-router'
const route = useRoute()
// 获取当前路由的参数
console.log(route.query);
const param = computed(() => route.query);
</script>
