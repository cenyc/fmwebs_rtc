<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer class="column bg-primary" :width="523" :model-value="true">
      <div class="col-3 q-pa-lg q-pl-xl text-white">
        <q-icon name="svguse:icons.svg#logo|0 0 45 20" size="72px" />
        <span class="text-h6 q-ma-md">SpaceInsight 酒店智能安防系统</span>
      </div>
      <div class="col-4 q-pa-lg text-white">
        <q-img src="~assets/login.png" />
      </div>
      <div class="col-5 q-pa-lg q-pt-xl text-white">
        <p class="text-h3 text-center q-mt-xl" style="font-size:45px">让专属于你的产品</p>
        <p class="text-h2 text-center text-weight-bold q-ma-md" style="color:#FFE8BA">更加自由灵活</p>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<style lang="scss">
.login-page {
  $title-color: #3D3D3D;
  $label-color: #666666;
  $primary: #5983FF;

  .logo-title {
    color: $title-color !important;
  }

  label,
  .q-checkbox__label {
    color: $label-color;
  }

  .q-input,
  .q-select {
    width: 380px;
    margin-top: 5px !important;

    .q-field__control {
      border-radius: 4px !important;
    }
  }

  .q-field--outlined {
    margin-bottom: 16px;
  }

  // 登录按钮
  .vibrant-btn {
    height: 50px;
    // border-radius: 10px;
    font-weight: bold;
    letter-spacing: 2px;
    font-size: 1.1rem;
    background: $primary !important;
    // box-shadow: 0 4px 15px rgba($primary, 0.3);
  }
}
</style>
