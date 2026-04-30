import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import GamePlayer from '../pages/GamePlayer.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/game/:gameName', component: GamePlayer },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
