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
              <div class="si-input border col" v-if="cameraOptions.length > 1">
                <label for="camera">摄像头</label>
                <q-select dense borderless v-model="selectedCameraId" :options="cameraOptions" :loading="cameraLoading"
                  emit-value map-options option-label="label" option-value="value" label="请选择摄像头" @update:model-value="onCameraSelected" />
              </div>
            </div>

            <!-- 预览与采集 -->
            <div class="row q-col-gutter-md">
              <div class="col-7">
                <div class="preview-box column items-center justify-center">
                  <template v-if="connMode === 'webrtc'">
                    <video ref="videoEl" autoplay muted playsinline class="preview-img"></video>
                  </template>
                  <template v-else-if="streamUrl">
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
                </div>
                <div class="si-input border">
                  <label for="name">人员姓名</label>
                  <q-input dense borderless v-model="formData.name" label="请输入姓名" />
                </div>
                <div class="si-input border">
                  <label for="type_id">人员类型</label>
                  <SIProfileIdInput v-model="typeId" label="请选择人员类型" field-name="type_id" :extra="{ label: 'type_name', value: 'type_id', dir: '/type' }" />
                </div>
                <div class="si-input border">
                  <label for="room_id">关联房间</label>
                  <q-input dense borderless v-model="formData.room_id" label="请输入房间号" />
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
          <q-list v-for="(item, index) in latestImportData" :key="index" class="col-4">
            <q-item>
              <q-item-section>
                <q-img :src="item._img || avatar">
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { formatDate } from 'src/utils/tools'
import { $success, $error } from 'src/utils/notify'
import avatar from 'src/assets/avatar.png'

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
const selectedCameraId = ref(null)
const cameraMeta = ref({}) // device_id -> { fps, resolution, name, ... }
const streamUrl = ref('')
const videoEl = ref(null)
const lanPreviewTimer = ref(null)
const lanPreviewMode = ref('mjpeg') // 'mjpeg' | 'snapshot'
const imageClientRef = ref(null)
const imageClientTargetId = ref(null)
const lastCapture = ref({ original: null, faceBox: null })
const formData = ref({})
// WebRTC 远程信令与流
const webrtcWs = ref(null)
const webrtcToken = ref('')
const webrtcClientId = ref('')
const webrtcPeer = ref(null)
const webrtcConnected = ref(false)
const remoteCameras = ref({}) // device_id -> { clientId, index, type, name, resolution, fps }
const selectedRemoteClientId = ref(null)

// 最新导入数据
const latestImportData = ref([])
main.dataList('fs/profiles', { page: 1, page_size: 9, tenant_id: userStore.tenant_id }).then((res) => {
  latestImportData.value = res.data
  loadLatestImportImages()
})
const canCapture = computed(() => {
  if (connMode.value === 'lan') return !!selectedCameraId.value
  if (connMode.value === 'webrtc') return !!(selectedCameraId.value && selectedRemoteClientId.value)
  return false
})

const canSubmit = computed(() => {
  // 仅要求已采集图片且已选择人员类型；姓名与房间可为空
  return !!base64Image.value && !!typeId.value?.type_id
})

function getLanApiBaseUrl() {
  internal.loadDefaultsFromConfig()
  const ip = internal.effectiveInternalIp
  const port = internal.INTERNAL_API_PORT || 5001
  if (!ip) return ''
  return `http://${ip}:${port}`
}

// 所有 /api/camera/* 统一使用 WebAPI 端口（见 getLanApiBaseUrl）

