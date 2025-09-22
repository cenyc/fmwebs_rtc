<template>
  <q-layout view="hHh Lpr lFf">
    <q-header bordered class="bg-white text-black">
      <q-toolbar>
        <q-btn flat dense round icon="svguse:icons.svg#logo|0 0 45 20" aria-label="Menu" @click="toggleLeftDrawer"
          class="text-h6" />

        <q-toolbar-title class="q-pl-xs">
          SpaceInsight 酒店智能安防系统
        </q-toolbar-title>
        <div class="q-gutter-lg flex flex-center">
          <!-- <div><q-btn flat dense round icon="svguse:icons.svg#setting" aria-label="Setting" size="sm" /></div> -->
          <div><q-btn flat dense round icon="svguse:icons.svg#question" aria-label="Question" size="sm" /></div>
          <div><q-btn flat dense round icon="svguse:icons.svg#notice" aria-label="Notice" size="sm"
              :disable="wsStore.unread == 0" @click="wsStore.openAlert">
              <q-badge color="red" rounded floating v-if="wsStore.unread > 0">
                {{ wsStore.unread }}
              </q-badge>
            </q-btn></div>
          <q-avatar v-ripple class="cursor-pointer">
            <img :src="userStore.avatar">
            <SIProfile />
          </q-avatar>
        </div>
      </q-toolbar>
      <SIAlert v-model="showAlert" />
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="218" class="q-px-sm">
      <SIMenu />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUserStore } from 'src/stores/user'
import { useWebSocketStore } from 'src/stores/ws'
import SIMenu from 'src/components/SIMenu.vue'
import SIAlert from 'src/components/SIAlert.vue'
import SIProfile from 'src/components/SIProfile.vue'
const leftDrawerOpen = ref(false)
const userStore = useUserStore()
const wsStore = useWebSocketStore()
const showAlert = computed({
  get: () => wsStore.opened,
  set: () => wsStore.opened = false
})
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
onMounted(() => {
  userStore.startTokenRefresh()
  wsStore.connect()
})
onUnmounted(() => {
  userStore.stopTokenRefresh()
})
</script>
