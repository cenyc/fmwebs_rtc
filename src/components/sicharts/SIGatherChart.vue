<template>
  <div class="row">
    <div class="col-2 q-pt-lg q-px-lg text-center" style="border-right:1px solid #C2D1FF">
      <p>今日采集数量</p>
      <p style="font-size:16px;font-weight:bolder;color:#2D78FF">{{ today }}</p>
      <p class="q-pt-xl">累计采集数量</p>
      <p style="font-size:16px;font-weight:bolder;color:#2D78FF">{{ total }}</p>
    </div>
    <div class="col-4 q-pt-lg" style="border-right:1px solid #C2D1FF">
      <p class="text-center">当前有效数量</p>
      <SIChart :option="currentOption" @mouseover="charts.handleMouseOver($event, currentOption)"
        @mouseout="charts.handleMouseOut(currentOption)" @highlight="charts.handleHighlight($event, currentOption)"
        @downplay="charts.handleDownplay(currentOption)"
        @legendselectchanged="charts.handleLegendselectchanged($event, currentOption)" />
    </div>
    <div class="col-6">
      <div class="text-center text-subtitle1 q-pt-lg">近一周采集统计（按日期）</div>
      <div class="text-center text-subtitle2 q-pt-sm">{{ weekStr }}</div>
      <SIChart :option="weekdateOption" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import SIChart from '../SIChart.vue';
import charts from 'src/utils/charts'
import api from 'src/api/main'
const today = ref(0)
const total = ref(0)
const weekStr = ref('')
api.dataGet('aly/week/gather').then(res => {
  console.log(res)
  const gather = res.total_data.gather
  today.value = gather.find(item => item.time_range === 'd1')?.count
  total.value = gather.find(item => item.time_range === 'all')?.count
  const dateObj = res['data']['date']
  weekStr.value = charts.formatDate(dateObj[0].stats, true) + ' - ' + charts.formatDate(dateObj[dateObj.length - 1].stats)
  currentOption.value.series[0].data = charts.generateData(res['total_data'], 'user')
  currentOption.value.title.text = charts.calcTotal(currentOption)
  weekdateOption.value.xAxis.data = charts.extractDate(dateObj)
  weekdateOption.value.series[0].data = charts.extractData(dateObj)
})
// 中间图表配置 - 当前有效
const currentOption = ref({
  title: {
    text: '',
    left: 'center',
    top: '40%',
    subtext: '总数',
    textStyle: {
      color: '#333',
      fontSize: 20
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    top: 'middle',
    left: 'right',
    orient: 'vertical',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      color: '#333'
    }
  },
  series: [
    {
      id: 'today',
      name: '当前有效',
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      data: []
    }
  ]
})
const weekdateOption = ref({
  title: {
    left: 10,
    top: 10,
    subtext: '单位（次）',
    subtextStyle: {
      color: '#4876FF',
      fontSize: 12
    }
  },
  xAxis: {
    type: 'category',
    axisLabel: {
      interval: 0  // 关闭自动间隔，显示所有标签
    },
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [],
      type: 'bar',
      barWidth: charts.barWidth,
      itemStyle: charts.barItemStyle
    }
  ]
})
</script>