async function ensureImageClient(targetId = null) {
  if (targetId && imageClientTargetId.value && imageClientTargetId.value !== targetId) {
    try { imageClientRef.value?.close() } catch (e) { void e }
    imageClientRef.value = null
    imageClientTargetId.value = null
  }
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
  internal.loadDefaultsFromConfig()
  await internal.getValidApiKey(userStore.tenant_id, userStore.token)
  imageClientRef.value = new ImageAccessClient({
    INTERNAL_IP: internal.effectiveInternalIp || undefined,
    INTERNAL_PORT: internal.INTERNAL_PORT || 5002,
    SIGNALING_URL: internal.SIGNALING_URL,
    AUTH_URL: internal.AUTH_URL,
    API_KEY: internal.api_key,
    IMAGE_ENDPOINT: internal.IMAGE_ENDPOINT || '/api/images/by-path',
    LAN_TIMEOUT_MS: internal.LAN_TIMEOUT_MS || 3500,
    LOG_ENABLED: false,
    REMOTE_TARGET_ID: targetId || selectedRemoteClientId.value || undefined
  })
  imageClientTargetId.value = targetId || selectedRemoteClientId.value || null
  return imageClientRef.value
}

async function loadLatestImportImages() {
  const client = await ensureImageClient()
  if (!client || !Array.isArray(latestImportData.value) || latestImportData.value.length === 0) return
  for (const item of latestImportData.value) {
    const path = item?.image_url || item?.tmp_url
    if (!path || typeof path !== 'string') continue
    try {
      const result = await client.fetchImageWithRetry(path, 1)
      const prev = item._img
      const ownUrl = URL.createObjectURL(result.blob)
      item._img = ownUrl
      try { if (result.objectUrl && result.objectUrl !== ownUrl) URL.revokeObjectURL(result.objectUrl) } catch (e) { void e }
      try { if (prev && typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev) } catch (e) { void e }
    } catch (e) { void e }
  }
}

function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { signal: controller.signal, cache: 'no-store' }).finally(() => clearTimeout(timer))
}

async function startRemotePreview(deviceId) {
  try {
    // 确保已通过信令发现并记录了设备映射
    const cam = remoteCameras.value?.[deviceId]
    if (!cam) {
      $error('未获取到远程摄像头映射，请先连接/刷新')
      return
    }
    selectedRemoteClientId.value = cam.clientId
    // 关闭旧的预览
    stopRemotePreview()
    // 准备 PeerConnection
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'turn:120.55.85.213:3478', username: 'cenyc', credential: 'cenyc' }
      ]
    }
    webrtcPeer.value = new RTCPeerConnection(rtcConfig)
    webrtcConnected.value = false
    // 媒体轨接收
    webrtcPeer.value.addTransceiver('video', { direction: 'recvonly' })
    webrtcPeer.value.ontrack = (ev) => {
      const stream = ev.streams && ev.streams[0]
      if (stream && videoEl.value) {
        videoEl.value.srcObject = stream
      }
    }
    // ICE
    webrtcPeer.value.onicecandidate = (e) => {
      if (e.candidate && webrtcWs.value && webrtcWs.value.readyState === WebSocket.OPEN) {
        webrtcWs.value.send(JSON.stringify({
          type: 'ice-candidate',
          data: {
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex
          },
          target: cam.clientId,
          source: webrtcClientId.value
        }))
      }
    }
    webrtcPeer.value.onconnectionstatechange = () => {
      webrtcConnected.value = (webrtcPeer.value?.connectionState === 'connected')
    }

    // 创建并发送 offer
    const offer = await webrtcPeer.value.createOffer()
    await webrtcPeer.value.setLocalDescription(offer)
    if (!webrtcWs.value || webrtcWs.value.readyState !== WebSocket.OPEN) {
      await openSignalingIfNeeded()
    }
    webrtcWs.value.send(JSON.stringify({
      type: 'offer',
      data: { sdp: offer.sdp, type: offer.type },
      target: cam.clientId,
      source: webrtcClientId.value,
      camera_index: parseInt(cam.index ?? -1),
      camera_type: cam.type || 'local'
    }))
  } catch (e) {
    $error(e.message || '远程预览连接失败')
  }
}

function stopRemotePreview() {
  try {
    if (videoEl.value && videoEl.value.srcObject) {
      try { (videoEl.value.srcObject.getTracks() || []).forEach(t => t.stop()) } catch (e) { void e }
      videoEl.value.srcObject = null
    }
  } catch (e) { void e }
  try { webrtcPeer.value?.close() } catch (e) { void e }
  webrtcPeer.value = null
}

