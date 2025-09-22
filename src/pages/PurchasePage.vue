<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-8">
        <p>面部信息导入</p>
        <q-card flat class="q-px-lg">
          <q-card-section>
            <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
              <div class="si-input border">
                <label for="name">人员姓名</label>
                <q-input dense borderless for="name" v-model="formData.name" :rules="[val => !!val || '姓名不能为空']"
                  lazy-rules label="请输入姓名" />
              </div>
              <div class="si-input border q-pb-sm">
                <label for="image">人员图片</label>
                <q-avatar rounded size="100px">
                  <q-btn outline stack color="primary" class="full-width full-height" @click="fileInput.pickFiles()">
                    <template v-if="base64Image">
                      <img :src="base64Image" style="width: 100%; height: 100%; object-fit: cover" alt="预览图片">
                    </template>
                    <template v-else>
                      <q-icon name="photo_camera" size="24px" />
                      <div class="q-mt-sm">选择图片</div>
                    </template>
                  </q-btn>
                </q-avatar>
                <div class="hint q-ml-lg">
                  建议上传比例1:1，png、jpeg、jpg格式,1M以内的图片
                </div>
                <q-file ref="fileInput" accept=".jpg, .jpeg, .png" class="hidden"
                  @update:model-value="handleFileSelect" />
              </div>
              <div class="si-input border">
                <label for="type_id">面部属性</label>
                <SIProfileIdInput v-model="typeId" label="请选择人员类型" field-name="type_id"
                  :extra="{ label: 'type_name', value: 'type_id', dir: '/type' }" />
              </div>
              <div class="si-input border">
                <label for="room_id">关联房间</label>
                <q-input dense borderless for="room_id" v-model="formData.room_id" :rules="[val => !!val || '房间号不能为空']"
                  lazy-rules label="请输入房间号" />
              </div>
              <div class="si-input q-my-lg">
                <q-btn unelevated rounded type="submit" :loading="loading" color="primary"
                  class="q-ml-xl q-px-lg">导入</q-btn>
                <q-btn unelevated rounded type="reset" color="secondary" :disable="loading"
                  class="q-ml-md q-px-lg">重置</q-btn>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-4">
        <p class="q-ml-md">最新导入</p>
        <q-card flat class="q-pa-md q-ml-md row">
          <q-list v-for="item, key in latestImportData" :key="key" class="col-4">
            <q-item>
              <q-item-section>
                <q-img :src="item.tmp_url || 'src/assets/avatar.png'">
                  <div class="absolute-top-left" style="background:#4876FF; opacity: .7; border-radius:10px 0 10px">
                    {{ item.name }}
                  </div>
                </q-img>
                <q-item-label class="q-py-sm">{{ formatDate(item.created_time, 'HH:mm:ss') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import SIProfileIdInput from 'src/components/siinputs/SIProfileIdInput.vue';
import main from 'src/api/main';
import faces from 'src/utils/faces';
import { useUserStore } from 'src/stores/user';
import { ref } from 'vue';
import { formatDate } from 'src/utils/tools'
import { $success } from 'src/utils/notify';
const userStore = useUserStore();
const fileInput = ref(null);
const base64Image = ref(null);
const typeId = ref(null);
const loading = ref(false);
faces.connect();
// 最新导入数据
const latestImportData = ref([]);
const formData = ref({})
main.dataList('fs/profiles', { page: 1, page_size: 9, tenant_id: userStore.tenant_id }).then((res) => {
  console.log('最新导入：', res.data);
  latestImportData.value = res.data;
});
const handleFileSelect = (file) => {
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    base64Image.value = reader.result //e.target.result
  }
  reader.readAsDataURL(file)
}
const onSubmit = () => {
  loading.value = true;
  // 先上传图片
  main.dataPost('header/face/img', {
    img_parent: formData.value.name,
    image_base64: base64Image.value
  }).then(res => {
    console.log('上传结果', res)
    // 新增人员信息
    main.dataNew('fs/profiles', {
      ...formData.value,
      type_id: typeId.value?.type_id,
      tenant_id: userStore.tenant_id,
      tmp_url: res.data.url
    }).then((r) => {
      latestImportData.value.unshift({
        id: r.data.id,
        name: formData.value.name,
        tmp_url: res.data.url,
        created_time: new Date().toISOString()
      });
      if (latestImportData.value.length > 9) latestImportData.value.pop();
      $success('导入成功');
      formData.value = {};
      base64Image.value = null;
      typeId.value = null;
    });
  }).finally(() => {
    loading.value = false;
  })
}
const onReset = () => {
  formData.value = {};
}
</script>
<style lang="scss" scoped>
.q-img__content>div {
  padding: 2px 20px 2px 10px !important
}

.q-item {
  text-align: center;
}

.q-item__section {
  border-radius: 10px;
  overflow: hidden;
  background-color: #EAEFFF;
  border: 1px solid #EDECEC;
}

:deep(.si-input) {
  .q-field__control {
    min-width: 186px;
  }

  .q-select .q-field__input {
    max-width: 114px;
  }
}
</style>
