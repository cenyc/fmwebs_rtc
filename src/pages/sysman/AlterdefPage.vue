<template>
  <q-page class="q-pa-md">
    <SITable svr="main" dir="alerts/group" title="预警分级" :param="{ group_type: 1 }" :custom-form="true"
      :custom-fields="['level_list', 'group_type']" dialog-width="800px">
      <template #custom-form="{ props }">
        <div class="text-subtitle1">预警分级组信息</div>
        <div class="si-input row">
          <div class="flex flex-center col-6">
            <label for="group_name" class="label">预警分级组名</label>
            <q-input for="group_name" dense borderless v-model="props['group_name']"
              :rules="[val => !!val || '分级组名不能为空']" @vue:before-mount="getLevelList(props)" @vue:unmounted="clearForm"
              label="请输入分级组名" />
          </div>
          <div class="flex flex-center col-6">
            <label for="tenant-id_input" class="label">所属酒店</label>
            <SITenantIdInput v-model="props['tenant-id_input']" :disable="props.id ? true : false"
              @popup-hide="initProps(props)" />
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
        <div class="text-subtitle1" v-if="levelLength > 0">预警分级组设置</div>
        <div class="row">
          <div v-for="(item, index) in levelForm" :key="index" :class="`col-6 row si-input square square-${index % 2}`">
            <div class="col-12 flex">
              <!-- <q-input v-model.number="levelForm[index].level" style="display: none;"
                :rules="[val => !!val || '分级名称不能为空']" dense borderless /> -->
              <!-- <div>{{ levelForm[index].level }}级人员预警</div> -->
              <label class="label">预警级别</label>
              <!-- <q-rating v-model="levelForm[index].level" size="2em" color="warning" /> -->
              <q-option-group v-model="levelForm[index].level" :options="levelOptions" color="primary" inline dense />
              <q-space />
              <q-btn dense flat color="warning" icon="close" @click="deleteLevel(index, props.id)" />
            </div>
            <div class="col-12 flex">
              <label class="label">人员类型</label>
              <s-i-select v-model="levelForm[index].profile_type_id" :options="typeListOptions" emit-value map-options
                :rules="[val => !!val || '类型名称不能为空']" />
            </div>
            <div class="col-12 row">
              <div class="col-12 flex">
                <label class="label">处置操作</label>
                <s-i-select v-model.number="levelForm[index].action" :options="actionOptions" emit-value map-options />
              </div>
              <div class="col-12 flex">
                <label class="label"></label>
                <s-i-select v-model.number="levelForm[index].alarm_sound" :options="alarmOptions" emit-value
                  map-options />
              </div>
            </div>
          </div>
        </div>
        <div class="text-subtitle1 row" style="margin-top:20px">
          <span>新增级别</span>
          <q-space />
          <q-btn dense outline color="info" icon="volume_up" @click="ws.playSound(true)" class="q-mr-sm">
            <q-tooltip>声音测试</q-tooltip>
          </q-btn>
          <q-btn dense outline color="secondary" icon="refresh" @click="reset(props)" class="q-mr-sm">
            <q-tooltip>重置表单</q-tooltip>
          </q-btn>
          <q-btn dense color="primary" icon="add" @click="addNewLevel" v-if="levelLength < 4">
            <q-tooltip>新增级别</q-tooltip>
          </q-btn>
        </div>
      </template>
    </SITable>
  </q-page>
