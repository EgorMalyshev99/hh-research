import './styles/main.css'
import { createApp } from 'vue'

import App from './App.vue'
import { pinia } from './providers/pinia'
import { router } from './providers/router'
import { VueQueryPlugin, queryClient } from './providers/vue-query'

const app = createApp(App)

app.use(pinia)
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')
