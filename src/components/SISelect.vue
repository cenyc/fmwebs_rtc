<template>
  <q-select :class="{ showed }" dense rounded borderless :clearable="useInput" clear-icon="clear"
    popup-content-class="br10" :use-input="useInput" :hide-selected="useInput" fill-input transition-hide lazy-rules
    @popup-show="showed = true" @popup-hide="showed = false">
    <template v-for="(_, name) in $slots" #[name]="props">
      <slot :name="name" v-bind="props || {}" />
    </template>
  </q-select>
</template>
<script setup>
import { ref } from "vue";
defineProps({
  useInput: {
    type: Boolean,
    default: true,
  },
})
const showed = ref(false)
</script>