</template>
<script setup>
import { computed, ref } from 'vue';
import { $dialog } from 'src/utils/notify';
import { useWebSocketStore } from 'src/stores/ws';
import SITable from 'src/components/SITable.vue';
import SISelect from 'src/components/SISelect.vue';
import SITenantIdInput from 'src/components/siinputs/SITenantIdInput.vue';
import main from 'src/api/main';
const ws = useWebSocketStore();
const typeListOptions = ref([{ label: '请选择人员类型', value: 0 }]);
const actionOptions = ref([
  { label: '弹窗', value: "弹窗" },
  { label: '无动作', value: "无" },
]);
const alarmOptions = ref([
  { label: '系统提示音', value: "系统提示音" },
  { label: '无提示', value: "无" },
]);
const levelOptions = ref([
  { label: '一级', value: 1 },
  { label: '二级', value: 2 },
  { label: '三级', value: 3 },
  { label: '四级', value: 4 }
]);
const genLevelList = () => {
  const levelList = [];
  for (let i = 0; i < 4; i++) {
    levelList.push({
      level: i + 1,
      profile_type_id: 0,
      action: "弹窗",
      alarm_sound: "系统提示音"
    });
  }
  return levelList;
}
const levelForm = ref(null);
const levelLength = computed(() => levelForm.value?.length || 0);
const initProps = (props) => {
  const tenant_id = props['tenant-id_input'].tenant_id
  if (props.level_list.length === 0) {
    props.level_list = levelForm.value;
    console.log('level_list', props.level_list);
  }
  if (tenant_id) {
    // 清空已经选择的类型
    levelForm.value.forEach(item => {
      item.profile_type_id = 0;
    });
    getTypeList(tenant_id);
    console.log('props=', tenant_id)
  }
}
const getTypeList = (tenant_id) => {
  main.dataList('fs/profiles/type', {
    tenant_id,
    enabled: 1,
    page: 1,
    page_size: 20,
  }).then((res) => {
    if (res.data.length > 0) {
      typeListOptions.value = res.data.map(item => ({ label: item.type_name, value: item.id }));
      console.log('level_list', typeListOptions.value);
    } else {
      typeListOptions.value = [{ label: '请选择人员类型', value: 0 }];

    }
  });
}

const getLevelList = (props) => {
  props.group_type = 1;
  if (!props.id) {
    levelForm.value = genLevelList();
    return
  }
  main.dataList('alerts/level', {
    alert_group_id: props.id,
    page: 1,
    page_size: 20,
  }).then((res) => {
    if (res.data.length > 0 && levelForm.value === null) {
      console.log('level_list', res.data);
      // res.data 按数组内的level 进行排序
      levelForm.value = res.data.sort((a, b) => a.level - b.level);
      props.level_list = levelForm.value
      // 获取类型列表
      getTypeList(props['tenant-id_input'].tenant_id);
      // typeListOptions.value = res.data.map(item => ({ label: item.type_name, value: item.id }));
      // console.log('level_list', typeListOptions.value);
    } else {
      // typeListOptions.value = [{ label: '请选择人员类型', value: 0 }];
    }
  });
}
const addNewLevel = () => {
  levelForm.value.push({
    level: levelForm.value.length + 1,
    profile_type_id: 0,
    action: "弹窗",
    alarm_sound: "系统提示音"
  });
}
const handleDelete = (index) => {
  levelForm.value.splice(index, 1);
  // 更新 level 值
  levelForm.value.forEach((item, index) => {
    item.level = index + 1;
  });
}
const deleteLevel = (index, id) => {
  if (levelForm.value[index].id > 0) {
    // 本该禁用的数据，申请后端删除
    $dialog('提示', `确定要删除“${index + 1}级人员预警”吗？`, () => {
      levelForm.value[index].delete_flag = '1';
      main.dataUpdate('alerts/level', { id, level_list: [levelForm.value[index]] }).then(() => {
        handleDelete(index);
      });
    });
  } else {
    // 直接删除
    handleDelete(index);
  }
}
const reset = (props) => {
  console.log('reset', levelForm.value)
  levelForm.value = genLevelList();
  props.level_list = levelForm.value;
  console.log('reset', levelForm.value)
}
const clearForm = () => {
  if (levelForm.value) {
    levelForm.value = null;
    typeListOptions.value = [{ label: '请选择人员类型', value: 0 }];
    console.log('clearForm')
  }
}
</script>
<style lang="scss" scoped>
.si-input {
  line-height: 50px;
  border: none;
}

// .label,
// .si-input.flex .q-field--borderless {
//   min-width: 90px !important;
//   max-width: 90px !important;
// }
.col-12.flex {
  label.q-field {
    margin-top: 10px;
  }
}

.flex.col-6 {
  justify-content: left;
}

.row {
  .square {
    border-top: 1px solid var(--q-border-bottom-color);
    padding-bottom: 20px;

    .q-field {
      max-width: 270px;
      max-height: 35px !important;
    }
  }

  .square-0 {
    padding-right: 30px;
    border-right: 1px solid var(--q-border-bottom-color);
  }

  .square-1 {
    padding-left: 30px;
  }

  .square-0:first-child,
  >.square-1:nth-child(2) {
    border-top: none;
  }
}

.text-subtitle1 {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed var(--q-border-bottom-color)
}

.text-subtitle1:first-of-type {
  margin-top: 0;
}

// :deep(.q-field--borderless .q-field__control) {
//   background: none !important;
// }</style>
