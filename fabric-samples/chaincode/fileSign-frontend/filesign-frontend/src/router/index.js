import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
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
    },
    // 添加通配符路由，捕获所有未匹配的路径
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

router.beforeEach((to, from, next) => {
  try {
    // 验证 localStorage 中的用户数据是否有效
    const userStr = localStorage.getItem('user')
    let user = null
    
    if (userStr) {
      try {
        user = JSON.parse(userStr)
        // 验证用户对象是否有效
        if (!user || !user.username) {
          console.log('Invalid user data, clearing localStorage')
          localStorage.removeItem('user')
          user = null
        }
      } catch (e) {
        console.log('Error parsing user data, clearing localStorage')
        localStorage.removeItem('user')
        user = null
      }
    }

    console.log('Current route:', to.path)
    console.log('User status:', user ? 'logged in' : 'not logged in')

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
  } catch (error) {
    console.error('Router guard error:', error)
    localStorage.removeItem('user')
    next('/login')
  }
})

export default router
