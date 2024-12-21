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
          <h2>物品管理系统</h2>
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
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
}

h2 {
  margin: 0;
  color: #303133;
}

.el-form {
  margin: 20px 0;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
