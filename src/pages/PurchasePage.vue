<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-8">
        <p>人脸录入</p>
        <q-card flat class="q-px-lg">
          <q-card-section>
            <!-- 连接与摄像头选择 -->
            <div class="row items-center q-gutter-md q-mb-md">
              <div class="si-input border col-auto">
                <label for="conn_mode">连接方式</label>
                <q-select dense borderless v-model="connMode" :options="connModeOptions" emit-value map-options label="请选择"
                  option-label="label" option-value="value" />
              </div>
              <div class="col-auto">
                <q-btn outline color="primary" :loading="connecting" @click="connectCameras">
                  {{ connecting ? '连接中' : '连接/刷新' }}
                </q-btn>
              </div>
              <div class="si-input border col">
                <label for="camera">摄像头</label>
                <q-select dense borderless v-model="selectedCamera" :options="cameraOptions" :loading="cameraLoading"
                  option-label="label" option-value="value" label="请选择摄像头" />
              </div>
              <div class="col-auto">
                <q-toggle v-model="previewing" color="primary" @update:model-value="togglePreview" label="预览" />
              </div>
            </div>

            <!-- 预览与采集 -->
            <div class="row q-col-gutter-md">
              <div class="col-7">
                <div class="preview-box column items-center justify-center">
                  <template v-if="previewing && streamUrl">
                    <img :src="streamUrl" alt="预览" class="preview-img" @error="onStreamError" />
                  </template>
                  <template v-else>
                    <div class="text-grey">未预览</div>
                  </template>
                </div>
                <div class="q-mt-sm">
                  <q-btn outline color="primary" class="q-mr-sm" @click="captureSnapshot" :disable="!canCapture">
                    拍照
                  </q-btn>
                  <q-btn outline color="primary" class="q-mr-sm" @click="fileInput.pickFiles()">
                    上传图片
                  </q-btn>
                  <q-file ref="fileInput" accept=".jpg, .jpeg, .png" class="hidden" @update:model-value="handleFileSelect" />
                </div>
              </div>
              <div class="col-5">
                <div class="si-input border q-pb-sm">
                  <label for="image">采集图片</label>
                  <q-avatar rounded size="120px">
                    <q-btn outline stack color="primary" class="full-width full-height" @click="fileInput.pickFiles()">
                      <template v-if="base64Image">
                        <img :src="base64Image" style="width: 100%; height: 100%; object-fit: cover" alt="预览图片">
                      </template>
                      <template v-else>
                        <q-icon name="photo_camera" size="24px" />
                        <div class="q-mt-sm">选择/拍摄</div>
                      </template>
                    </q-btn>
                  </q-avatar>
                  <div class="hint q-ml-lg">
                    建议上传比例1:1，png、jpeg、jpg格式,1M以内的图片
                  </div>
                </div>
                <div class="si-input border">
                  <label for="name">人员姓名</label>
                  <q-input dense borderless v-model="formData.name" :rules="[val => !!val || '姓名不能为空']" lazy-rules label="请输入姓名" />
                </div>
                <div class="si-input border">
                  <label for="type_id">面部属性</label>
                  <SIProfileIdInput v-model="typeId" label="请选择人员类型" field-name="type_id" :extra="{ label: 'type_name', value: 'type_id', dir: '/type' }" />
                </div>
                <div class="si-input border">
                  <label for="room_id">关联房间</label>
                  <q-input dense borderless v-model="formData.room_id" :rules="[val => !!val || '房间号不能为空']" lazy-rules label="请输入房间号" />
                </div>
                <div class="si-input q-my-md">
                  <q-btn unelevated rounded color="primary" class="q-px-lg" :loading="loading" @click="onSubmit" :disable="!canSubmit">提交</q-btn>
                  <q-btn unelevated rounded color="secondary" class="q-ml-md q-px-lg" :disable="loading" @click="onReset">重置</q-btn>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-4">
        <p class="q-ml-md">最新导入</p>
        <q-card flat class="q-pa-md q-ml-md row">
          <q-list v-for="item, key in latestImportData" :key="key" class="col-4">
            <q-item>
              <q-item-section>
                <q-img :src="item.tmp_url || 'src/assets/avatar.png'">
                  <div class="absolute-top-left" style="background:#4876FF; opacity: .7; border-radius:10px 0 10px">
                    {{ item.name }}
                  </div>
                </q-img>
                <q-item-label class="q-py-sm">{{ formatDate(item.created_time, 'HH:mm:ss') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import SIProfileIdInput from 'src/components/siinputs/SIProfileIdInput.vue'
import main from 'src/api/main'
import { useUserStore } from 'src/stores/user'
import { useInternalServerStore } from 'src/stores/internal_server'
import { ref, computed, onMounted, watch } from 'vue'
import { formatDate } from 'src/utils/tools'
import { $success, $error } from 'src/utils/notify'

const userStore = useUserStore()
const internal = useInternalServerStore()

const fileInput = ref(null)
const base64Image = ref(null)
const typeId = ref(null)
const loading = ref(false)
const connecting = ref(false)
const cameraLoading = ref(false)
const connMode = ref('lan') // 'lan' | 'webrtc'
const connModeOptions = [
  { label: '内部机直连', value: 'lan' },
  { label: 'WebRTC 远程', value: 'webrtc' }
]
const cameraOptions = ref([])
const selectedCamera = ref(null)
const previewing = ref(false)
const streamUrl = ref('')
const remotePreviewTimer = ref(null)
const imageClientRef = ref(null)
const formData = ref({})

// 最新导入数据
const latestImportData = ref([])
main.dataList('fs/profiles', { page: 1, page_size: 9, tenant_id: userStore.tenant_id }).then((res) => {
  latestImportData.value = res.data
})

const canCapture = computed(() => {
  if (connMode.value === 'lan') return !!selectedCamera.value && previewing.value
  // WebRTC 模式后续扩展
  return false
})

const canSubmit = computed(() => {
  return !!base64Image.value && !!formData.value.name && !!typeId.value?.type_id && !!formData.value.room_id
})

function getInternalPort() {
  // 兼容 apiPort、INTERNAL_API_PORT、INTERNAL_PORT
  // @ts-ignore
  return internal.apiPort || internal.INTERNAL_API_PORT || internal.INTERNAL_PORT || 5002
}

function getLanBaseUrl() {
  internal.loadDefaultsFromConfig()
  const ip = internal.effectiveInternalIp
  const port = getInternalPort()
  if (!ip) return ''
  const proto = 'http://'
  return `${proto}${ip}:${port}`
}

async function ensureImageClient() {
  if (imageClientRef.value) return imageClientRef.value
  let ImageAccessClient = window?.ImageAccessClient
  if (!ImageAccessClient) {
    try {
      await import('src/utils/image_access_client.js')
      ImageAccessClient = window?.ImageAccessClient
    } catch {
      $error('加载远程访问组件失败')
      return null
    }
  }
  await internal.getValidApiKey(userStore.tenant_id, userStore.token)
  const cfg = {
    // INTERNAL_IP: internal.effectiveInternalIp,
    INTERNAL_IP: "172.31.144.1",
    // INTERNAL_PORT: getInternalPort(),
    INTERNAL_PORT: 5002,
    SIGNALING_URL: internal.SIGNALING_URL,
    AUTH_URL: internal.AUTH_URL,
    // API_KEY: internal.api_key,
    API_KEY: "MZQLIQgR7bHWKWDxlYrywk9mG69wBKztOdnZEZupFLwKEei81eAhjDxyARod9dce",
    IMAGE_ENDPOINT: internal.IMAGE_ENDPOINT || '/api/images/by-path',
    LAN_TIMEOUT_MS: internal.LAN_TIMEOUT_MS || 3500,
    LOG_ENABLED: false
  }
  imageClientRef.value = new ImageAccessClient(cfg)
  return imageClientRef.value
}

function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { signal: controller.signal, cache: 'no-store' }).finally(() => clearTimeout(timer))
}

