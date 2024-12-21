<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const user = ref(null)
const availableItems = ref([])
const borrowedItems = ref([])
const rentedItems = ref([])
const itemHistory = ref([])
const errorMessage = ref('')

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
    user.value = foundUser
    localStorage.setItem('user', JSON.stringify(user.value))
    fetchItems()
  } else {
    errorMessage.value = '用户名或密码错误'
  }
}

const register = (username, password) => {
  const existingUser = users.value.find(u => u.username === username)
  if (existingUser) {
    errorMessage.value = '用户名已存在'
  } else {
    const newUser = { username, password }
    users.value.push(newUser)
    saveUsers()
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(user.value))
    fetchItems()
  }
}

const logout = () => {
  user.value = null
  localStorage.removeItem('user')
  location.reload()
}

const fetchItems = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/items/all')
    const allItems = response.data

    availableItems.value = allItems.filter(item => item.status === 'available')
    borrowedItems.value = allItems.filter(item => item.borrower === user.value.username)
    rentedItems.value = allItems.filter(item => item.owner === user.value.username)
  } catch (error) {
    console.error('Fetch items error:', error)
    errorMessage.value = '获取物品列表失败'
  }
}

const returnItem = async (itemId) => {
  try {
    await axios.post('http://localhost:3000/api/items/return', { itemId })
    fetchItems()
  } catch (error) {
    console.error('Return item error:', error)
    errorMessage.value = '归还物品失败'
  }
}

const deleteItem = async (itemId) => {
  const item = rentedItems.value.find(item => item.itemId === itemId)
  if (item && item.status === 'borrowed') {
    errorMessage.value = '物品正在被借用，无法删除'
    return
  }
  try {
    await axios.post('http://localhost:3000/api/items/delete', { itemId })
    fetchItems()
  } catch (error) {
    console.error('Delete item error:', error)
    errorMessage.value = '删除物品失败'
  }
}

const addItem = async (name) => {
  const itemId = uuidv4()
  try {
    await axios.post('http://localhost:3000/api/items/add', { itemId, name, owner: user.value.username })
    fetchItems()
  } catch (error) {
    console.error('Add item error:', error)
    errorMessage.value = '添加物品失败'
  }
}

const borrowItem = async (itemId) => {
  const item = availableItems.value.find(item => item.itemId === itemId)
  if (item && item.owner === user.value.username) {
    errorMessage.value = '不能借用自己的物品'
    return
  }
  try {
    await axios.post('http://localhost:3000/api/items/borrow', { itemId, borrower: user.value.username })
    fetchItems()
  } catch (error) {
    console.error('Borrow item error:', error)
    errorMessage.value = '租借物品失败'
  }
}

const fetchItemHistory = async (itemId) => {
  try {
    const response = await axios.get('http://localhost:3000/api/items/history', { params: { itemId } })
    itemHistory.value = response.data.map(record => ({
      ...record,
      value: record.value ? JSON.parse(record.value) : null
    }))
  } catch (error) {
    console.error('Fetch item history error:', error)
    errorMessage.value = '获取物品历史记录失败'
  }
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
    fetchItems()
  }
})
</script>

<template>
  <div class="container">
    <div class="sidebar">
      <div v-if="!user">
        <h2>登录</h2>
        <input v-model="username" placeholder="用户名" />
        <input v-model="password" type="password" placeholder="密码" />
        <button @click="login(username, password)">登录</button>
        <h2>注册</h2>
        <input v-model="newUsername" placeholder="用户名" />
        <input v-model="newPassword" type="password" placeholder="密码" />
        <button @click="register(newUsername, newPassword)">注册</button>
      </div>
      <div v-else>
        <h2>当前用户</h2>
        <p>{{ user.username }}</p>
        <button @click="logout">登出</button>
      </div>
      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
    <div class="main-content">
      <div class="section">
        <h2>可借用物品</h2>
        <div class="items-grid">
          <div v-for="item in availableItems" :key="item.itemId" class="item">
            <p>名称: {{ item.name }}</p>
            <p>所有者: {{ item.owner }}</p>
            <button @click="borrowItem(item.itemId)" :disabled="item.owner === user.username">租借</button>
          </div>
        </div>
      </div>
      <div class="hstack">
        <div class="half-section">
          <div class="section">
            <h2>我借的物品</h2>
            <ul>
              <li v-for="item in borrowedItems" :key="item.itemId" class="item">
                {{ item.name }}
                <button @click="returnItem(item.itemId)">归还</button>
              </li>
            </ul>
          </div>
        </div>
        <div class="half-section">
          <div class="section">
            <h2>我租出去的物品</h2>
            <ul>
              <li v-for="item in rentedItems" :key="item.itemId" class="item">
                {{ item.name }}
                <button @click="deleteItem(item.itemId)" :disabled="item.status === 'borrowed'">删除</button>
                <button @click="fetchItemHistory(item.itemId)">查看历史</button>
              </li>
            </ul>
            <input v-model="newItemName" placeholder="物品名称" />
            <button @click="addItem(newItemName)">添加物品</button>
            <div v-if="itemHistory.length">
              <h3>物品历史记录</h3>
              <ul>
                <li v-for="history in itemHistory" :key="history.txId" class="item">
                  <p>交易ID: {{ history.txId }}</p>
                  <p>时间: {{ new Date(history.timestamp.seconds * 1000).toLocaleString() }}</p>
                  <p v-if="history.isDelete">已删除</p>
                  <p v-else>状态: {{ history.value.status }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.sidebar {
  width: 25%;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 20px;
  box-sizing: border-box;
}

.main-content {
  width: 75%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.section {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.item {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  box-sizing: border-box;
  width: calc(33.333% - 10px);
}

.hstack {
  display: flex;
  justify-content: space-between;
}

.half-section {
  width: 48%;
  box-sizing: border-box;
}

.error-message {
  color: red;
}
</style>
