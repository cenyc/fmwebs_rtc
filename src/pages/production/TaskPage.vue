<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="flex">
          <p>面部数据</p>
          <q-space />
          <q-btn dense rounded unelevated icon="upload" size="md" label="导出图表" class="export-btn q-mb-sm"
            @click="charts.exportChartsToPDF('信息采集统计')" />
        </div>
        <q-card flat>
          <q-card-section class="flex si-chart">
            <SIPieChart :ref="(el) => refs['ca'] = el" :index="0" title="累计采集面部数据" :date="false"
              @update:date-range="getGather" legend />
            <SIPieChart :ref="(el) => refs['cb'] = el" :index="0" title="今日采集面部数据" :date="false"
              @update:date-range="getGather" />
            <SIPieChart :ref="(el) => refs['cc'] = el" :index="0" title="当前生效面部数据" :date="false"
              @update:date-range="getGather" />
            <SIPieChart :ref="(el) => refs['cd'] = el" :index="0" title="当前临时面部数据" :date="false"
              @update:date-range="getGather" />
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div class="row q-mt-md">
      <div class="col-12">
        <p>采集统计</p>
        <q-card flat class="q-pa-md">
          <q-card-section class="q-pa-xs">
            <div class="row items-center justify-between">
              <div class="col-4 flex flex-center si-chart">
                <SIPieChart :ref="(el) => refs['c1'] = el" legend :index="0" title="累计采集分布"
                  @update:date-range="getGather" />
              </div>
              <div class="col-4">
                <SIParChart :ref="(el) => refs['c2'] = el" :index="2" title="采集数量VS统计周期"
                  @update:date-range="getGather" />
              </div>
              <div class="col-4">
                <SIParChart :ref="(el) => refs['c3'] = el" :index="3" title="累计采集数量VS统计周期"
                  @update:date-range="getGather" :device="false" sub-type="accrued" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import SIPieChart from 'src/components/sicharts/SIPieChart.vue';
import SIParChart from 'src/components/sicharts/SIParChart.vue';
import { ref } from 'vue'
import charts from 'src/utils/charts'
import main from 'src/api/main';
const refs = ref({})

const getGather = (val, index = 0) => {
  console.log('val-index', index)

  main.dataGet('aly/accrued/gather', val).then(res => {
    console.log('gather res', res)
    const isZero = index === 0
    if (isZero) {
      charts.updatePieOption(refs.value['ca'], res.total_data['all'])
      charts.updatePieOption(refs.value['cb'], res.total_data['d1'])
      charts.updatePieOption(refs.value['cc'], res.total_data['face'])
      charts.updatePieOption(refs.value['cd'], res.total_data['tmp_face'])
    }
    if (isZero || index === 1) {
      charts.updatePieOption(refs.value['c1'], res.data['user'], false)
    }
    if (isZero || index === 2) {
      // console.log('res.data===2:', res.data)
      charts.updateParOption(refs.value['c2'], res.data['date'], res.columns)
    }
    if (isZero || index === 3) {
      charts.updateParOption(refs.value['c3'], res.data['accrued'], res.columns)
    }
  })
}
getGather()
</script>
