const routes = [
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/login/LoginPage.vue') },
      { path: 'register', component: () => import('pages/login/RegisterPage.vue') },
      { path: 'resetpwd', component: () => import('pages/login/ResetpwdPage.vue') },
    ]
  },
  // {
  //   path: '/login',
  //   component: () => import('pages/LoginPage.vue')
  // },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