async function connectCameras() {
  connecting.value = true
  cameraLoading.value = true
  try {
    cameraOptions.value = []
    selectedCameraId.value = null

    // 自动探测：优先尝试局域网
    const base = getLanApiBaseUrl()
    let lanList = []
    if (base) {
      try {
        const resp = await fetchWithTimeout(`${base}/api/camera/list?func_type=2`, internal.LAN_TIMEOUT_MS || 3500)
        if (resp.ok) {
          const json = await resp.json()
          lanList = Array.isArray(json?.devices) ? json.devices
            : (Array.isArray(json?.data) ? json.data : [])
        }
      } catch { /* ignore */ }
    }

    if (lanList.length > 0) {
      connMode.value = 'lan'
      // 构建元数据映射与下拉列表（多台才显示下拉）
      const list = lanList
      const meta = {}
      cameraOptions.value = list.map((cam) => {
        meta[cam.device_id] = { fps: cam.fps || 10, name: cam.name, resolution: cam.resolution }
        return { label: `${cam.name || cam.device_id || 'Camera'} ${cam.resolution ? '(' + cam.resolution + ')' : ''}`,
                 value: cam.device_id }
      })
      cameraMeta.value = meta
      if (list.length === 1) {
        selectedCameraId.value = list[0].device_id
        await startLanPreview(selectedCameraId.value)
      }
    } else {
      // 远程 WebRTC（按 Demo 的方式通过信令发现与连接）
      connMode.value = 'webrtc'
      const list = await openSignalingAndDiscoverCameras()
      if (!Array.isArray(list) || list.length === 0) { $error('远程未发现手动录入摄像头'); return }
      const meta = {}
      cameraOptions.value = list.map((entry) => {
        const cam = entry.camera
        meta[cam.device_id] = { fps: cam.fps || 15, name: cam.name, resolution: cam.resolution }
        return { label: `${cam.name || cam.device_id || 'Camera'} ${cam.resolution ? '(' + cam.resolution + ')' : ''}`,
                 value: cam.device_id }
      })
      cameraMeta.value = meta
      if (list.length === 1) {
        selectedCameraId.value = list[0].camera.device_id
        await startRemotePreview(selectedCameraId.value)
      }
    }
  } catch (err) {
    $error(err.message || '连接失败')
  } finally {
    cameraLoading.value = false
    connecting.value = false
  }
}

function onCameraSelected() {
  if (!selectedCameraId.value) return
  if (connMode.value === 'lan') {
    startLanPreview(selectedCameraId.value)
  } else if (connMode.value === 'webrtc') {
    startRemotePreview(selectedCameraId.value)
  }
}

function onStreamError() {
  // 局域网 MJPEG 失败时，回退到快照轮询
  if (connMode.value === 'lan' && selectedCameraId.value && lanPreviewMode.value !== 'snapshot') {
    startLanSnapshotPreview(selectedCameraId.value)
  }
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

async function cropFaceFromDataUrl(imageDataUrl, bbox) {
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const imgW = img.width
      const imgH = img.height
      const [x, y, w, h] = Array.isArray(bbox) ? bbox : (bbox?.bbox || [0, 0, imgW, imgH])
      const cx = x + w / 2
      const cy = y + h / 2
      const side = Math.min(Math.max(w, h) * 1.2, Math.min(imgW, imgH))
      const sx = clamp(Math.round(cx - side / 2), 0, Math.max(0, imgW - Math.round(side)))
      const sy = clamp(Math.round(cy - side / 2), 0, Math.max(0, imgH - Math.round(side)))
      const s = Math.round(side)
      const canvas = document.createElement('canvas')
      canvas.width = s
      canvas.height = s
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, s, s, 0, 0, s, s)
      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.onerror = () => reject(new Error('裁剪失败'))
    img.src = imageDataUrl
  })
}

