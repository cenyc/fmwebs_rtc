<template>
  <s-i-select :class="{ showed }" multiple :use-input="false" :options="deviceOptions" v-model="cams" :loading="loading"
    @virtual-scroll="onScroll" @popup-show="getDevice(true)" label="设备" @popup-hide="updateModelValue">
    <template #option="{ itemProps, opt, selected }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon v-if="selected" name="check" color="white" />
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          没有可用设备
        </q-item-section>
      </q-item>
    </template>
  </s-i-select>
</template>
<script setup>
import { ref } from 'vue'
import { useUserStore } from 'src/stores/user';
import SISelect from '../SISelect.vue';
import main from 'src/api/main';
const page = ref(1)
const stop = ref(false)
const cams = ref([])
const showed = ref(false)
const deviceOptions = ref([])
const loading = ref(false)
const userStore = useUserStore()
const emit = defineEmits(['fillFields'])
const updateModelValue = () => {
  if (cams.value.length > 0) {
    emit('fillFields', { device: cams.value })
  }
  showed.value = false;
}
const onScroll = () => {
  if (stop.value) return;
  console.log('onScroll')
  page.value++
  getDevice()
}
const getDevice = (e) => {
  e && (showed.value = true);
  const inited = e && deviceOptions.value.length > 0
  // console.log('getDevice', inited)
  if (inited || stop.value) return;
  main.dataList('fs/devices', {
    page: page.value,
    page_size: 7,
    tenant_id: userStore.tenant_id,
  }).then((res) => {
    const lastPage = Math.ceil(res.total / 7)
    if (page.value >= lastPage) {
      stop.value = true;
    }
    const option = res.data.map((item) => ({ label: item.name, value: item.id }));
    deviceOptions.value = [...deviceOptions.value, ...option];
  });
}
</script>
