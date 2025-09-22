<template>
  <v-chart :style="`width:100%;height:${height}px`" :option="option" :autoresize="true" :theme="initTheme()"
    :init-options="initOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from 'src/stores/config'
import VChart from 'vue-echarts'
const configStore = useConfigStore()

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  initOptions: {
    type: Object,
    default: () => ({ renderer: 'canvas' })
  },
  height: {
    type: [Number, String],
    default: 200
  }
})

const emit = defineEmits(['update:option', 'submit'])
const option = computed({
  get() { return props.option },
  set(value) { emit('update:option', value) }
})
const initTheme = () => {
  const theme = configStore.theme;
  option.value.backgroundColor = 'transparent'; //theme === 'dark' ? '#121212' : '#fff';
  return theme;
}
</script>