async function startRemotePreview(deviceId) {
  const client = await ensureImageClient()
  if (!client) return
  try { await client.preEstablishWebRTCConnection() } catch { $error('远程连接失败'); return }
  stopRemotePreview()
  remotePreviewTimer.value = setInterval(async () => {
    try {
      const api = client?.remoteClient?.apiClient
      if (!api) return
      const resp = await api.get(`/api/camera/snapshot?device_id=${encodeURIComponent(deviceId)}&ts=${Date.now()}`)
      if (resp && (resp.image_base64 || resp.data_base64)) {
        const b64 = resp.image_base64 || resp.data_base64
        streamUrl.value = `data:image/jpeg;base64,${b64}`
      }
    } catch { /* ignore */ }
  }, 1000)
}

function stopRemotePreview() {
  if (remotePreviewTimer.value) {
    clearInterval(remotePreviewTimer.value)
    remotePreviewTimer.value = null
  }
}

async function connectCameras() {
  connecting.value = true
  cameraLoading.value = true
  try {
    cameraOptions.value = []
    selectedCamera.value = null

    // 自动探测：优先尝试局域网
    const base = getLanBaseUrl()
    let lanOk = false
    if (base) {
      try {
        const ping = await fetchWithTimeout(`${base}/api/camera/list?func_type=2&ts=${Date.now()}`, internal.LAN_TIMEOUT_MS || 3500)
        lanOk = ping.ok
      } catch { lanOk = false }
    }

    if (lanOk) {
      connMode.value = 'lan'
      const resp = await fetch(`${base}/api/camera/list?func_type=2&ts=${Date.now()}`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = await resp.json()
      const list = Array.isArray(json?.data) ? json.data : []
      if (list.length === 0) { $error('未发现手动录入摄像头'); return }
      cameraOptions.value = list.map((cam) => ({
        label: `${cam.name || cam.device_id || 'Camera'} ${cam.resolution ? '(' + cam.resolution + ')' : ''}`,
        value: { device_id: cam.device_id, fps: cam.fps || 10 }
      }))
      if (list.length === 1) {
        selectedCamera.value = { device_id: list[0].device_id, fps: list[0].fps || 10 }
        previewing.value = true
        togglePreview(true)
      }
    } else {
      // 远程 WebRTC
      connMode.value = 'webrtc'
      const client = await ensureImageClient()
      if (!client) { $error('远程连接组件未就绪'); return }
      try { await client.preEstablishWebRTCConnection() } catch { $error('远程连接失败'); return }
      const api = client?.remoteClient?.apiClient
      if (!api) { $error('远程数据通道未就绪'); return }
      const resp = await api.get(`/api/camera/list?func_type=2`)
      const list = Array.isArray(resp?.data) ? resp.data : []
      if (list.length === 0) { $error('远程未发现手动录入摄像头'); return }
      cameraOptions.value = list.map((cam) => ({
        label: `${cam.name || cam.device_id || 'Camera'} ${cam.resolution ? '(' + cam.resolution + ')' : ''}`,
        value: { device_id: cam.device_id, fps: cam.fps || 1 }
      }))
      if (list.length === 1) {
        selectedCamera.value = { device_id: list[0].device_id, fps: list[0].fps || 1 }
        previewing.value = true
        await startRemotePreview(selectedCamera.value.device_id)
      }
    }
  } catch (err) {
    $error(err.message || '连接失败')
  } finally {
    cameraLoading.value = false
    connecting.value = false
  }
}

function togglePreview(val) {
  if (!val) {
    streamUrl.value = ''
    stopRemotePreview()
    return
  }
  if (connMode.value === 'lan' && selectedCamera.value?.device_id) {
    const base = getLanBaseUrl()
    const fps = selectedCamera.value.fps || 10
    streamUrl.value = `${base}/api/camera/stream_mjpeg?device_id=${encodeURIComponent(selectedCamera.value.device_id)}&fps=${fps}&ts=${Date.now()}`
  } else if (connMode.value === 'webrtc' && selectedCamera.value?.device_id) {
    startRemotePreview(selectedCamera.value.device_id)
  } else {
    streamUrl.value = ''
  }
}

function onStreamError() {
  // 预览失败时，尝试快速刷新一次
  if (streamUrl.value) {
    streamUrl.value = streamUrl.value.replace(/(&ts=)\d+$/, `$1${Date.now()}`)
  }
}

async function captureSnapshot() {
  try {
    if (connMode.value === 'lan' && selectedCamera.value?.device_id) {
      const base = getLanBaseUrl()
      const url = `${base}/api/camera/snapshot?device_id=${encodeURIComponent(selectedCamera.value.device_id)}&ts=${Date.now()}`
      const img = new Image()
      // 避免跨域污染画布
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height)
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const sx = Math.max(0, (img.width - size) / 2)
        const sy = Math.max(0, (img.height - size) / 2)
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
        base64Image.value = canvas.toDataURL('image/jpeg', 0.92)
      }
      img.onerror = () => $error('抓拍失败，请重试')
      img.src = url
    } else if (connMode.value === 'webrtc' && selectedCamera.value?.device_id) {
      const client = await ensureImageClient()
      if (!client) { $error('远程连接组件未就绪'); return }
      try { await client.preEstablishWebRTCConnection() } catch { $error('远程连接失败'); return }
      const api = client?.remoteClient?.apiClient
      if (!api) { $error('远程数据通道未就绪'); return }
      const resp = await api.get(`/api/camera/snapshot?device_id=${encodeURIComponent(selectedCamera.value.device_id)}&ts=${Date.now()}`)
      if (resp && (resp.image_base64 || resp.data_base64)) {
        base64Image.value = `data:image/jpeg;base64,${resp.image_base64 || resp.data_base64}`
      } else {
        $error('抓拍失败')
      }
    }
  } catch {
    $error('抓拍失败')
  }
}

