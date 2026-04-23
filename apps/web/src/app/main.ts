import './styles/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './providers/router'
import { pinia } from './providers/pinia'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
