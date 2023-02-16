import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

//import './style.css'
//import "element-plus/theme-chalk/index.css"
import "@fortawesome/fontawesome-free/js/all";
//import { config } from "@fortawesome/fontawesome-svg-core";
import './assets/main.css'
import DescriboCrateBuilder from "@describo/crate-builder-component"

const app = createApp(App)

app.use(createPinia())
app.use(router)
//app.use(ElementPlus)
app.use(DescriboCrateBuilder)
app.provide('$test', 'test');
app.mount('#app')

