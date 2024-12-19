<script setup>
import { ref } from 'vue'
import axios from 'axios'

const file = ref(null)
const fileHash = ref('')
const encryptedSignature = ref('')
const owner = ref('')
const verificationResult = ref(null)

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosInstance.interceptors.request.use(config => {
  config.headers['Access-Control-Allow-Origin'] = '*'
  return config
})

const handleFileUpload = async () => {
  if (!file.value) {
    console.error('No file selected')
    return
  }

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const response = await axiosInstance.post('/files/hash', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    fileHash.value = response.data.fileHash
  } catch (error) {
    console.error('Error generating hash:', error)
  }
}

const handleGenerateSignature = async () => {
  try {
    const response = await axiosInstance.post('/files/sign', { fileHash: fileHash.value })
    encryptedSignature.value = response.data.encryptedSignature
  } catch (error) {
    console.error('Error generating signature:', error)
  }
}

const handleStoreFile = async () => {
  if (!fileHash.value || !encryptedSignature.value || !owner.value) {
    console.error('Missing required fields')
    return
  }

  try {
    console.log('Sending data:', {
      fileHash: fileHash.value,
      encryptedSignature: encryptedSignature.value,
      owner: owner.value
    })
    const response = await axiosInstance.post('/files', {
      fileHash: fileHash.value,
      encryptedSignature: encryptedSignature.value,
      owner: owner.value
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('File stored:', response.data)
  } catch (error) {
    console.error('Error storing file:', error)
  }
}

const handleVerifyFile = async () => {
  try {
    const response = await axiosInstance.post('/files/verify', { fileHash: fileHash.value })
    verificationResult.value = response.data
  } catch (error) {
    console.error('Error verifying file:', error)
  }
}

const handleFileChange = (e) => {
  file.value = e.target.files[0]
}
</script>

<template>
  <div>
    <h1>文件签名系统</h1>

    <div>
      <input type="file" @change="handleFileChange" />
      <button @click="handleFileUpload">生成哈希</button>
    </div>

    <div v-if="fileHash">
      <p>文件哈希: {{ fileHash }}</p>
      <button @click="handleGenerateSignature">生成签名</button>
    </div>

    <div v-if="encryptedSignature">
      <p>签名: {{ encryptedSignature }}</p>
      <input v-model="owner" placeholder="输入文件所有者" />
      <button @click="handleStoreFile">上链存储</button>
    </div>

    <div>
      <button @click="handleVerifyFile">验证文件</button>
      <div v-if="verificationResult">
        <p>验证结果: {{ verificationResult.message }}</p>
        <pre>{{ verificationResult.details }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式可以根据需要进行调整 */
</style>
