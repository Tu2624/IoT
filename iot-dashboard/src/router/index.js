import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import DataSensor from '../views/DataSensor.vue'
import ActionHistory from '../views/ActionHistory.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard },
  { path: '/data-sensor', component: DataSensor },
  { path: '/action-history', component: ActionHistory },
  { path: '/profile', component: Profile },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
