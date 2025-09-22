<template>
  <q-list>
    <q-item-label header>导航菜单</q-item-label>
    <q-expansion-item group="si-menu" v-for="(m, index) in menu" :key="index" :icon="getIcon(m.main.menu_name)"
      :label="m.main.description" :model-value="isExtended(m.main.menu_name)" expand-icon="keyboard_arrow_right"
      :expanded-icon="m.sub ? 'keyboard_arrow_down' : ''" class="si-expansion" :to="m.sub ? '' : m.main.menu_name">
      <q-item v-for="(item, itemIndex) in m.sub" :key="itemIndex" clickable
        :to="item.menu_name == home ? '/' : item.menu_name" :active="isHome(item.menu_name)" exact>
        <q-item-section class="q-pl-lg q-ml-md">{{ item.description }}</q-item-section>
      </q-item>
    </q-expansion-item>
  </q-list>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useUserStore } from 'stores/user';
import { useConfigStore } from 'src/stores/config';
const route = useRoute();
const userStore = useUserStore();
const configStore = useConfigStore();
const menu = userStore.menu;
const home = userStore.home;
// console.log('home = ', home);

const isHome = (name) => { route.path == '/' + name || route.path === '/' && home.indexOf(name) !== -1 };
const isExtended = (name) => { return route.path.indexOf(name) === 1 || route.path === '/' && home.indexOf(name) !== -1 };
const getIcon = (name) => 'svguse:icons.svg#' + (configStore.icons.find(icon => icon === name) ? name : 'question');
</script>
<style lang="scss">
.q-header.bg-white {
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  background-color: var(--q-header-bg-color) !important;
}

.bg-white {
  color: var(--q-white-color) !important;
  background-color: var(--q-white-bg-color) !important;
}

main {
  background-color: var(--q-main-bg-color) !important;
  transition: all 0.3s ease;
}

.si-expansion .q-item__section--avatar {
  min-width: auto !important;
  padding-right: 12px !important;
  margin-left: 12px !important;
  font-size: 14px !important;
}

.si-expansion.q-expansion-item--expanded .q-expansion-item__container>.q-item {
  background-color: var(--q-hover-bg-color) !important;
  color: var(--q-hover-color) !important;
  transition: all 0.3s ease;
  border-radius: 10px !important;
}

.si-expansion.q-expansion-item .q-expansion-item__container>.q-item:hover {
  background-color: var(--q-hover-bg-color) !important;
  transform: translateX(2px);
  border-radius: 10px !important;
}

.si-expansion .q-item__section--side>.q-icon {
  font-size: 18px !important;
}

.si-expansion.q-expansion-item--expanded .q-expansion-item__content>.q-item {
  border-radius: 10px !important;
}

.si-expansion.q-expansion-item--expanded .q-expansion-item__content>.q-item:hover {
  color: var(--q-active-color) !important;
}

.si-expansion .q-hoverable:hover>.q-focus-helper {
  background: none !important;
  opacity: 0 !important;
}

.si-expansion .q-item {
  border-radius: 8px !important;
  /* 解决重绘闪烁问题 */
  overflow: hidden !important;
  /* 确保子元素不溢出 */
}

.si-expansion .q-item.q-router-link--active {
  color: $active-color !important;
  font-weight: bold !important;
}

// 覆盖所有可点击组件的 hover 效果
// .q-hoverable:hover>.q-focus-helper,
// .q-item--clickable:hover,
// .q-btn:hover {
//   background: none !important;
//   color: var(--q-primary) !important;
// }</style>
