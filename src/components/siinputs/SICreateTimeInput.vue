<template>
  <div class="text-center">
    <!-- 输入框触发弹出日期选择器 -->
    <q-input v-model="dateRangeText" label="选择时间" readonly dense borderless @click="showDialog = true"
      :class="{ 'chart': isChart, 'time': !isChart }">
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale" v-model="showDialog">
            <q-date v-model="dateRange" :range="range" :options="filterDates" today-btn
              @update:model-value="handleDateUpdate">
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="取消" color="primary" flat v-close-popup @click="cancelSelection" />
                <q-btn label="确定" color="primary" flat @click="confirmSelection" v-close-popup />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { dateTimeRange, formatDate } from 'src/utils/tools'
const props = defineProps({
  modelValue: {
    type: [Object, String],
    default: () => ({ from: null, to: null })
  },
  isChart: {
    type: Boolean,
    default: true
  },
  range: {
    type: Boolean,
    default: true
  },
  mode: String
})
const emit = defineEmits(['update:modelValue', 'fillFields'])
const showDialog = ref(false)
const dateRange = computed({
  get: () => props.range ? props.modelValue : props.modelValue.to,
  set: (value) => emit('update:modelValue', props.range ? value : { to: value })
})

// 计算属性：显示在输入框中的文本
const dateRangeText = computed(() => {
  if (props.range) {
    if (!dateRange.value?.from || !dateRange.value?.to) return ''
    return `${formatDisplayDate(dateRange.value.from)} ${props.isChart ? '-' : '至'} ${formatDisplayDate(dateRange.value.to)}`
  }
  return formatDate(dateRange.value, 'YYYY/MM/DD')
})

// 日期格式化函数
const formatDisplayDate = (dateStr) => {
  return formatDate(dateStr, props.isChart ? 'MM/DD' : 'YYYY-MM-DD')
}

// 日期过滤函数（可选）
const filterDates = (dt) => {
  // 示例：只能选择今天及之后的日期
  // const today = formatDate(new Date(), 'YYYY/MM/DD')
  // return dt >= today

  // 也可以限制特定范围
  const minDate = '2025/01/01'
  const maxDate = props.isChart ? formatDate(new Date(), 'YYYY/MM/DD') : '2125/12/31'
  return dt >= minDate && dt <= maxDate
}

// 日期更新处理
const handleDateUpdate = (value) => {
  // 可以在这里添加额外的处理逻辑
  console.log('日期更新:', value)
}

// 取消选择，重置日期范围
const cancelSelection = () => {
  if (dateRange.value?.from || dateRange.value?.to) {
    dateRange.value = { from: null, to: null }
    emit('fillFields', { start_time: '', end_time: '' })
  }
}
// 确认选择
const confirmSelection = () => {
  // 错误日期的条件
  // const isErrorDate = props.range && (!dateRange.value?.from || !dateRange.value?.to)
  // if (isErrorDate || (!props.range && !dateRange.value)) {
  //   // 可以添加未选择完整范围的处理
  //   console.warn('请选择完整的日期范围', dateRange.value)
  //   const dateTime = dateTimeRange({ from: dateRange.value, to: dateRange.value })
  //   dateRange.value = { from: dateTime.start_time, to: dateTime.end_time }
  //   console.log('确认选择111:', dateTime)
  //   return emit('fillFields', dateTime)
  // }
  // 这里可以添加确认后的逻辑，如触发父组件事件等
  const dateTime = dateTimeRange({ from: dateRange.value?.from || dateRange.value, to: dateRange.value?.to || dateRange.value })
  props.range && (typeof dateRange.value == 'string') && (dateRange.value = { from: dateTime.start_time, to: dateTime.end_time })
  console.log('确认选择:', dateTime, dateRange.value)
  emit('fillFields', dateTime)
}

</script>

<style scoped>
/* 可以添加自定义样式 */
/* .q-input.time {
  min-width: 175px;
} */
</style>
