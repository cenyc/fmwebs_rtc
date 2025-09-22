<template>
  <q-page class="q-pa-md">
    <div class="q-ma-xs">
      <div class="flex">
        <div class="text-subtitle1">监管部门通知</div>
        <q-space></q-space>
        <q-btn color="primary" flat label="查看更多>>" />
      </div>
      <q-card flat class="q-pa-sm">
        <q-card-section>
          <q-list>
            <q-item v-for="n in 5" :key="n">
              <q-item-section side>
                <q-badge class="activity" text-color="warning" label="活动" />
              </q-item-section> <q-item-section>
                <q-item-label>关于2025年度XXX的通知</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
    <div class="q-ma-xs q-mt-lg">
      <div class="flex">
        <div class="text-subtitle1">酒店集团通知</div>
        <q-space></q-space>
        <q-btn color="primary" flat label="查看更多>>" />
      </div>
      <q-card flat class="q-pa-sm">
        <q-card-section>
          <q-list>
            <q-item v-for="n in 5" :key="n">
              <q-item-section side>
                <q-badge class="message" label="消息" />
              </q-item-section> <q-item-section>
                <q-item-label>关于2025年度XXX的通知</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
    <div class="q-ma-xs q-mt-lg">
      <div class="flex">
        <div class="text-subtitle1">平台消息</div>
        <q-space></q-space>
        <q-btn color="primary" flat label="查看更多>>" />
      </div>
      <q-card flat class="q-pa-sm">
        <q-card-section>
          <q-list>
            <q-item v-for="n in 5" :key="n">
              <q-item-section side>
                <q-badge class="notice" label="公告" />
              </q-item-section> <q-item-section>
                <q-item-label>关于2025年度XXX的通知</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
$message-color: #9A77F7;
$notice-color: #5D76FF;

.q-badge {
  padding-top: 5px;
  padding-bottom: 5px;
}

.activity {
  background-color: rgba($warning, 0.2);
}

.message {
  color: $message-color;
  background-color: rgba($message-color, 0.2);
}

.notice {
  color: $notice-color;
  background-color: rgba($notice-color, 0.2);
}

.q-item {
  border-bottom: 1px dashed rgba($border-bottom-color, 0.8);
}

.q-item:last-child {
  border-bottom: none;
}
</style>
