<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-3">
        <p class="text-subtitle1">接入设备统计</p>
        <q-markup-table flat class="q-pt-md q-pb-lg">
          <thead>
            <tr>
              <th class="text-center">设备类型</th>
              <th class="text-center">设备数量(台)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">Frozen Yogurt</td>
              <td class="text-center">159</td>
            </tr>
            <tr>
              <td class="text-center">Ice cream sandwich</td>
              <td class="text-center">237</td>
            </tr>
            <tr>
              <td class="text-center">Eclair</td>
              <td class="text-center">262</td>
            </tr>
            <tr>
              <td class="text-center">Cupcake</td>
              <td class="text-center">305</td>
            </tr>
            <tr>
              <td class="text-center">Gingerbread</td>
              <td class="text-center">356</td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
      <div class="col-9 q-pl-lg">
        <p class="text-subtitle1">设备状态统计</p>
        <div class="row bg-white border-radius q-py-lg">
          <div class="col-3">
            <p class="text-subtitle1 text-center">设备在线率</p>
            <SIOnlineChart />
          </div>
          <div class="col-9">
            <p class="text-subtitle1 text-center">设备故障列表</p>
            <q-markup-table flat>
              <thead>
                <tr>
                  <th class="text-center">设备名称</th>
                  <th class="text-center">设备位置</th>
                  <th class="text-center">故障类型</th>
                  <th class="text-center">处理结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in 4" :key="item">
                  <td>设备{{ item }}</td>
                  <td>四季酒店前台</td>
                  <td>离线</td>
                  <td>未处理好</td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import SIOnlineChart from 'src/components/sicharts/SIOnlineChart.vue';
</script>
<style scoped></style>
