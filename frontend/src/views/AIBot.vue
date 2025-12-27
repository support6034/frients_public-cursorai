<template>
  <div class="ai-bot min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">AI 알림봇</h1>
        <p class="text-gray-600">쇼핑몰 주문 알림톡 자동 발송 설정</p>
      </div>

      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-600">로딩 중...</p>
      </div>

      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">설정</h2>
        <p class="text-gray-600">AI 알림봇 설정 기능은 곧 추가될 예정입니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAiBotStore } from '../stores/aiBot'

const aiBotStore = useAiBotStore()
const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  loading.value = true
  error.value = null
  try {
    await aiBotStore.fetchSettings('shopping')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