async function detectFacesLan(imageDataUrl) {
  const base = getLanApiBaseUrl()
  const resp = await fetch(`${base}/api/face/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl })
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  return Array.isArray(json?.faces) ? json.faces : []
}

async function detectFacesRemote(imageDataUrl) {
  const client = await ensureImageClient(selectedRemoteClientId.value || null)
  if (!client) throw new Error('远程连接组件未就绪')
  try { await client.preEstablishWebRTCConnection() } catch { throw new Error('远程连接失败') }
  const api = client?.remoteClient?.apiClient
  if (!api) throw new Error('远程数据通道未就绪')
  const resp = await api.post(`/api/face/capture`, { image: imageDataUrl })
  return Array.isArray(resp?.faces) ? resp.faces : []
}

function pickBestFace(faces) {
  if (!Array.isArray(faces) || faces.length === 0) return null
  let best = faces[0]
  let bestArea = 0
  for (const f of faces) {
    const bb = Array.isArray(f) ? f : (f?.bbox || [0,0,0,0])
    const area = (bb[2] || 0) * (bb[3] || 0)
    if (area >= bestArea) { best = f; bestArea = area }
  }
  return best
}

async function captureSnapshot() {
  try {
    if (connMode.value === 'lan' && selectedCameraId.value) {
      const base = getLanApiBaseUrl()
      const url = `${base}/api/camera/snapshot?device_id=${encodeURIComponent(selectedCameraId.value)}&ts=${Date.now()}`
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
          const faces = await detectFacesLan(dataUrl)
          if (!faces?.length) { $error('未检测到人脸'); return }
          if (faces.length > 1) { $error(`检测到${faces.length}张人脸，请确保只有一人`); return }
          const best = pickBestFace(faces)
          const cropped = await cropFaceFromDataUrl(dataUrl, best?.bbox || best)
          base64Image.value = cropped
          lastCapture.value = { original: dataUrl, faceBox: (best?.bbox || best) }
        } catch (e) {
          $error(e.message || '人脸检测失败')
        }
      }
      img.onerror = () => $error('抓拍失败，请重试')
      img.src = url
    } else if (connMode.value === 'webrtc' && selectedCameraId.value) {
      const client = await ensureImageClient(selectedRemoteClientId.value || null)
      if (!client) { $error('远程连接组件未就绪'); return }
      try { await client.preEstablishWebRTCConnection() } catch { $error('远程连接失败'); return }
      const api = client?.remoteClient?.apiClient
      if (!api) { $error('远程数据通道未就绪'); return }
      const resp = await api.get(`/api/camera/snapshot?device_id=${encodeURIComponent(selectedCameraId.value)}&ts=${Date.now()}`)
      if (resp && (resp.image_base64 || resp.data_base64)) {
        const dataUrl = `data:image/jpeg;base64,${resp.image_base64 || resp.data_base64}`
        try {
          const faces = await detectFacesRemote(dataUrl)
          if (!faces?.length) { $error('未检测到人脸'); return }
          if (faces.length > 1) { $error(`检测到${faces.length}张人脸，请确保只有一人`); return }
          const best = pickBestFace(faces)
          const cropped = await cropFaceFromDataUrl(dataUrl, best?.bbox || best)
          base64Image.value = cropped
          lastCapture.value = { original: dataUrl, faceBox: (best?.bbox || best) }
        } catch (e) {
          $error(e.message || '人脸检测失败')
        }
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

const onSubmit = async () => {
  if (!canSubmit.value) {
    $error('请完善信息并采集图片')
    return
  }
  loading.value = true
  try {
    const registrationData = {
      image: base64Image.value,
      original_image: lastCapture.value?.original || null,
      face_bbox: lastCapture.value?.faceBox || null,
      name: formData.value.name || '',
      type_id: typeId.value?.type_id,
      room_id: formData.value.room_id || null,
      device_id: (selectedCameraId.value || '').toString(),
      device_type: 0
    }

    if (connMode.value === 'lan') {
      const base = getLanApiBaseUrl()
      const resp = await fetch(`${base}/api/face/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      if (!data?.success) throw new Error(data?.error || '入库失败')
    } else {
      const client = await ensureImageClient(selectedRemoteClientId.value || null)
      if (!client) throw new Error('远程连接组件未就绪')
      try { await client.preEstablishWebRTCConnection() } catch { throw new Error('远程连接失败') }
      const api = client?.remoteClient?.apiClient
      if (!api) throw new Error('远程数据通道未就绪')
      const data = await api.post('/api/face/register', registrationData)
      if (!data?.success) throw new Error(data?.error || '入库失败')
    }

    latestImportData.value.unshift({
      id: Date.now(),
      name: formData.value.name || '',
      _img: base64Image.value,
      created_time: new Date().toISOString()
    })
    if (latestImportData.value.length > 9) latestImportData.value.pop()
    $success('导入成功')
    formData.value = {}
    base64Image.value = null
    typeId.value = null
    lastCapture.value = { original: null, faceBox: null }
  } catch (err) {
    $error(err?.message || '上传失败')
  } finally {
    loading.value = false
  }
}

