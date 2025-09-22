<template>
  <SIChart :option="onlineOption" @mouseover="charts.handleMouseOver($event, onlineOption)"
    @mouseout="charts.handleMouseOut(onlineOption)" />
</template>
<script setup>
import { ref } from 'vue'
import charts from 'src/utils/charts'
import SIChart from 'components/SIChart.vue'
const onlineOption = ref({
  title: {
    show: true,
    text: '25%',
    left: 'center',
    top: 'center',
    textStyle: {
      fontSize: 20,
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'item',
    // formatter: '{b} : {c}%' // '{a} <br/>{b}: {c} ({d}%)'
  },
  series: [
    {
      id: 'total',
      name: '在线率',
      type: 'pie',
      top: '0',
      left: '0',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      data: [{ value: 25, name: '在线' }, { value: 75, name: '离线' }]
    }
  ]
})
</script>
