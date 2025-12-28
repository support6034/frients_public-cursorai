import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import MarketingAutomation from '../views/MarketingAutomation.vue'
import ListManager from '../views/ListManager.vue'
import LogViewer from '../views/LogViewer.vue'
import AIAlimbotView from '../views/AIAlimbotView.vue'

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
    path: '/marketing',
    redirect: '/marketing-automation'
  },
  {
    path: '/ai-alimbot',
    name: 'ai-alimbot',
    component: AIAlimbotView
  },
  {
    path: '/lists',
    name: 'lists',
    component: ListManager
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

