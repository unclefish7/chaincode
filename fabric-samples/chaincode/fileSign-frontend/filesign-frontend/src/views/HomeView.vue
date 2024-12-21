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

// ... 保持原有的其他函数不变 ...

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
          <!-- ... 原有的可借用物品列表代码 ... -->
        </el-card>

        <!-- 已借物品和我的物品 -->
        <el-row :gutter="20">
          <!-- ... 原有的已借物品和我的物品代码 ... -->
        </el-row>

        <!-- 对话框部分 -->
        <!-- ... 原有的对话框代码 ... -->
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
