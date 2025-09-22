<template>
  <q-page class="q-pa-md">
    <!-- <img alt="Quasar logo" src="~assets/quasar-logo-vertical.svg" style="width: 200px; height: 200px"> -->
    <div class="row">
      <div class="col-12">
        <p>最近预警</p>
        <div class="row q-gutter-lg">
          <q-card v-for="item, key in position" :key="key" class="col" flat bordered>
            <q-img :src="item.url || 'src/assets/avatar.png'">
              <div class="absolute-top-left" style="background:#4876FF; opacity: .7; border-radius:10px 0 10px">
                {{ item.user_category }}
              </div>
            </q-img>
            <q-card-section class="q-px-sm q-py-none pos-section">
              <div class="text-subtitle1">{{ item.position }}</div>
              <div class="text-subtitle2">{{ item.stats }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
    <div class="row q-mt-xs q-col-gutter-md">
      <SICaptureChart />
      <div class="col-8">
        <SIWarningChart />
        <p class="q-pt-md">信息采集</p>
        <q-card flat>
          <q-card-section class="q-pa-xs">
            <SIGatherChart />
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import SICaptureChart from 'src/components/sicharts/SICaptureChart.vue';
import SIWarningChart from 'src/components/sicharts/SIWarningChart.vue';
import SIGatherChart from 'src/components/sicharts/SIGatherChart.vue';
import { ref } from 'vue'
import api from 'src/api/main'
// 最近预警
const position = ref([])
api.dataGet('aly/warning').then(res => {
  console.log('warnings:', res)
  position.value = res.data.position
})

</script>
<style lang="scss" scoped>
.q-img {
  max-height: 200px
}

.q-img__content>div {
  padding: 2px 20px 2px 10px !important
}

body.body--light .pos-section {
  background: $hover-bg-color !important;
}

.q-card--bordered {
  border-color: #EDECEC
}
</style>
