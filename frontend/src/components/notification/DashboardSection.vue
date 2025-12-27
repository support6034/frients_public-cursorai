<template>
  <div class="ai-bot-dashboard py-8">
    <!-- 대시보드 헤더 -->
    <div class="dashboard-header text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">AI 알림봇</h1>
      <p class="text-lg text-gray-600">쇼핑몰 주문 알림톡 자동 발송 서비스</p>
    </div>

    <!-- 업종 선택 카드 -->
    <div class="industry-selector grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <IndustryCard
        v-for="industry in industries"
        :key="industry.id"
        :industry="industry"
        :active="selectedIndustry.value === industry.id"
        @select="handleIndustrySelect"
      />
    </div>

    <!-- 템플릿 선택 섹션 (쇼핑몰 선택 시) -->
    <div v-if="selectedIndustry.value === 'shopping'" class="templates-section mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">주문톡 템플릿</h2>
      <p class="text-gray-600 mb-8">쇼핑몰 주문 알림톡 템플릿을 선택하세요</p>
      
      <!-- 템플릿 그리드 -->
      <div class="templates-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      <TemplateCard
        v-for="template in shoppingTemplates"
        :key="template.id"
        :template="template"
        :selected="selectedTemplates.value.includes(template.id)"
        @toggle="handleTemplateToggle"
      />
      </div>

      <!-- 저장 버튼 -->
      <div class="templates-actions text-center">
        <button
          class="btn-primary px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          @click="handleSaveSettings"
          :disabled="loading.value"
        >
          {{ loading ? '저장 중...' : '선택한 템플릿 저장' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification'
import IndustryCard from './IndustryCard.vue'
import TemplateCard from './TemplateCard.vue'

const store = useNotificationStore()
const { selectedIndustry, selectedTemplates, shoppingTemplates, loading, settings } = storeToRefs(store)

const {
  setSelectedIndustry,
  toggleTemplate,
  saveSettingsAndSync
} = store

const industries = [
  { id: 'shopping', name: '쇼핑몰', icon: '🛒' },
  { id: 'reservation', name: '예약', icon: '📅', disabled: true },
  { id: 'franchise', name: '프랜차이즈', icon: '🏢', disabled: true },
  { id: 'store', name: '매장', icon: '🏪', disabled: true }
]

const handleIndustrySelect = (industryId) => {
  if (!industries.find(i => i.id === industryId)?.disabled) {
    setSelectedIndustry(industryId)
  }
}

const handleTemplateToggle = (templateId) => {
  toggleTemplate(templateId)
}

const handleSaveSettings = async () => {
  try {
    const syncResult = await saveSettingsAndSync(settings.value, selectedTemplates.value)
    if (syncResult) {
      alert(`설정이 저장되었습니다.\n${syncResult.message || '워크플로우가 동기화되었습니다.'}`)
    }
  } catch (error) {
    alert('설정 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
  }
}
</script>

