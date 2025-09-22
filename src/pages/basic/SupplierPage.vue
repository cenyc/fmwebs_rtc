<template>
  <q-page class="q-pa-md">
    <SITable dir="user" title="用户" label-width="80px" :param="{ tenant_id: userStore.tenant_id }"
      :exclude-inputs="['tenant-id_input']" :searchable="false"
      :form-fields="['username', 'phonenum', 'password', 'leader-flag_input']" :default-span="12" edit-btn-label="设置">
      <template #body-cell="props">
        <div v-if="props.col.name == 'ismanager'"> {{ managers[props.value] }}</div>
        <div v-else-if="props.col.name == 'isystem'"> {{ systems[props.value] }}</div>
        <div v-else>{{ props.value }}</div>
      </template>
      <template #actions="{ props }">
        <q-btn color="primary" dense flat label="重置密码" @click="handleRestorePwd(props.row)"></q-btn>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import { $dialog, $success } from 'src/utils/notify';
import api from 'src/api/data';
import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();
const managers = { '1': '管理员', '2': '一般员工', '3': '内置管理员' }
const systems = { '1': '否', '2': '是', '0': '未知' }
const handleRestorePwd = (row) => {
  console.log('重置密码', row);
  $dialog('重置密码', `你确定要重置用户<b> ${row.login_name} </b>的密码吗？`, () => {
    api.dataPost('user/passswd/restore', { id: row.id, tenant_id: row.tenant_id, password: '123123' }).then(() => {
      $success('重置密码成功');
    })
  });
};
</script>
