<template>
  <div class="ai-bot-settings py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">설정</h1>

    <!-- 결제 설정 -->
    <div class="settings-section mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">1. 결제</h2>
      <p class="text-gray-600 mb-4">프렌츠 결제 설정 - 알림톡 발송을 위한 충전 서비스</p>
      <PaymentSettings />
    </div>

    <!-- 연동 설정 -->
    <div class="settings-section mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">2. 연동</h2>
      <p class="text-gray-600 mb-4">스마트스토어와 연동하여 본 프로젝트와 연결합니다</p>
      <div class="settings-card bg-white border border-gray-200 rounded-lg p-8 mt-4">
        <div class="form-group mb-6">
          <label class="block mb-2 font-medium text-gray-700">
            <input
              type="checkbox"
              v-model="integration.smartstore.enabled"
              class="mr-2"
            />
            스마트스토어 연동 활성화
          </label>
        </div>

        <div v-if="integration.smartstore.enabled" class="space-y-4">
          <div class="form-group">
            <label class="block mb-2 font-medium text-gray-700">API Key</label>
            <input
              type="text"
              v-model="integration.smartstore.apiKey"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              placeholder="스마트스토어 API Key 입력"
            />
          </div>

          <div class="form-group">
            <label class="block mb-2 font-medium text-gray-700">API Secret</label>
            <input
              type="password"
              v-model="integration.smartstore.apiSecret"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              placeholder="스마트스토어 API Secret 입력"
            />
          </div>

          <div class="form-group">
            <label class="block mb-2 font-medium text-gray-700">스토어 ID</label>
            <input
              type="text"
              v-model="integration.smartstore.storeId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              placeholder="스마트스토어 ID 입력"
            />
          </div>

          <button
            class="btn-primary px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
            @click="handleSaveIntegration"
            :disabled="loading"
          >
            {{ loading ? '저장 중...' : '연동 설정 저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 템플릿 선택 -->
    <div class="settings-section mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">3. 템플릿 선택</h2>
      <p class="text-gray-600 mb-4">발송할 템플릿을 선택하세요</p>
      <div class="settings-card bg-white border border-gray-200 rounded-lg p-8 mt-4">
        <div class="templates-list space-y-2 mb-8">
          <div
            v-for="template in shoppingTemplates"
            :key="template.id"
            :class="[
              'template-item flex items-center p-4 border rounded-lg cursor-pointer transition-all',
              selectedTemplates.includes(template.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-500 hover:bg-gray-50'
            ]"
            @click="handleTemplateToggle(template.id)"
          >
            <input
              type="checkbox"
              :checked="selectedTemplates.includes(template.id)"
              @change="handleTemplateToggle(template.id)"
              class="mr-4 w-5 h-5 cursor-pointer"
            />
            <div class="template-info flex-1">
              <div class="template-name font-semibold text-gray-900 mb-1">{{ template.name }}</div>
              <div class="template-description text-sm text-gray-600">{{ template.description }}</div>
            </div>
          </div>
        </div>

        <button
          class="btn-primary px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          @click="handleSaveSettings"
          :disabled="loading"
        >
          {{ loading ? '저장 중...' : '템플릿 선택 저장' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../../stores/notification'
import PaymentSettings from './PaymentSettings.vue'

const store = useNotificationStore()

const {
  integration,
  selectedTemplates,
  shoppingTemplates,
  loading,
  toggleTemplate,
  saveIntegration,
  saveSettingsAndSync
} = store

const handleTemplateToggle = (templateId) => {
  toggleTemplate(templateId)
}

const handleSaveIntegration = async () => {
  try {
    await saveIntegration(integration)
    alert('연동 설정이 저장되었습니다.')
  } catch (error) {
    alert('연동 설정 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
  }
}

const handleSaveSettings = async () => {
  try {
    const syncResult = await saveSettingsAndSync(store.settings, selectedTemplates)
    if (syncResult) {
      alert(`설정이 저장되었습니다.\n${syncResult.message || '워크플로우가 동기화되었습니다.'}`)
    }
  } catch (error) {
    alert('설정 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
  }
}
</script>

