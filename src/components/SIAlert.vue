<template>
  <q-dialog v-model="showDialog" persistent @before-show="initFormData">
    <q-card style="min-width: 718px; min-height:600px; overflow: visible;" flat class="q-pa-md">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">预警处理</div>
        <q-space />
        <q-icon name="error" round v-close-popup style="position:absolute;top:-50px;right:30px;font-size:80px"
          :style="`color:${colors[message.level ? (message.level - 1) : 0]}`" />
      </q-card-section>
      <q-card-section>
        <q-form>
          <q-img :src="previewUrl || dialogImgSrc" style="width: 402px; height: 233px;" />
          <q-btn color="primary" rounded outline label="轨迹跟踪" class="q-ml-md"
            style="width:100px;min-height:30px;margin-top:200px;background: rgba(95, 148, 255, 0.1)!important"
            @click="showDialog = false" :to="`/inventory_history?matched_profile_id=${message.matched_profile_id}`" />
          <div class="si-input border">
            <label for="created_at">抓拍时间</label>
            <q-input for="created_at" rounded dense borderless :model-value="formatDate(message.created_time)" readonly
              class="bg-none" />
          </div>
          <div class="si-input border">
            <label for="created_at">预警位置</label>
            <q-input for="created_at" rounded dense borderless v-model="message.location" readonly class="bg-none" />
          </div>
          <div class="si-input border flex" style="height:auto">
            <label for="created_at">人员属性</label>
            <q-input for="created_at" rounded dense borderless v-model="profilesType" readonly
              style="max-width:160px!important;max-height:30px!important;min-height:30px!important;height:30px!important"
              class="bg" placeholder="请选择人员属性" />
            <span class="q-ml-lg">请及时问询该人员，并尽快办理登记</span>
            <q-option-group v-model="message.profile_type_id" inline dense :options="wsStore.typeOptions" color="green"
              type="radio" style="padding-left:80px" />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions class="q-pa-lg flex-center">
        <q-btn v-if="false" flat rounded text-color="teal" padding="3px 16px" icon="arrow_back_ios"
          :label="wsStore.page - 1 > 0 ? `第 ${wsStore.page - 1} 条` : '没有了'" class="q-mr-lg" @click="getPrevAlert"
          :disable="wsStore.page <= 1" />
        <q-btn rounded unelevated size="md" padding="3px 36px" label="确认" type="submit" color="primary" class="q-mr-lg"
          :loading="submitting" @click="onSubmit" v-close-popup />
        <q-btn rounded unelevated size="md" padding="3px 36px" label="忽略" color="warning" class="q-mr-lg"
          :loading="submitting" @click="wsStore.updateAlert(2)" v-close-popup />
        <q-btn v-if="!wsStore.custom" flat rounded text-color="teal" padding="3px 10px" icon-right="arrow_forward_ios"
          :label="wsStore.page + 1 > wsStore.unread ? '没有了' : `下一条`" @click="getNextAlert"
          :disable="wsStore.page >= wsStore.unread" />
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useWebSocketStore } from 'src/stores/ws'
import { useInternalServerStore } from 'src/stores/internal_server'
import { formatDate } from 'src/utils/tools'
const wsStore = useWebSocketStore()
const internal = useInternalServerStore()
// 按钮颜色
const colors = [
  '#FF6D65',
  '#FFA565',
  '#FFD165',
  '#D3D3D3'
]
const submitting = ref(false)
// 根据 message.matched_profile_id 在 typeOptions 中找到对应的 value 并选中
const profilesType = computed(() => wsStore.typeOptions.find(option => option.value === message.value.profile_type_id)?.label || '')
const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])
const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
const message = computed(() => wsStore.custom || wsStore.alert || {})
// 兼容不同字段名：优先 capture_image_url，其次 image_url、image_path
const dialogImgSrc = computed(() => {
  const m = message.value || {}
  return m.capture_image_url || m.image_url || m.image_path || wsStore.item?.capture_image_url || wsStore.item?.image_url || wsStore.item?.image_path || ''
})

// 如同表格中图片一样，若是内部机路径，优先用内部机客户端生成可访问的 URL 预览
const previewUrl = computed(() => {
  const p = dialogImgSrc.value
  if (!p) return ''
  // 简单判断：不是 http(s) 且是常见图片后缀 → 认为是内部路径
  const isHttp = /^https?:\/\//i.test(p)
  const isImg = /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.tiff|\.ico)$/i.test(p.split('?')[0])
  if (isHttp || !isImg) return p
  // 使用内部机直链（若已知私网IP），否则回退原路径
  const ip = internal.effectiveInternalIp
  const endpoint = internal.IMAGE_ENDPOINT || '/api/images/by-path'
  try {
    if (ip) {
      const port = internal.INTERNAL_PORT
      const proto = 'http://'
      const base = port ? `${proto}${ip}:${port}` : `${proto}${ip}`
      const url = `${base}${endpoint}?path=${encodeURIComponent(p)}`
      return url
    }
  } catch (err) { void err }
  return p
})
const initFormData = () => {
  // 初始化表单数据
}
const getNextAlert = () => {
  wsStore.page++
  wsStore.getAlerts()
}
const getPrevAlert = () => {
  wsStore.page--
  wsStore.getAlerts()
}
const onSubmit = () => {
  // console.log('提交', wsStore.localTypeId, message.value.profile_type_id)
  // if (wsStore.localTypeId !== message.value.profile_type_id) {
  // 更新 Profile
  wsStore.updateAlert()
  // }
}

// function playSystemBeep() {
//   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//   const oscillator = audioCtx.createOscillator();
//   const gainNode = audioCtx.createGain();
//   oscillator.connect(gainNode);
//   gainNode.connect(audioCtx.destination);
//   oscillator.type = 'sine';  // 正弦波模拟系统提示音
//   oscillator.frequency.value = 800;  // 频率设为800Hz
//   gainNode.gain.value = 0.5;  // 音量50%
//   oscillator.start();
//   oscillator.stop(audioCtx.currentTime + 0.3);  // 持续300ms
// }
</script>
<style lang="scss" scoped>
label {
  min-width: 80px
}

.q-icon {
  background-color: white;
  border-radius: 50%;
}

.q-card {
  border: 1px solid $border-color;
  border-radius: 20px;
}

.q-img {
  border: 1px solid #5F94FF;
  border-radius: 4px;
}

.q-btn {
  min-width: 30px !important;
}

:deep(.si-input) {
  height: 46px;
  line-height: 46px;
  padding-top: 10px;
  margin-top: 5px;

  span {
    color: #FF5F5F;
    margin-left: 10px;
  }

  .bg.q-field--dense .q-field__control {
    height: 30px;
    padding-left: 20px;
    min-width: 120px !important;
    max-width: 120px !important;
  }

  .bg-none.q-field .q-field__control {
    background: none !important;
  }

  .q-option-group--inline>div {
    width: 120px;
  }
}
</style>
