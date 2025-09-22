<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="fs/temporaryfaces" title="面部临时库" label-width="230px" dialog-width="1000px"
      :show-btn="false" />
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
</script>
