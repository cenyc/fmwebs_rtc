<template>
  <q-page class="q-pa-md">
    <q-banner class="bg-amber-2 text-grey-9" dense>
      <template #avatar>
        <q-icon name="error" color="warning" />
      </template>
      API-KEY是您访问应用服务的密钥，请您务必妥善保管!不要以任何方式公开到外部渠道，避免因未经授权的使用造成安全风险或资金损失。
    </q-banner>
    <q-banner class="bg-primary-2 text-grey-9 q-mt-md q-mb-sm" dense>
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      应用服务通过API-KEY进行调用鉴权和计量计费。目前仅支持主账号进行API-KEY管理，每个主账号同时可拥有3个有效的API-KEY。
      <q-btn v-if="false" flat dense color="primary" label="查看详细释义">
        <q-popup-proxy>
          <q-banner>
            这里是详细释义的内容，您可以根据需要添加更多的信息。
          </q-banner>
        </q-popup-proxy>
      </q-btn>
    </q-banner>
    <SITable ref="table" dir="apikey" title="应用密钥" :param="{ login_name: userStore.name }" :show-btn="false"
      :searchable="false" :editable="false">
      <template #tool-btn>
        <q-btn label="创建新的API-KEY" rounded unelevated color="primary" style="height:30px;margin:10px 0" icon="add"
          @click="openFormDialog" />
      </template>
      <template #body-cell="props">
        <div v-if="props.col.name == 'key_name'"> {{ props.value || ' - ' }}
          <q-popup-edit v-model="props.value" auto-save v-slot="scope"
            @update:model-value="handleUpdateKeyName($event, props.row)">
            <q-input v-model="scope.value" dense autofocus counter maxlength="20" @keyup.enter="scope.set"
              @blur="scope.set" />
          </q-popup-edit>
        </div>
      </template>
    </SITable>
    <q-dialog v-model="medium" persistent>
      <q-card style="width: 800px; max-width: 80vw;">
        <q-card-section class="row items-center">
          <div class="text-h6">创建API-KEY</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-grey-9">请记录API-KEY并保存在安全的地方，如果API-KEY丢失，可以再生成一个新的API-KEY</div>
          <div class="text-red">出于安全考虑，关闭本弹窗后，您可以通过账号验证的方式再次查看API-KEY</div>
        </q-card-section>

        <q-card-section>
          <q-banner class="bg-grey-2 text-grey-9" rounded inline-actions>
            <span class="text-h6">API-KEY: </span>
            <span class="text-subtitle1">{{ apikey }}</span>
            <template #action>
              <q-btn color="primary" unelevated label="复制" @click="handleCopy" />
            </template>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-teal q-pr-md q-pb-md">
          <q-btn outline color="grey-7" label="我已保存，关闭" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import SITable from 'src/components/SITable.vue';
import api from 'src/api/data';
import { copy2Clipboard } from 'src/utils/tools';
import { useUserStore } from 'src/stores/user';
import { ref } from 'vue';
const userStore = useUserStore();
const medium = ref(false);
const apikey = ref('')
const table = ref(null)
const openFormDialog = () => {
  // medium.value = true;
  api.dataNew('apikey', {
    login_name: userStore.name,
    phonenum: userStore.phonenum,
    days: 7
  }).then(res => {
    apikey.value = res.data;
    medium.value = true;
    table.value.fetchData();
  })
};
const handleCopy = () => {
  copy2Clipboard(apikey.value);
}
const handleUpdateKeyName = (key_name, row) => {
  // console.log("修改key-name:", key_name, row);
  api.dataUpdate('apikey', {
    key_name,
    id: row.id
  }).then(() => {
    table.value.fetchData();
  })
}
</script>