const onReset = () => {
  formData.value = {}
  base64Image.value = null
  typeId.value = null
}

watch(selectedCameraId, async (val) => {
  if (!val) return
  if (connMode.value === 'lan') {
    startLanPreview(val)
  } else if (connMode.value === 'webrtc') {
    await startRemotePreview(val)
  }
})

onMounted(() => {
  // 页面进入后自动探测并连接
  connectCameras()
})

onBeforeUnmount(() => {
  try {
    if (Array.isArray(latestImportData.value)) {
      latestImportData.value.forEach(it => {
        if (it && typeof it._img === 'string' && it._img.startsWith('blob:')) {
          try { URL.revokeObjectURL(it._img) } catch (e) { void e }
        }
      })
    }
  } catch (e) { void e }
  try { imageClientRef.value?.close() } catch (e) { void e }
  if (lanPreviewTimer.value) { try { clearInterval(lanPreviewTimer.value) } catch (e) { void e } lanPreviewTimer.value = null }
  stopRemotePreview()
  try { if (webrtcWs.value) webrtcWs.value.close() } catch (e) { void e }
})

async function startLanPreview(deviceId) {
  // 优先使用 MJPEG 流预览，失败时由 onStreamError 回退到快照轮询
  if (lanPreviewTimer.value) { clearInterval(lanPreviewTimer.value); lanPreviewTimer.value = null }
  stopRemotePreview()
  const base = getLanApiBaseUrl()
  const fpsHint = cameraMeta.value?.[deviceId]?.fps || 20
  const fps = clamp(fpsHint, 1, 30)
  lanPreviewMode.value = 'mjpeg'
  streamUrl.value = `${base}/api/camera/stream_mjpeg?device_id=${encodeURIComponent(deviceId)}&fps=${fps}&ts=${Date.now()}`
}

function startLanSnapshotPreview(deviceId) {
  if (lanPreviewTimer.value) { clearInterval(lanPreviewTimer.value); lanPreviewTimer.value = null }
  lanPreviewMode.value = 'snapshot'
  const base = getLanApiBaseUrl()
  const update = () => {
    const ts = Date.now()
    streamUrl.value = `${base}/api/camera/snapshot?device_id=${encodeURIComponent(deviceId)}&ts=${ts}`
  }
  update()
  lanPreviewTimer.value = setInterval(update, 200)
}

