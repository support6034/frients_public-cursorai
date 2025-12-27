<template>
  <div class="ai-bot min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="ai-bot-header bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 text-center">
      <h1 class="text-3xl font-bold mb-2">AI 알림봇</h1>
      <p class="text-lg opacity-90">쇼핑몰 주문 알림톡 자동 발송</p>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="ai-bot-nav flex justify-center bg-white border-b border-gray-200">
      <button
        :class="['nav-btn px-8 py-4 bg-transparent border-none border-b-2 transition-all', 
                 activeTab.value === 'dashboard' ? 'text-indigo-500 border-indigo-500 font-medium' : 'text-gray-500 border-transparent']"
        @click="setActiveTab('dashboard')"
      >
        대시보드
      </button>
      <button
        :class="['nav-btn px-8 py-4 bg-transparent border-none border-b-2 transition-all',
                 activeTab.value === 'settings' ? 'text-indigo-500 border-indigo-500 font-medium' : 'text-gray-500 border-transparent']"
        @click="setActiveTab('settings')"
      >
        설정
      </button>
    </nav>

    <!-- 컨텐츠 -->
    <div class="ai-bot-content max-w-7xl mx-auto px-4 py-8">
      <!-- 대시보드 탭 -->
      <div v-if="activeTab.value === 'dashboard'">
        <DashboardSection />
        <DebugLogViewer />
      </div>

      <!-- 설정 탭 -->
      <div v-if="activeTab.value === 'settings'">
        <SettingsSection />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification'
import DashboardSection from '../../components/notification/DashboardSection.vue'
import SettingsSection from '../../components/notification/SettingsSection.vue'
import DebugLogViewer from '../../components/notification/DebugLogViewer.vue'

const store = useNotificationStore()
const { activeTab, selectedIndustry } = storeToRefs(store)

const {
  setActiveTab,
  fetchSettings,
  fetchTemplates
} = store

onMounted(async () => {
  await loadInitialData()
})

const loadInitialData = async () => {
  await fetchSettings(selectedIndustry.value)
  await fetchTemplates(selectedIndustry.value)
}
</script>

<style scoped>
.ai-bot-nav .nav-btn:hover {
  color: #4a5568;
  background: #f7fafc;
}
</style>