const handleFileSelect = (file) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    base64Image.value = reader.result
  }
  reader.readAsDataURL(file)
}

const onSubmit = () => {
  if (!canSubmit.value) {
    $error('请完善信息并采集图片')
    return
  }
  loading.value = true
  // 先上传图片
  main.dataPost('header/face/img', {
    img_parent: formData.value.name,
    image_base64: base64Image.value
  }).then(res => {
    // 新增人员信息
    return main.dataNew('fs/profiles', {
      ...formData.value,
      type_id: typeId.value?.type_id,
      tenant_id: userStore.tenant_id,
      tmp_url: res.data.url
    }).then((r) => {
      latestImportData.value.unshift({
        id: r.data.id,
        name: formData.value.name,
        tmp_url: res.data.url,
        created_time: new Date().toISOString()
      })
      if (latestImportData.value.length > 9) latestImportData.value.pop()
      $success('导入成功')
      formData.value = {}
      base64Image.value = null
      typeId.value = null
    })
  }).catch(err => {
    $error(err.message || '上传失败')
  }).finally(() => {
    loading.value = false
  })
}

const onReset = () => {
  formData.value = {}
  base64Image.value = null
  typeId.value = null
}

watch(selectedCamera, async (val) => {
  if (!val || !previewing.value) return
  if (connMode.value === 'lan') {
    togglePreview(true)
  } else if (connMode.value === 'webrtc') {
    await startRemotePreview(val.device_id)
  }
})

onMounted(() => {
  // 可自动探测并连接
  // connectCameras()
})
</script>
<style lang="scss" scoped>
.q-img__content>div {
  padding: 2px 20px 2px 10px !important;
}

.q-item {
  text-align: center;
}

.q-item__section {
  border-radius: 10px;
  overflow: hidden;
  background-color: #EAEFFF;
  border: 1px solid #EDECEC;
}

.preview-box {
  height: 280px;
  border-radius: 10px;
  border: 1px solid #EDECEC;
  background: #F8FAFF;
  overflow: hidden;
}
.preview-img { width: 100%; height: 100%; object-fit: contain; }

:deep(.si-input) {
  .q-field__control { min-width: 186px; }
  .q-select .q-field__input { max-width: 114px; }
}
</style>
