import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { env } from './config/env.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)

document.title = env.appTitle // study8: 환경변수로 제목 분리

app.mount('#app')
