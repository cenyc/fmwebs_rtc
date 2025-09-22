<template>
  <div class="flex si-chart" style="height:336px;overflow:hidden">
    <div class="text-center full-width">{{ props.title }}</div>
    <div class="flex flex-center full-width" :class="{ 'si-input q-mt-lg': device || range || date }">
      <SIDeviceIdInput v-if="device" class="q-mr-sm" @fill-fields="handleFillFields" />
      <SIDateTypeInput v-if="range" class="q-mr-sm" @fill-fields="handleFillFields" />
      <SICreateTimeInput v-if="date" :range="false" borderless v-model="dateRange" @fill-fields="handleFillFields" />
      <div v-else-if="isRangeStr">{{ charts.formatDate(dateRange.from, true) + ' - ' + charts.formatDate(dateRange.to)
      }}
      </div>
      <div v-else class="chart-primary">截至 {{ nowTime }} </div>
    </div>
    <div class="full-width">
      <SIChart :option="barOption" height="280" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { last7Days, make7Days, dateTimeRange, formatDate, now } from 'src/utils/tools'
import SIDeviceIdInput from '../siinputs/SIDeviceIdInput.vue';
import SIDateTypeInput from '../siinputs/SIDateTypeInput.vue';
import SICreateTimeInput from '../siinputs/SICreateTimeInput.vue';
import SIChart from '../SIChart.vue'
import charts from 'src/utils/charts'
const props = defineProps({
  index: { type: Number, default: 0 },
  title: String,
  date: {
    type: Boolean,
    default: true
  },
  range: {
    type: Boolean,
    default: true
  },
  isRangeStr: {
    type: Boolean,
    default: false
  },
  device: {
    type: Boolean,
    default: false
  },
  subType: {
    type: String,
    default: ''
  },
})
const emit = defineEmits(['update:dateRange'])
const dateRange = ref(last7Days())
const nowTime = ref(now())
const param = ref({ range_type: 'date', end_time: formatDate(nowTime.value) })
const barOption = ref({
  title: {
    show: props.index < 1,
    left: 10,
    top: 10,
    subtext: '单位（次）',
    subtextStyle: {
      color: '#4876FF',
      fontSize: 12
    }
  },
  tooltip: {
    trigger: 'item',
  },
  xAxis: {
    type: 'category',
    axisLabel: {
      // interval: 0  // 关闭自动间隔，显示所有标签
    },
    data: !props.device ? make7Days() : [...Array(7)].map((_, i) => `相机${i + 1}`)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [0, 0, 0, 0, 0, 0, 0],
      type: 'bar',
      barWidth: charts.barWidth,
      itemStyle: charts.barItemStyle,
    }
  ],
  date: param
})
const handleFillFields = (val) => {
  console.log('handleFillFields', val)
  if (val?.device) {
    console.log('param', param.value)
    barOption.value.xAxis.device = val.device
    param.value.device = val.device.map(item => item.value).join(',')
    console.log('dateRange', dateRange.value)
  }
  if (props.date) {
    if (val?.start_time) {
      // param.value.start_time = val.start_time
      param.value.end_time = val.end_time
      console.log('dateRange2', dateRange.value)
    } else {
      console.log('dateRange3', dateRange.value)
      const { end_time } = dateTimeRange(dateRange.value)
      console.log('xxxxx', end_time)
      // param.value.start_time = start_time
      param.value.end_time = end_time
    }
  }
  param.value.range_type = val?.range_type || param.value.range_type // || 'date'
  param.value.sub_type = props.subType || undefined
  emit('update:dateRange', param.value, props.index)
  props.index === 4 && (nowTime.value = now())
}

// 暴露图表数据方便父组件调用
defineExpose({
  barOption,
})
</script>
