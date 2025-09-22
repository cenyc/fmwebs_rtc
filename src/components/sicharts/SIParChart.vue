<template>
  <div class="flex si-chart" style="height:336px;overflow:visible">
    <div class="text-center full-width">{{ props.title }}</div>
    <div class="si-input flex flex-center full-width q-mt-lg">
      <SIDeviceIdInput v-if="device" class="q-mr-sm" @fill-fields="handleFillFields" />
      <SIDateTypeInput class="q-mr-sm" @fill-fields="handleFillFields" />
      <SICreateTimeInput :range="false" borderless v-model="dateRange" @fill-fields="handleFillFields" />
    </div>
    <div class="full-width">
      <SIChart :option="parOption" height="280" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { last7Days, make7Days, formatDate, now } from 'src/utils/tools'
import SIDeviceIdInput from '../siinputs/SIDeviceIdInput.vue';
import SIDateTypeInput from '../siinputs/SIDateTypeInput.vue';
import SICreateTimeInput from '../siinputs/SICreateTimeInput.vue';
import SIChart from '../SIChart.vue'
import { dateTimeRange } from 'src/utils/tools';
import charts from 'src/utils/charts';

const param = ref({ range_type: 'date', end_time: formatDate(now()) })
const props = defineProps({
  title: String,
  index: Number,
  device: Boolean,
  subType: {
    type: String,
    default: 'date'
  }
})
const emit = defineEmits(['update:dateRange'])
const dateRange = ref(last7Days())
const parOption = ref({
  color: charts.colors,
  tooltip: {
    trigger: 'item',
  },
  legend: {
    show: true,
    selectedMode: true,
    top: 15
  },
  yAxis: {
    type: 'value'
  },
  xAxis: {
    type: 'category',
    data: make7Days()
  },
  series: { type: 'bar', data: [0] },
  date: param
})
const handleFillFields = (val) => {
  if (val?.device) {
    // param.value.sub_type = 'date'
    // param.value.range_type = 'date'
    param.value.two_model = 1;
    parOption.value.xAxis.device = val.device
    param.value.device = val.device.map(item => item.value).join(',')
  }
  if (val?.start_time) {
    param.value.start_time = val.start_time
    param.value.end_time = val.end_time
  } else {
    const { start_time, end_time } = dateTimeRange(dateRange.value)
    param.value.start_time = start_time
    param.value.end_time = end_time
  }
  param.value.range_type = val?.range_type || param.value.range_type // || 'date'
  param.value.sub_type = props.subType
  emit('update:dateRange', param.value, props.index)
}
// 暴露图表数据方便父组件调用
defineExpose({
  parOption,
})
</script>
