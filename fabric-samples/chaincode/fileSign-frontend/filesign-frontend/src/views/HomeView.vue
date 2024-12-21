<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user')))
const availableItems = ref([])
const borrowedItems = ref([])
const rentedItems = ref([])
const itemHistory = ref([])
const dialogVisible = ref(false)
const historyDialogVisible = ref(false)
const newItemName = ref('')

const fetchItems = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/items/all')
    const allItems = response.data

    availableItems.value = allItems.filter(item => item.status === 'available')
    borrowedItems.value = allItems.filter(item => item.borrower === user.value.username)
    rentedItems.value = allItems.filter(item => item.owner === user.value.username)
  } catch (error) {
    console.error('Fetch items error:', error)
    ElMessage.error('获取物品列表失败')
  }
}

const returnItem = async (itemId) => {
  try {
    await axios.post('http://localhost:3000/api/items/return', { itemId })
    fetchItems()
  } catch (error) {
    console.error('Return item error:', error)
    ElMessage.error('归还物品失败')
  }
}

const deleteItem = async (itemId) => {
  const item = rentedItems.value.find(item => item.itemId === itemId)
  if (item && item.status === 'borrowed') {
    ElMessage.error('物品正在被借用，无法删除')
    return
  }
  try {
    await axios.post('http://localhost:3000/api/items/delete', { itemId })
    fetchItems()
  } catch (error) {
    console.error('Delete item error:', error)
    ElMessage.error('删除物品失败')
  }
}

const addItem = async (name) => {
  const itemId = uuidv4()
  try {
    await axios.post('http://localhost:3000/api/items/add', { itemId, name, owner: user.value.username })
    fetchItems()
  } catch (error) {
    console.error('Add item error:', error)
   ElMessage.error('添加物品失败')
  }
}

const borrowItem = async (itemId) => {
  const item = availableItems.value.find(item => item.itemId === itemId)
  if (item && item.owner === user.value.username) {
    ElMessage.error('不能借用自己的物品')
    return
  }
  try {
    await axios.post('http://localhost:3000/api/items/borrow', { itemId, borrower: user.value.username })
    fetchItems()
  } catch (error) {
    console.error('Borrow item error:', error)
    ElMessage.error('租借物品失败')
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
    ElMessage.error('获取物品历史记录失败')
  }
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
    fetchItems()
  }
})

const logout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

onMounted(() => {
  if (user.value) {
    fetchItems()
  }
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header>
        <div class="header-content">
          <h2>物品管理系统</h2>
          <div class="user-info">
            <el-avatar size="small">{{ user.username.charAt(0) }}</el-avatar>
            <span>{{ user.username }}</span>
            <el-button type="danger" size="small" @click="logout">退出登录</el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容区 -->
      <el-main>
        <!-- 这里放原来的主要内容，去掉左侧的登录部分 -->
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

        <!-- 对话框部分 -->
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
/* 原有的样式保持不变，添加header相关样式 */
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ... 其他原有样式 ... */
</style>
