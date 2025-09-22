<!-- 角色选择器 -->
<template>
  <s-i-select :model-value="modelValue?.role_name" :options="rolesOptions"
    :for="(isSearchMode ? 'search_' : '') + 'role_input'" :rules="getRules()" @update:model-value="updateModelValue"
    @filter="handleRolesFilter" label="角色名称">
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.value }}: {{ scope.opt.label }} <q-icon
              :name="scope.opt.enabled ? 'check' : 'clear'" size="xs" /></q-item-label>
          <q-item-label caption>{{ scope.opt.name }}</q-item-label>
          <q-item-label caption>{{ scope.opt.addr }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </s-i-select>
</template>
<script setup>
import { onUnmounted, ref } from 'vue';
import { useEventBus } from 'src/utils/event';
import SISelect from 'src/components/SISelect.vue';
import api from 'src/api/data';
const { send } = useEventBus();
const selectedBtnId = ref([])
const selectedTenantId = ref('')
const emit = defineEmits(['update:modelValue', 'fillFields']);
const props = defineProps({
  modelValue: Object,
  mode: String
});
const isSearchMode = props.mode === 'search';
const rolesOptions = ref([]);
console.log('SIRoleInput======', props.modelValue, emit);
const getRules = () => {
  if (isSearchMode) return []
  return [val => !!val || '角色不能为空']
}
// 自动匹配功能号
const matchBtnId = (role_name) => {
  if (role_name) {
    api.dataGet('resource/link/role/history', { page: 1, page_size: 50, role_name }).then(res => {
      // 取出res.data.map(item => item.id)
      // emit('fillFields', { btn_id: { btn_id_list: res.data.map(item => item.id) } });
      selectedBtnId.value = res.data.map(item => item.id);
      console.log('matchBtnId res:', res.data.map(item => item.id))
      send('role->btnid', selectedBtnId.value);
    });
  } else {
    selectedBtnId.value = [];
    console.log('matchBtnId empty')
    send('role->btnid', []);
  }
}
const updateModelValue = (value) => {
  if (!value) value = { value: '', tenant_id: '' };
  console.log('updateModelValue', value)
  const newValue = { role_name: value.value }
  emit('update:modelValue', newValue);
  // emit('fillFields', { tenant_id: value.tenant_id });
  selectedTenantId.value = value.tenant_id;
  console.log(props.mode + '-role->limit', selectedTenantId.value)
  send(props.mode + '-role->limit', selectedTenantId.value);
  if (isSearchMode) {
    emit('fillFields', newValue);
  } else {
    matchBtnId(value.value);
  }
};

function handleRolesFilter(val, update) {
  console.log('handleRolesFilter', val);
  // if (val.length < 1 && rolesOptions.value.length) {
  //   update(() => { })
  //   return;
  // };

  rolesOptions.value = [];
  // rolesOptions.value = res.data.map((item) => ({ label: item.description, value: item.role_name, id: `租户：${item.tenant_id}` }));
  update(() => {
    const condition = val ? { role_name: val } : {};
    const tenant_id = selectedTenantId.value;
    if (tenant_id) condition.tenant_id = tenant_id;
    api.dataList('role', { page: 1, page_size: 50, ...condition }).then(res => {
      // 取出没有重复的tenant_id
      const tenants = {};
      res.data.forEach(item => {
        tenants[item.tenant_id] = null;
      });
      // 根据tenant_id查询租户信息
      let keys = Object.keys(tenants), i = 0;
      for (let tenant_id of keys) {
        api.dataList('customer', { tenant_id }).then(r => {
          i++;
          tenants[tenant_id] = r.data;
          if (i === keys.length) {
            console.log('取完成了', tenants)
            // 遍历角色列表，显示租房详细信息
            res.data.forEach(item => {
              // 直接添加到列表中
              const tenant = tenants[item.tenant_id][0];
              console.log('租户信息', tenant)
              if (!tenant) return;
              rolesOptions.value.push({ label: item.description, value: item.role_name, tenant_id: tenant.tenant_id, name: `${tenant.supplier}`, addr: tenant.full_address, enabled: tenant.enabled });
            });
          }
        });
      }
    });
  });
}
onUnmounted(() => {
  rolesOptions.value = [];
  selectedBtnId.value = [];
  selectedTenantId.value = '';
});
</script>
