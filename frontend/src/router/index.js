import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import MarketingAutomation from '../views/MarketingAutomation.vue'
import ListManager from '../views/ListManager.vue'
import LogViewer from '../views/LogViewer.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/marketing-automation',
    name: 'marketing-automation',
    component: MarketingAutomation
  },
  {
    path: '/ai-bot',
    name: 'ai-bot',
    component: () => import('../views/notification/AIBotView.vue')
  },
  {
    path: '/lists/:id',
    name: 'list-detail',
    component: () => import('../views/ListDashboard.vue')
  },
  {
    path: '/logs',
    name: 'logs',
    component: LogViewer
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

