// 导出本目录所有vue组件
// import SIAddrInput from "./SIAddrInput.vue";
// import SIBtnidInput from "./SIBtnidInput.vue";

// export default { SIAddrInput, SIBtnidInput };
// 改为异步组件加载方式
import { defineAsyncComponent } from 'vue';

const componentMap = {
  'addr_input': defineAsyncComponent(() => import('./SIAddrInput.vue')),
  'addr-id_input': defineAsyncComponent(() => import('./SIAddrIdInput.vue')),
  'btn-id_input': defineAsyncComponent(() => import('./SIBtnIdInput.vue')),
  'role_input': defineAsyncComponent(() => import('./SIRoleInput.vue')),
  'limit_input': defineAsyncComponent(() => import('./SILimitInput.vue')),
  'creator_input': defineAsyncComponent(() => import('./SICreatorInput.vue')),
  'create-time_input': defineAsyncComponent(() => import('./SICreateTimeInput.vue')),
  'is-manager_input': defineAsyncComponent(() => import('./SIIsManagerInput.vue')),
  'is-system_input': defineAsyncComponent(() => import('./SIIsSystemInput.vue')),
  'tenant-id_input': defineAsyncComponent(() => import('./SITenantIdInput.vue')),
  'dept_input': defineAsyncComponent(() => import('./SIDeptInput.vue')),
  'gender_input': defineAsyncComponent(() => import('./SIGenderInput.vue')),
  'type-id_input': defineAsyncComponent(() => import('./SIProfileIdInput.vue')),
  'profile-id_input': defineAsyncComponent(() => import('./SIProfileIdInput.vue')),
  'func-type_input': defineAsyncComponent(() => import('./SISelectInput.vue')),
  'status_input': defineAsyncComponent(() => import('./SISelectInput.vue')),
  'enabled_input': defineAsyncComponent(() => import('./SISelectInput.vue')),
  'leader-flag_input': defineAsyncComponent(() => import('../SIOption.vue')),
}

export default componentMap;
