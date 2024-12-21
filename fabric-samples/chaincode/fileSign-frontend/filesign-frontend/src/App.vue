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
  <div class="common-layout">
    <el-container>
      <!-- 左侧边栏 -->
      <el-aside width="300px">
        <el-card class="login-card">
          <div v-if="!user">
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
          </div>
          <div v-else class="user-info">
            <el-avatar :size="64">{{ user.username.charAt(0) }}</el-avatar>
            <h3>{{ user.username }}</h3>
            <el-button type="danger" @click="logout" plain>退出登录</el-button>
          </div>
        </el-card>
      </el-aside>

      <!-- 主要内容区 -->
      <el-main>
        <!-- 可借用物品列表 -->
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span class="title">可借用物品</span>
            </div>
          </template>
          <el-table :data="availableItems" style="width: 100%">
            <el-table-column prop="name" label="物品名称" />
            <el-table-column prop="owner" label="所有者" />
            <el-table-column fixed="right" label="操作" width="120">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="borrowItem(scope.row.itemId)"
                  :disabled="scope.row.owner === user.username"
                >
                  借用
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 已借物品和我的物品 -->
        <el-row :gutter="20">
          <!-- 已借物品 -->
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span class="title">我借的物品</span>
                </div>
              </template>
              <el-table :data="borrowedItems">
                <el-table-column prop="name" label="物品名称" />
                <el-table-column fixed="right" label="操作" width="120">
                  <template #default="scope">
                    <el-button
                      type="success"
                      size="small"
                      @click="returnItem(scope.row.itemId)">
                      归还
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!borrowedItems.length" description="暂无借用物品" />
            </el-card>
          </el-col>

          <!-- 我的物品 -->
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span class="title">我的物品</span>
                  <el-button type="primary" size="small" @click="dialogVisible = true">
                    添加物品
                  </el-button>
                </div>
              </template>
              <el-table :data="rentedItems">
                <el-table-column prop="name" label="物品名称" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'borrowed' ? 'warning' : 'success'">
                      {{ scope.row.status === 'borrowed' ? '已借出' : '可借用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column fixed="right" label="操作" width="180">
                  <template #default="scope">
                    <el-button
                      type="danger"
                      size="small"
                      @click="deleteItem(scope.row.itemId)"
                      :disabled="scope.row.status === 'borrowed'"
                    >
                      删除
                    </el-button>
                    <el-button
                      type="info"
                      size="small"
                      @click="fetchItemHistory(scope.row.itemId); historyDialogVisible = true"
                    >
                      历史
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!rentedItems.length" description="暂无物品" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 添加物品对话框 -->
        <el-dialog
          v-model="dialogVisible"
          title="添加新物品"
          width="30%"
          :close-on-click-modal="false"
        >
          <el-form>
            <el-form-item label="物品名称">
              <el-input v-model="newItemName" placeholder="请输入物品名称" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span>
              <el-button @click="dialogVisible = false">取消</el-button>
              <el-button type="primary" @click="addItem(newItemName)">确认</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 历史记录对话框 -->
        <el-dialog
          v-model="historyDialogVisible"
          title="物品历史记录"
          width="50%"
        >
          <el-timeline>
            <el-timeline-item
              v-for="history in itemHistory"
              :key="history.txId"
              :timestamp="new Date(history.timestamp.seconds * 1000).toLocaleString()"
              :type="history.isDelete ? 'danger' : 'primary'"
            >
              <el-card>
                <h4>交易ID: {{ history.txId }}</h4>
                <p v-if="history.isDelete">物品已删除</p>
                <p v-else>状态: {{ history.value.status }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-dialog>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.common-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.login-card {
  margin: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.mb-20 {
  margin-bottom: 20px;
}

.el-form {
  margin: 20px 0;
}

h2 {
  margin: 16px 0;
  color: #303133;
}

h3 {
  margin: 0;
  color: #303133;
}

.el-button {
  margin: 8px 0;
}

.el-main {
  padding: 20px;
}

:deep(.el-table) {
  margin: 16px 0;
}

:deep(.el-timeline-item__content) {
  width: 100%;
}
</style>