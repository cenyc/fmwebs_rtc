<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="alerts/group" title="人员类型" :param="{ group_type: 2 }" :custom-form="true"
      :custom-fields="['profile_type_list', 'group_type']" dialog-width="800px">
      <template #custom-form="{ props }">
        <div class="text-subtitle1">人员类型组信息</div>
        <div class="si-input row">
          <div class="flex flex-center col-6">
            <label for="group_name" class="label">人员类型组名</label>
            <q-input for="group_name" dense borderless v-model="props['group_name']"
              :rules="[val => !!val || '分级组名不能为空']" label="请输入分级组名" />
          </div>
          <div class="flex flex-center col-6">
            <label class="label">所属酒店</label>
            <SITenantIdInput v-model="props['tenant-id_input']" :disable="!isAdd" @vue:mounted="initProps(props)" />
          </div>
          <div class="flex flex-center col-6">
            <label class="label">定制化</label>
            <s-i-select emit-value map-options v-model="props['customization']"
              :options="[{ label: '定制化', value: '定制化' }, { label: '标准', value: '标准' }]"
              :rules="[val => !!val || '定制化不能为空']" label="请选择定制化" />
          </div>
          <div class="flex flex-center col-6">
            <label class="label">描述</label>
            <q-input dense borderless v-model="props['description']" label="请输入描述" />
          </div>
        </div>
        <div class="text-subtitle1 row">
          <span>人员类型组设置</span>
        </div>
        <div class="row">
          <div v-for="(item, index) in typeForm" :key="index" class="col-4 flex si-input q-gutter-sm">
            <q-input label="类型名称" v-model="typeForm[index].type_name" :rules="[val => !!val || '类型名称不能为空']" dense
              borderless :disable="props['tenant-id_input'].tenant_id == ''" />
            <q-input label="有效期" borderless v-model.number="typeForm[index].face_validity_hours" type="number"
              :rules="[val => val !== '' || '有效期不能为空']" dense :disable="props['tenant-id_input'].tenant_id == ''" />
            <q-btn dense flat color="warning" icon="close" @click="deleteType(index)"
              :disable="props['tenant-id_input'].tenant_id == ''" />
          </div>
        </div>
        <div class="text-subtitle1 row" style="margin-top:20px">
          <span>新增类型</span>
          <q-space />
          <q-btn dense outline color="secondary" icon="refresh" @click="reset" class="q-mr-sm" />
          <q-btn dense color="primary" icon="add" @click="typeForm.push({ type_name: '', face_validity_hours: '' })" />
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import SISelect from 'src/components/SISelect.vue';
import SITenantIdInput from 'src/components/siinputs/SITenantIdInput.vue';
import { ref } from 'vue';
import { $dialog } from 'src/utils/notify';
import main from 'src/api/main';
const origForm = ref(null);
const typeForm = ref(null);

const isAdd = ref(false);
const getTypeList = (props) => {
  if (isAdd.value && origForm.value) return;
  console.log('getTypeList', isAdd.value)
  const original_id = '00000000-0000-0000-0000-000000000000'
  const tenant_id = props?.['tenant-id_input']?.tenant_id || original_id;
  main.dataList('fs/profiles/type', {
    tenant_id,
    page: 1,
    page_size: 20,
    enabled: (isAdd.value && origForm.value === null) ? 1 : undefined,
    type_group_id: props.id || undefined
  }).then((res) => {
    if (res.data.length > 0) {
      origForm.value = res.data.map(item => ({ type_name: item.type_name, face_validity_hours: item.face_validity_hours, id: isAdd.value ? undefined : item.id }));
      typeForm.value = [...origForm.value];
    } else {
      origForm.value = [];
      typeForm.value = [];
    }
    props && (props.profile_type_list = typeForm.value)
    console.log('typeForm', typeForm.value);
  });
}
const initProps = (props) => {
  origForm.value = null;
  props.group_type = 2;
  const tenant_id = props?.['tenant-id_input']?.tenant_id
  isAdd.value = tenant_id ? false : true;
  getTypeList(props);
}

const deleteType = (index) => {
  console.log('deleteType', typeForm.value, index);
  if (typeForm.value[index].id > 0) {
    // 本该禁用的数据，申请后端删除
    $dialog('提示', `确定要删除“${typeForm.value[index].type_name}”吗？`, () => {
      main.dataDelete('fs/profiles/type', typeForm.value[index].id).then(() => {
        typeForm.value.splice(index, 1)
        // getTypeList();
      });
    });
  } else {
    // 直接删除
    typeForm.value.splice(index, 1);
  }
};
const reset = () => {
  typeForm.value = [...origForm.value];
};
</script>
<style lang="scss" scoped>
:deep(.si-input) {
  line-height: 50px;
  border: none;


  &.flex {
    margin-top: 20px;

    // .q-field--borderless {
    //   min-width: 90px !important;
    //   max-width: 90px !important;
    // }

    .q-field__control {
      min-width: 100px;
      max-width: 100px;
    }

    .col-4 {
      min-width: 250px;
    }
  }
}


.flex.col-6 {
  justify-content: left;
}

// :deep(.q-field--borderless .q-field__control) {
//   background: none !important;
// }

.text-subtitle1:first-of-type {
  margin-top: 0;
}

.text-subtitle1 {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed var(--q-border-bottom-color)
}
</style>
