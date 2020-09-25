import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false
/* eslint-disable no-undef */
try {
  MonitorSDK.vueErrorCatch(Vue)
} catch (error) {
  console.error(error)
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
