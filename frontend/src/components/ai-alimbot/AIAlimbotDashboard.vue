<template>
  <div class="ai-alimbot-dashboard">
    <div class="dashboard-header">
      <h1>AI 알림봇</h1>
      <p>쇼핑몰 주문 알림톡 자동 발송 서비스</p>
    </div>

    <div class="industry-selector">
      <div
        v-for="industry in industries"
        :key="industry.id"
        :class="['industry-card', { active: selectedIndustry === industry.id, disabled: industry.disabled }]"
        @click="!industry.disabled && (selectedIndustry = industry.id)"
      >
        <div class="industry-icon">{{ industry.icon }}</div>
        <div class="industry-name">{{ industry.name }}</div>
        <div v-if="industry.disabled" class="coming-soon">준비중</div>
      </div>
    </div>

    <div v-if="selectedIndustry === 'shopping'" class="templates-section">
      <h2>주문톡 템플릿</h2>
      <p class="section-description">쇼핑몰 주문 알림톡 템플릿을 선택하세요</p>
      <div class="templates-grid">
        <div
          v-for="template in shoppingTemplates"
          :key="template.id"
          :class="['template-card', { selected: selectedTemplates.includes(template.id) }]"
          @click="handleTemplateClick(template.id)"
        >
          <div class="template-checkbox">
            {{ selectedTemplates.includes(template.id) ? '✓' : '' }}
          </div>
          <div class="template-name">{{ template.name }}</div>
          <div class="template-description">{{ template.description }}</div>
          <div v-if="template.default" class="template-badge">기본</div>
        </div>
      </div>
      <div class="templates-actions">
        <button class="btn btn-primary" @click="$emit('save-templates')">
          선택한 템플릿 저장
        </button>
      </div>
    </div>

    <DebugLogViewer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DebugLogViewer from '../DebugLogViewer.vue'

const props = defineProps({
  selectedTemplates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-templates', 'save-templates'])

const selectedIndustry = ref('shopping')

const industries = [
  { id: 'shopping', name: '쇼핑몰', icon: '🛒' },
  { id: 'reservation', name: '예약', icon: '📅', disabled: true },
  { id: 'franchise', name: '프랜차이즈', icon: '🏢', disabled: true },
  { id: 'store', name: '매장', icon: '🏪', disabled: true }
]

const shoppingTemplates = [
  { id: 1, name: '주문접수', description: '주문이 접수되었습니다', default: true },
  { id: 2, name: '결제완료', description: '결제가 완료되었습니다', default: true },
  { id: 3, name: '상품준비중', description: '상품을 준비하고 있습니다', default: true },
  { id: 4, name: '배송시작', description: '배송이 시작되었습니다', default: true },
  { id: 5, name: '배송완료', description: '배송이 완료되었습니다', default: true },
  { id: 6, name: '구매확정', description: '구매가 확정되었습니다', default: false },
  { id: 7, name: '리뷰요청', description: '리뷰를 작성해주세요', default: false },
  { id: 8, name: '재고부족', description: '재고가 부족합니다', default: false },
  { id: 9, name: '주문취소', description: '주문이 취소되었습니다', default: false },
  { id: 10, name: '환불완료', description: '환불이 완료되었습니다', default: false }
]

const handleTemplateClick = (templateId) => {
  const current = [...props.selectedTemplates]
  if (current.includes(templateId)) {
    emit('update-templates', current.filter(id => id !== templateId))
  } else {
    emit('update-templates', [...current, templateId])
  }
}
</script>

<style scoped>
.ai-alimbot-dashboard {
  padding: 2rem 0;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  font-size: 1.125rem;
  color: #718096;
}

.industry-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.industry-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.industry-card:hover:not(.disabled) {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.industry-card.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.industry-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.industry-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.industry-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
}

.coming-soon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #fed7d7;
  color: #742a2a;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.templates-section {
  margin-top: 3rem;
}

.templates-section h2 {
  font-size: 1.5rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #718096;
  margin-bottom: 2rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.template-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.template-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-card.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.template-checkbox {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: 2px solid #cbd5e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-weight: bold;
  color: #667eea;
}

.template-card.selected .template-checkbox {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.template-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.template-description {
  font-size: 0.875rem;
  color: #718096;
}

.template-badge {
  display: inline-block;
  background: #c6f6d5;
  color: #22543d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.templates-actions {
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}
</style>

