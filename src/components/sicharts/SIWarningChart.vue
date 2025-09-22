<template>
  <div class="flex">
    <p>预警{{ showBar ? '统计' : '数量' }}</p>
    <template v-if="!showBar">
      <q-space />
      <q-btn dense rounded unelevated icon="upload" size="md" label="导出图表" class="export-btn q-mb-sm"
        @click="charts.exportChartsToPDF('人员预警统计')" />
    </template>
  </div>
  <q-card flat :class="{ 'row': !showBar }">
    <q-card-section :class="showBar ? 'q-pa-xs' : 'col-6'">
      <div class="row q-pt-md si-chart">
        <div class="col-4 q-pl-xl">
          <SIPieChart :ref="(el) => refs['ca'] = el" title="今日预警" :date="false" @update:date-range="getWarn" legend />
        </div>
        <div class="col-4">
          <SIPieChart :ref="(el) => refs['cb'] = el" title="累计预警" :date="false" @update:date-range="getWarn" />
        </div>
        <div class="col-4">
          <SIPieChart :ref="(el) => refs['cc'] = el" title="待处理预警" :date="false" @update:date-range="getWarn" />
        </div>
      </div>
      <!-- 中部柱状图 近一周预警统计 -->
      <div class="row" v-if="showBar">
        <div class="col-6">
          <SIBarChart :ref="(el) => refs['cd'] = el" title="近一周预警统计（按日期）" is-range-str :date="false" :range="false"
            @update:date-range="getWarn" />
        </div>
        <div class="col-6">
          <SIBarChart :ref="(el) => refs['ce'] = el" title="近一周预警统计（按位置）" is-range-str :date="false" :range="false"
            @update:date-range="getWarn" />
        </div>
      </div>
    </q-card-section>
  </q-card>
  <div v-if="!showBar" class="row q-mt-md">
    <div class="col-12">
      <p>预警统计</p>
      <q-card flat class="q-pa-md">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-4 flex flex-center si-chart">
              <SIPieChart :ref="(el) => refs['c1'] = el" legend title="人员预警统计" @update:date-range="getWarn" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c2'] = el" :index="2" title="人员预警总人数VS统计周期" sub-type="date"
                @update:date-range="getWarn" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c3'] = el" :index="3" title="累计人员预警次数VS统计周期" sub-type="accrued"
                @update:date-range="getWarn" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat class="q-pa-md q-mt-lg">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c4'] = el" :index="4" title="按人员预警位置累计分布" device sub-type="accrued"
                :date="false" :range="false" @update:date-range="getWarn" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c5'] = el" :index="5" title="人员预警次数VS预警位置" device sub-type="date"
                @update:date-range="getWarn" />
            </div>
            <div class="col-4">
              <SIParChart :ref="(el) => refs['c6'] = el" :index="6" title="人员预警位置VS统计周期" device two-model
                @update:date-range="getWarn" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat class="q-pa-md q-mt-lg">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-6">
              <SILineChart :ref="(el) => refs['c7'] = el" :index="7" title="按人员预警时段累计分布" name="累计预警" />
            </div>
            <div class="col-6">
              <SIBarChart :ref="(el) => refs['c8'] = el" :index="8" title="人员预警次数VS预警时段" sub-type="hour"
                @update:date-range="getWarn" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import charts from 'src/utils/charts'
import SIPieChart from './SIPieChart.vue'
import SIBarChart from './SIBarChart.vue'
import SIParChart from './SIParChart.vue'
import SILineChart from './SILineChart.vue'
import main from 'src/api/main'
const refs = ref({})
const props = defineProps({
  showBar: {
    type: Boolean,
    default: true
  }
})
const getWarn = (val, index = 0) => {
  console.log('val-index', index)
  main.dataGet('aly/week/warn', val).then(res => {
    const isZero = index === 0
    if (isZero) {
      console.log('capture res', res)
      charts.updatePieOption(refs.value['ca'], res.total_data['d1'])
      charts.updatePieOption(refs.value['cb'], res.total_data['all'])
      charts.updatePieOption(refs.value['cc'], res.total_data['todo'])
      if (props.showBar) {
        charts.updateBarOption(refs.value['cd'], res.data['date'])
        charts.updateBarOption(refs.value['ce'], res.data['position'])
        return;
      }
    }
    if (isZero || index === 1) {
      charts.updatePieOption(refs.value['c1'], res.data['user'], false)
    }
    if (isZero || index === 2) {
      charts.updateBarOption(refs.value['c2'], res['data']['date'])
    }
    if (isZero || index === 3) {
      charts.updateBarOption(refs.value['c3'], res['data']['accrued'])
    }
    if (isZero || index === 7) {
      charts.updateBarOption(refs.value['c7'], res.total_data['accrued_hour'], false, true)
    }
    if (isZero || index === 8) {
      charts.updateBarOption(refs.value['c8'], res['data']['hour'], false, true)
    }
    if (index === 4) {
      charts.updateBarOption(refs.value['c4'], res['data']['accrued'], true)
    }
    else if (index === 5) {
      charts.updateBarOption(refs.value['c5'], res['data']['date'], true)
    }
    else if (index === 6) {
      charts.updateParOption(refs.value['c6'], res['data']['date'])
    }

  })
}
getWarn()
</script>
