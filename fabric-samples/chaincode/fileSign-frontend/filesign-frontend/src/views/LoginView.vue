<script setup>
import { ref } from 'vue'
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

const saveUsers = () => {
  localStorage.setItem('users', JSON.stringify(users.value))
}

const login = (username, password) => {
  const foundUser = users.value.find(u => u.username === username && u.password === password)
  if (foundUser) {
    localStorage.setItem('user', JSON.stringify(foundUser))
    ElMessage.success('登录成功')
    router.push('/home')
  } else {
    ElMessage.error('用户名或密码错误')
  }
}

const register = (username, password) => {
  const existingUser = users.value.find(u => u.username === username)
  if (existingUser) {
    ElMessage.error('用户名已存在')
  } else {
    const newUser = { username, password }
    users.value.push(newUser)
    saveUsers()
    localStorage.setItem('user', JSON.stringify(newUser))
    ElMessage.success('注册成功')
    router.push('/home')
  }
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>登录</h2>
      <el-form>
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" />
        </el-form-item>
        <el-button type="primary" @click="login(username, password)" block>
          登录
        </el-button>
      </el-form>

      <el-divider>或</el-divider>

      <h2>注册</h2>
      <el-form>
        <el-form-item>
          <el-input v-model="newUsername" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="newPassword" type="password" placeholder="密码" />
        </el-form-item>
        <el-button type="success" @click="register(newUsername, newPassword)" block>
          注册
        </el-button>
      </el-form>
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
  padding: 20px;
}

h2 {
  text-align: center;
  margin: 16px 0;
  color: #303133;
}

.el-form {
  margin: 20px 0;
}
</style>
