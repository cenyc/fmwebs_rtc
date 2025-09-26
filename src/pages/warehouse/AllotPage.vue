<template>
  <q-page class="q-pa-md">
    <!-- <img alt="Quasar logo" src="~assets/quasar-logo-vertical.svg" style="width: 200px; height: 200px"> -->
    <div class="row">
      <div class="col-12">
        <p>最近预警</p>
        <div class="row q-gutter-lg">
          <q-card v-for="(item, index) in position" :key="index" class="col" flat bordered>
            <q-img :src="item._img || avatar">
              <div class="absolute-top-left" style="background:#4876FF; opacity: .7; border-radius:10px 0 10px">
                {{ item.user_category }}
              </div>
            </q-img>
            <q-card-section class="q-px-sm q-py-none pos-section">
              <div class="text-subtitle1">{{ item.position }}</div>
              <div class="text-subtitle2">{{ item.stats }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
    <div class="row q-mt-xs q-col-gutter-md">
      <SICaptureChart />
      <div class="col-8">
        <SIWarningChart />
        <p class="q-pt-md">信息采集</p>
        <q-card flat>
          <q-card-section class="q-pa-xs">
            <SIGatherChart />
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import SICaptureChart from 'src/components/sicharts/SICaptureChart.vue';
import SIWarningChart from 'src/components/sicharts/SIWarningChart.vue';
import SIGatherChart from 'src/components/sicharts/SIGatherChart.vue';
import avatar from 'src/assets/avatar.png'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import api from 'src/api/main'
import { useUserStore } from 'src/stores/user'
import { useConfigStore } from 'src/stores/config'
import { useInternalServerStore } from 'src/stores/internal_server'
// 最近预警
const position = ref([])
const imageClientRef = ref(null)
const imageLoading = ref(false)

const userStore = useUserStore()
const configStore = useConfigStore()
const internalStore = useInternalServerStore()

async function ensureImageClient() {
  if (imageClientRef.value) return imageClientRef.value
  let ImageAccessClient = window?.ImageAccessClient
  try {
    if (!window?.WebRTCChunker) {
      await import('src/utils/webrtc_chunker.js')
    }
    if (!ImageAccessClient) {
      await import('src/utils/image_access_client.js')
      ImageAccessClient = window?.ImageAccessClient
    }
  } catch (e) {
    console.warn('加载图像访问组件失败:', e)
    return null
  }
  internalStore.loadDefaultsFromConfig()
  await internalStore.getValidApiKey(userStore.tenant_id, userStore.token)
  const is = { ...configStore.internal_server }
  if (internalStore.effectiveInternalIp) {
    is.INTERNAL_IP = internalStore.effectiveInternalIp
  }
  imageClientRef.value = new ImageAccessClient({
    INTERNAL_IP: is.INTERNAL_IP || undefined,
    INTERNAL_PORT: is.INTERNAL_PORT,
    SIGNALING_URL: is.SIGNALING_URL,
    AUTH_URL: is.AUTH_URL,
    API_KEY: internalStore.api_key,
    IMAGE_ENDPOINT: is.IMAGE_ENDPOINT,
    LAN_TIMEOUT_MS: is.LAN_TIMEOUT_MS,
    LOG_ENABLED: false,
  })
  try { await imageClientRef.value.detectNetworkMode() } catch (e) { void e }
  if (imageClientRef.value.getNetworkMode() === 'remote') {
    try { await imageClientRef.value.preEstablishWebRTCConnection() } catch (e) { void e }
  }
  return imageClientRef.value
}

async function fetchWarnings() {
  const res = await api.dataGet('aly/warning')
  position.value = Array.isArray(res?.data?.position) ? res.data.position : []
}

async function loadWarningImages() {
  const client = await ensureImageClient()
  if (!client || !Array.isArray(position.value) || position.value.length === 0) return
  imageLoading.value = true
  for (const item of position.value) {
    const path = item?.url
    if (!path || typeof path !== 'string') {
      item._img = ''
      continue
    }
    try {
      const result = await client.fetchImageWithRetry(path, 1)
      // 为每条记录创建独立的 objectURL，避免被客户端全局释放
      const prev = item._img
      const ownUrl = URL.createObjectURL(result.blob)
      item._img = ownUrl
      // 可选：清理客户端返回的临时 URL（若存在）
      try { if (result.objectUrl && result.objectUrl !== ownUrl) URL.revokeObjectURL(result.objectUrl) } catch (e) { void e }
      // 清理旧的 URL，避免内存泄漏
      try { if (prev && typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev) } catch (e) { void e }
    } catch {
      item._img = ''
    }
  }
  imageLoading.value = false
}

watch(position, (val) => {
  if (val && val.length) {
    loadWarningImages()
  }
})

onMounted(async () => {
  await fetchWarnings()
})

onBeforeUnmount(() => {
  try {
    if (Array.isArray(position.value)) {
      position.value.forEach(it => {
        if (it && typeof it._img === 'string' && it._img.startsWith('blob:')) {
          try { URL.revokeObjectURL(it._img) } catch (e) { void e }
        }
      })
    }
  } catch (e) { void e }
  try { imageClientRef.value?.close() } catch (e) { void e }
})

</script>
<style lang="scss" scoped>
.q-img {
  max-height: 200px
}

.q-img__content>div {
  padding: 2px 20px 2px 10px !important
}

body.body--light .pos-section {
  background: $hover-bg-color !important;
}

.q-card--bordered {
  border-color: #EDECEC
}
</style>
