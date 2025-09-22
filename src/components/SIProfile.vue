<template>
  <q-menu class="bg-white si-menu">
    <div class="row no-wrap q-pa-md">
      <div class="column">
        <div class="text-h6 q-mb-md">Settings</div>
        <q-toggle v-model="mobileData" label="大号字体" />
        <q-toggle v-model="darkMode" label="暗黑主题" @update:model-value="toggleTheme" />
      </div>

      <q-separator vertical inset class="q-mx-lg" />

      <div class="column items-center">
        <q-avatar size="72px">
          <img :src="userStore.avatar">
        </q-avatar>

        <div class="text-subtitle1 q-mt-md q-mb-xs">{{ userStore.name }}</div>

        <q-btn color="primary" label="Logout" push size="sm" @click="handleLogout" v-close-popup />
      </div>
    </div>
  </q-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from 'stores/user'
import { useConfigStore } from 'src/stores/config';
import { useQuasar } from 'quasar'
const userStore = useUserStore();
const configStore = useConfigStore();
const $q = useQuasar();
const mobileData = ref(true)
const darkMode = computed({
  get: () => configStore.theme === 'dark',
  set: (val) => { return val }
})
const toggleTheme = (val) => {
  console.log('toggleTheme', val)
  configStore.setTheme(val ? 'dark' : 'light')
  $q.dark.set(val)
}
const handleLogout = () => {
  userStore.logout()
}
// 加载主题设置
$q.dark.set(darkMode.value)
</script>
