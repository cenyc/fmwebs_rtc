<template>
  <div class="flex si-chart" style="height:336px;overflow:hidden">
    <div class="text-center full-width">{{ props.title }}</div>
    <div class="si-input flex flex-center full-width q-mt-lg">
      <div class="chart-primary">截至 {{ nowTime }} </div>
    </div>
    <div class="full-width">
      <SIChart :option="barOption" height="280" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { formatDate, now } from 'src/utils/tools'

import SIChart from '../SIChart.vue'
const nowTime = now()
const param = ref({ end_time: formatDate(nowTime) })
const props = defineProps({
  title: String,
  index: Number,
  name: String
})

const barOption = ref({
  color: ['#556FFD'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [...Array(24)].map((_, i) => `${i}:00`)
  },
  yAxis: {
    type: 'value',
    // axisLabel: {
    //   formatter: '{value} W'
    // },
    axisPointer: {
      snap: true
    }
  },
  series: [
    {
      name: props.name,
      type: 'line',
      smooth: true,
      lineStyle: { width: 2, color: '#556FFD' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(72,118,255,1)' },
            { offset: 1, color: 'rgba(72,118,255,0)' }
          ]
        }
      },
      // symbol: 'none',
      // prettier-ignore
      data: [0],
    }
  ],
  date: param
})

// 暴露图表数据方便父组件调用
defineExpose({
  barOption,
})
</script>
