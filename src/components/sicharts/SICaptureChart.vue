<template>
  <div :class="{ 'col-4': showBar }">
    <div class="flex">
      <p>抓拍{{ showBar ? '统计' : '数量' }}</p>
      <template v-if="!showBar">
        <q-space />
        <q-btn dense rounded unelevated icon="upload" size="md" label="导出图表" class="export-btn q-mb-sm"
          @click="charts.exportChartsToPDF('人员抓拍统计')" />
      </template>
    </div>
    <q-card flat class="row">
      <q-card-section :class="showBar ? 'q-pa-xs' : 'col-6'">
        <div class="row items-center justify-between si-chart q-pt-md" :style="{ marginLeft: showBar ? '-8%' : '0' }">
          <!-- 左侧圆环图 -->
          <div :class="'col-' + (showBar ? 8 : 7)">
            <SIPieChart :ref="(el) => refs['ca'] = el" title="今日抓拍" :date="false" @update:date-range="getCapture"
              legend />
          </div>
          <!-- 右侧圆环图 -->
          <div :class="'col-' + (showBar ? 4 : 5)">
            <SIPieChart :ref="(el) => refs['cb'] = el" title="累计抓拍" :date="false" @update:date-range="getCapture" />
          </div>
        </div>
        <template v-if="showBar">
          <!-- 中部柱状图 -->
          <div class="row items-center justify-between">
            <div class="col-12">
              <SIBarChart :ref="(el) => refs['cc'] = el" title="近一周抓拍统计（按日期）" is-range-str :date="false" :range="false"
                @update:date-range="getCapture" />
            </div>
          </div>
          <!-- 底部柱状图 -->
          <div class="row items-center justify-between">
            <div class="col-12 q-mt-sm">
              <SIBarChart :ref="(el) => refs['cd'] = el" title="近一周抓拍统计（按人员类型）" is-range-str :date="false"
                :range="false" @update:date-range="getCapture" />
            </div>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </div>
  <div v-if="!showBar" class="row q-mt-md">
    <div class="col-12">
      <p>抓拍统计</p>
      <q-card flat class="q-pa-md">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-4 flex flex-center si-chart">
              <SIPieChart :ref="(el) => refs['c1'] = el" :index="1" legend title="抓拍统计"
                @update:date-range="getCapture" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c2'] = el" :index="2" title="抓拍次数VS统计周期"
                @update:date-range="getCapture" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c3'] = el" :index="3" title="累计抓拍次数VS统计周期" @update:date-range="getCapture"
                sub-type="accrued" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat class="q-pa-md q-mt-lg">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c4'] = el" :index="4" title="按抓拍位置累计分布" device sub-type="accrued"
                :date="false" :range="false" @update:date-range="getCapture" />
            </div>
            <div class="col-4">
              <SIBarChart :ref="(el) => refs['c5'] = el" :index="5" title="抓拍次数VS抓拍位置" device sub-type="date"
                @update:date-range="getCapture" />
            </div>
            <div class="col-4">
              <SIParChart :ref="(el) => refs['c6'] = el" :index="6" title="抓拍位置VS统计周期" device two-model
                @update:date-range="getCapture" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat class="q-pa-md q-mt-lg">
        <q-card-section class="q-pa-xs">
          <div class="row items-center justify-between">
            <div class="col-6">
              <SILineChart :ref="(el) => refs['c7'] = el" :index="7" title="按抓拍时段累计分布" name="累计抓拍" />
            </div>
            <div class="col-6">
              <SIBarChart :ref="(el) => refs['c8'] = el" :index="8" title="抓拍次数VS抓拍时段" sub-type="hour"
                @update:date-range="getCapture" />
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

const getCapture = (val, index = 0) => {
  main.dataGet('aly/week/capture', val || {}).then(res => {
    console.log("今日抓拍：", res, val)
    const isZero = index === 0
    if (isZero) {
      charts.updatePieOption(refs.value['ca'], res.total_data['d1'])
      charts.updatePieOption(refs.value['cb'], res.total_data['all'])
      if (props.showBar) {
        charts.updateBarOption(refs.value['cc'], res.data['date'])
        charts.updateBarOption(refs.value['cd'], res.data['user'])
        return;
      }
    }
    if (isZero || index === 1) {
      charts.updatePieOption(refs.value['c1'], res.data['user'], false)
    }
    if (isZero || index === 2) {
      charts.updateBarOption(refs.value['c2'], res.data['date'])
    }
    if (isZero || index === 3) {
      charts.updateBarOption(refs.value['c3'], res.data['accrued'])
    }
    if (isZero || index === 7) {
      charts.updateBarOption(refs.value['c7'], res.total_data['accrued_hour'], false, true)
    }
    if (isZero || index === 8) {
      charts.updateBarOption(refs.value['c8'], res.data['hour'], false, true)
    }
    if (index === 4) {
      charts.updateBarOption(refs.value['c4'], res.data['accrued'], true)
    } else if (index === 5) {
      charts.updateBarOption(refs.value['c5'], res.data['date'], true)
    } else if (index === 6) {
      charts.updateParOption(refs.value['c6'], res.data['date'])
    }
  })
}
getCapture()
</script>
