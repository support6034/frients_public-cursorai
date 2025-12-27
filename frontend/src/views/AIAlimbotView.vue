<template>
  <div class="ai-alimbot min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="ai-alimbot-header">
      <h1>AI 알림봇</h1>
      <p>쇼핑몰 주문 알림톡 자동 발송</p>
    </header>

    <!-- 네비게이션 -->
    <nav class="ai-alimbot-nav">
      <button
        :class="['nav-btn', { active: activeTab === 'dashboard' }]"
        @click="activeTab = 'dashboard'"
      >
        대시보드
      </button>
      <button
        :class="['nav-btn', { active: activeTab === 'settings' }]"
        @click="activeTab = 'settings'"
      >
        설정
      </button>
    </nav>

    <!-- 컨텐츠 -->
    <div class="ai-alimbot-content">
      <AIAlimbotDashboard
        v-if="activeTab === 'dashboard'"
        :selected-templates="selectedTemplates"
        @update-templates="handleTemplateUpdate"
        @save-templates="handleSaveTemplates"
      />
      <AIAlimbotSettings
        v-if="activeTab === 'settings'"
        :settings="settings"
        :selected-templates="selectedTemplates"
        @update-settings="handleSettingsUpdate"
        @update-templates="handleTemplateUpdate"
        @save-settings="handleSaveSettings"
        @save-integration="handleSaveIntegration"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAiAlimbotStore } from '../stores/aiAlimbot'
import AIAlimbotDashboard from '../components/ai-alimbot/AIAlimbotDashboard.vue'
import AIAlimbotSettings from '../components/ai-alimbot/AIAlimbotSettings.vue'

const aiAlimbotStore = useAiAlimbotStore()
const activeTab = ref('dashboard')
const selectedTemplates = ref([1, 2, 3, 4, 5]) // 기본 템플릿
const settings = ref({
  payment: {},
  integration: {
    smartstore: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      storeId: ''
    }
  }
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    // 설정 로드
    await aiAlimbotStore.fetchSettings()
    if (aiAlimbotStore.settings) {
      settings.value = aiAlimbotStore.settings
    }

    // 템플릿 로드
    await aiAlimbotStore.fetchTemplates()
    if (aiAlimbotStore.templates && aiAlimbotStore.templates.length > 0) {
      selectedTemplates.value = aiAlimbotStore.templates
    } else {
      // 저장된 템플릿이 없으면 기본 템플릿 선택
      const defaults = [1, 2, 3, 4, 5]
      selectedTemplates.value = defaults
      // 서버에 기본 템플릿 저장
      try {
        await aiAlimbotStore.saveTemplates(defaults)
      } catch (err) {
        console.error('기본 템플릿 저장 오류:', err)
      }
    }
  } catch (error) {
    console.error('데이터 로드 오류:', error)
    // 오류 발생 시 기본 템플릿 선택
    const defaults = [1, 2, 3, 4, 5]
    selectedTemplates.value = defaults
  }
}

const handleTemplateUpdate = (templateIds) => {
  selectedTemplates.value = templateIds
}

const handleSaveTemplates = async () => {
  try {
    await aiAlimbotStore.saveSettings(settings.value)
    await aiAlimbotStore.saveTemplates(selectedTemplates.value)
    
    // 워크플로우 동기화
    try {
      const syncResponse = await aiAlimbotStore.syncWorkflows()
      if (syncResponse && syncResponse.success) {
        alert(`설정이 저장되었습니다.\n${syncResponse.message}`)
      }
    } catch (syncError) {
      console.error('워크플로우 동기화 오류:', syncError)
      alert('설정은 저장되었지만 워크플로우 동기화에 실패했습니다.')
    }
  } catch (error) {
    console.error('템플릿 저장 오류:', error)
    alert('설정 저장에 실패했습니다.')
  }
}

const handleSettingsUpdate = (newSettings) => {
  settings.value = { ...settings.value, ...newSettings }
}

const handleSaveSettings = async () => {
  try {
    await aiAlimbotStore.saveSettings(settings.value)
    await aiAlimbotStore.syncWorkflows()
    alert('설정이 저장되었습니다.')
  } catch (error) {
    console.error('설정 저장 오류:', error)
    alert('설정 저장에 실패했습니다.')
  }
}

const handleSaveIntegration = async () => {
  try {
    await aiAlimbotStore.saveIntegration(settings.value.integration)
    alert('연동 설정이 저장되었습니다.')
  } catch (error) {
    console.error('연동 설정 저장 오류:', error)
    alert('연동 설정 저장에 실패했습니다.')
  }
}
</script>

<style scoped>
.ai-alimbot {
  min-height: calc(100vh - 200px);
}

.ai-alimbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.ai-alimbot-header h1 {
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.ai-alimbot-header p {
  opacity: 0.9;
  font-size: 1rem;
}

.ai-alimbot-nav {
  display: flex;
  justify-content: center;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
}

.nav-btn {
  padding: 1rem 2rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  color: #4a5568;
  background: #f7fafc;
}

.nav-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.ai-alimbot-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>

