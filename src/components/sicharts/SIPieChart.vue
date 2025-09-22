<!-- 圆环图 -->
<template>
  <div class="flex" :class="{ 'flex-center': !date }" :style="{ height: date ? '336px' : 'auto', overflow: 'visible' }">
    <div @click="testNewMsg" v-if="title" class="text-center q-ml-md full-width z-fab">
      <div :class="{ 'legend-title': !date && legend }">{{ (date ? '自定义周期内' : '') + title }}</div>
    </div>
    <div v-if="date" style="width:170px">
      <div class="si-input relative-position flex-sm-block q-ml-sm">
        <SICreateTimeInput is-chart class="absolute" style="top:130px" v-model="dateRange"
          @fill-fields="handleDateChange" />
      </div>
    </div>
    <div :style="{ width: !date && legend ? '300px' : '200px', marginTop: date ? '-50px' : 'auto' }">
      <div :style="{ width: !date && legend ? '400px' : '100%' }">
        <SIChart :option="pieOption" :height="date ? 386 : 200" @mouseover="charts.handleMouseOver($event, pieOption)"
          @mouseout="charts.handleMouseOut(pieOption)" @highlight="charts.handleHighlight($event, pieOption)"
          @downplay="charts.handleDownplay(pieOption)"
          @legendselectchanged="charts.handleLegendselectchanged($event, pieOption)" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { last7Days } from 'src/utils/tools'
import SICreateTimeInput from '../siinputs/SICreateTimeInput.vue';
import SIChart from '../SIChart.vue';
import main from 'src/api/main';
import charts from 'src/utils/charts'
const testNewMsg = () => {
  console.log('testNewMsg')
  main.dataPost('alert/news', { id: 10, capture_log_id: 16, profile_type_id: 65 }).then(res => {
    console.log(res)
  })
}
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  // 是否允许选择时间段
  date: {
    type: Boolean,
    default: true,
  },
  // 图例位置
  legend: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:dateRange'])
const dateRange = ref(last7Days())
const pieOption = ref({
  title: {
    show: true,
    text: '',
    left: props.legend ? 75 : 95,
    top: props.date ? '45%' : '40%',
    textAlign: 'center',
    subtext: '总数',
    textStyle: {
      fontSize: 20,
      color: '#333'
    },
    subtextStyle: {
      fontSize: 12,
      color: '#666',
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: props.title + '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    show: props.legend,
    formatter: `{a|{name}}`,  // 富文本占位符
    textStyle: {
      rich: {
        a: {
          width: 50,  // 自定义宽度
          backgroundColor: 'transparent'  // 关键：必须透明
        }
      }
    },
    top: 280,
    left: '0',
    // right: -18,
    // orient: 'vertical',  // 垂直排列
    // orient: 'horizontal',  // 水平排列
    width: 180,
    // height: 20,
    itemWidth: 10,           // 设置图例项的宽度
    itemHeight: 10,
    itemGap: 15,          // 图例每项之间的间隔
    // padding: [5, 50],     // 增加左右 padding 让图例有空间换行
    icon: 'path://M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z'
  },
  series: [
    {
      id: 'today',
      name: '',
      type: 'pie',
      top: '0',
      left: '0',
      radius: ['50%', '70%'],
      center: [props.legend ? 80 : 100, '50%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center',
        // formatter: "{b} \n数量:{c}个 \n(占比:{d}%)",
      },
      data: []
    }
  ],
  date: dateRange.value
});
const handleDateChange = (val) => {
  val.start_time && emit('update:dateRange', val, 1)
}
// 暴露图表数据方便父组件调用
defineExpose({
  pieOption,
})
</script>
<style scoped>
.legend-title {
  position: relative;
  left: -70px !important;
}
</style>
