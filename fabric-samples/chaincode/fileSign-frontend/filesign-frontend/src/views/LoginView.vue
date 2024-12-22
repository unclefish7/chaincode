<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const username = ref('')
const password = ref('')
const newUsername = ref('')
const newPassword = ref('')

const users = ref(JSON.parse(localStorage.getItem('users')) || [
  { username: 'Alice', password: 'Alice' },
  { username: 'Bob', password: 'Bob' }
])

// 检查是否已登录
onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    router.push('/home')
  }
})

const login = async (username, password) => {
  try {
    const foundUser = users.value.find(u => u.username === username && u.password === password)
    if (foundUser) {
      localStorage.setItem('user', JSON.stringify(foundUser))
      ElMessage.success('登录成功')
      await router.push('/home')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (error) {
    console.error('Login error:', error)
  }
}

const register = async (username, password) => {
  try {
    const existingUser = users.value.find(u => u.username === username)
    if (existingUser) {
      ElMessage.error('用户名已存在')
    } else {
      const newUser = { username, password }
      users.value.push(newUser)
      localStorage.setItem('users', JSON.stringify(users.value))
      localStorage.setItem('user', JSON.stringify(newUser))
      ElMessage.success('注册成功')
      await router.push('/home')
    }
  } catch (error) {
    console.error('Register error:', error)
  }
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>物品租赁系统</h2>
        </div>
      </template>

      <el-tabs type="border-card">
        <el-tab-pane label="登录">
          <el-form>
            <el-form-item>
              <el-input v-model="username" placeholder="用户名" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="password" type="password" placeholder="密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="login(username, password)" block>
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册">
          <el-form>
            <el-form-item>
              <el-input v-model="newUsername" placeholder="用户名" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="newPassword" type="password" placeholder="密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="register(newUsername, newPassword)" block>
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e90ff 0%, #70a1ff 100%);
  position: relative;
  overflow: hidden;
}

/* 添加动态背景效果 */
.login-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(-45deg);
  animation: wave 10s linear infinite;
}

@keyframes wave {
  from { transform: rotate(-45deg) translateX(-50%); }
  to { transform: rotate(-45deg) translateX(0); }
}

.login-card {
  width: 400px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  text-align: center;
  padding: 20px 0;
}

h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.el-form {
  margin: 30px 20px;
}

.el-form-item {
  margin-bottom: 25px;
}

/* 美化输入框 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  transform: translateY(-2px);
}

/* 美化按钮 */
:deep(.el-button) {
  border-radius: 8px;
  height: 40px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 美化标签页 */
:deep(.el-tabs__nav) {
  width: 100%;
}

:deep(.el-tabs__item) {
  width: 50%;
  text-align: center;
  font-size: 16px;
  color: #606266;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}
</style>
