<template>
  <q-page class="flex flex-center">
    <q-card flat class="q-pa-xl">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="headset_mic" size="2em"></q-icon>
          请联系您的专属客服：{{ userInfo.phonenum }}

        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="headphones" size="2em"></q-icon>
          或致电官方客服热线：{{ userInfo.email }}
        </div>
      </q-card-section>

    </q-card>
  </q-page>
</template>
<script setup>
import { ref } from 'vue'
import { useUserStore } from 'src/stores/user'
import api from 'src/api/data'
const userStore = useUserStore()
const userInfo = ref({})
api.dataList('service/dedicate', { page: 1, page_size: 1, tenant_id: userStore.tenant_id }).then(res => {
  console.log('userInfo:', res.data)
  userInfo.value = res.data[0]
})
</script>