// 打开信令并发现远程摄像头（func_type=2）
async function openSignalingAndDiscoverCameras() {
  internal.loadDefaultsFromConfig()
  await internal.getValidApiKey(userStore.tenant_id, userStore.token)
  const authUrl = (internal.AUTH_URL || '').replace(/\/$/, '')
  const sigUrlRaw = internal.SIGNALING_URL || ''
  // 如已有旧连接，先关闭
  try {
    if (webrtcWs.value && (webrtcWs.value.readyState === WebSocket.OPEN || webrtcWs.value.readyState === WebSocket.CONNECTING)) {
      webrtcWs.value.close()
    }
  } catch (e) { void e }
  // 获取token
  const authResp = await fetch(`${authUrl}/api-auth`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: internal.api_key })
  })
  if (!authResp.ok) throw new Error(`认证失败: ${authResp.status}`)
  const authJson = await authResp.json()
  if (!authJson?.success || !authJson?.token) throw new Error(authJson?.error || '认证失败')
  webrtcToken.value = authJson.token
  webrtcClientId.value = `web_ui_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 建立 WebSocket 信令
  await new Promise((resolve, reject) => {
    let wsUrl = sigUrlRaw
    if (!wsUrl.includes('/ws')) wsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws` : `${wsUrl}/ws`
    const ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', token: webrtcToken.value, id: webrtcClientId.value }))
      resolve()
    }
    ws.onerror = () => reject(new Error('信令连接失败'))
    ws.onclose = () => { /* ignore */ }
    webrtcWs.value = ws
  })

  // 监听信令消息（仅设置一次）
  if (!webrtcWs.value._bound) {
    webrtcWs.value._bound = true
    webrtcWs.value.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'clients_list') {
          const list = Array.isArray(msg.clients) ? msg.clients : []
          const map = {}
          const entries = []
          for (const client of list) {
            const cams = Array.isArray(client.cameras) ? client.cameras.filter(c => c.func_type === 2) : []
            for (const cam of cams) {
              map[cam.device_id] = { clientId: client.id, index: cam.index, type: cam.type, name: cam.name, resolution: cam.resolution, fps: cam.fps }
              entries.push({ clientId: client.id, camera: cam })
            }
          }
          remoteCameras.value = map
          // 更新下拉
          const meta = {}
          cameraOptions.value = entries.map((entry) => {
            const cam = entry.camera
            meta[cam.device_id] = { fps: cam.fps || 15, name: cam.name, resolution: cam.resolution }
            return { label: `${cam.name || cam.device_id || 'Camera'} ${cam.resolution ? '(' + cam.resolution + ')' : ''}`,
                     value: cam.device_id }
          })
          cameraMeta.value = meta
        } else if (msg.type === 'answer') {
          if (webrtcPeer.value && msg.data) {
            const desc = new RTCSessionDescription({ sdp: msg.data.sdp, type: msg.data.type })
            await webrtcPeer.value.setRemoteDescription(desc).catch(() => {})
          }
        } else if (msg.type === 'ice-candidate') {
          if (webrtcPeer.value && msg.data) {
            const cand = new RTCIceCandidate({ candidate: msg.data.candidate, sdpMid: msg.data.sdpMid, sdpMLineIndex: msg.data.sdpMLineIndex })
            await webrtcPeer.value.addIceCandidate(cand).catch(() => {})
          }
        } else if (msg.type === 'registered') {
          // 注册成功后查询客户端
          webrtcWs.value?.send(JSON.stringify({ type: 'query_clients', source: webrtcClientId.value }))
        }
      } catch { /* ignore */ }
    }
  }

  // 主动发起一次查询
  webrtcWs.value?.send(JSON.stringify({ type: 'query_clients', source: webrtcClientId.value }))

  // 等待一点时间收集列表
  await new Promise((r) => setTimeout(r, 500))
  // 返回 entries 形式方便上层构建 options
  const resultEntries = []
  Object.keys(remoteCameras.value || {}).forEach((did) => {
    const cam = remoteCameras.value[did]
    resultEntries.push({ clientId: cam.clientId, camera: { device_id: did, index: cam.index, type: cam.type, name: cam.name, resolution: cam.resolution, fps: cam.fps } })
  })
  return resultEntries
}

async function openSignalingIfNeeded() {
  if (webrtcWs.value && webrtcWs.value.readyState === WebSocket.OPEN) return
  await openSignalingAndDiscoverCameras()
}

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





