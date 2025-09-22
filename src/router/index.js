import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { LoadingBar } from 'quasar'
import { useUserStore } from 'stores/user'
import routes from './routes'
import { $error } from 'src/utils/notify'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */
let dynamicRouter = null;
export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  dynamicRouter = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  dynamicRouter.beforeEach((to, from, next) => {
    LoadingBar.start()
    const userStore = useUserStore();
    if (userStore.isAuthenticated) {
      if (to.path === '/login') {
        next('/')
      } else {
        // 增加路由
        console.log('增加路由 to.path = ', dynamicRouter.getRoutes().length)
        if (dynamicRouter.getRoutes().length == 5) {
          userStore.setRoutes();
          next({ path: to.path, replace: true })
        } else {
          next();
        }
      }
    } else {
      // const whitelist = ['/login', '/404'];
      if (to.path.indexOf('/login') !== -1) {
        // in the free login whitelist, go directly
        next();
      } else {
        // other pages that do not have permission to access are redirected to the login page.
        next(`/login?redirect=${to.path}`);

      }
    }
    LoadingBar.stop();
  })

  dynamicRouter.onError((e) => {
    $error(e.message)
  })

  return dynamicRouter
})

// 导出添加路由的方法
export function addDynamicRoute(route) {
  dynamicRouter.addRoute(route)
}
