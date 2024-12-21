import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'  // 添加重定向
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  console.log('Navigation guard triggered', to.path) // 添加调试日志
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  if (to.meta.requiresAuth && !user) {
    console.log('Unauthorized access, redirecting to login')
    next('/login')
  } else if (to.path === '/login' && user) {
    console.log('Already logged in, redirecting to home')
    next('/home')
  } else {
    console.log('Proceeding with navigation')
    next()
  }
})

export default router
