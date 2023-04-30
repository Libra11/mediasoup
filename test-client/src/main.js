/*
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-30 18:04:58
 * @LastEditors: Libra
 * @Description:
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')
