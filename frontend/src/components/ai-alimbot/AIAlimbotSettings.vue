<template>
  <div class="ai-alimbot-settings">
    <h1>설정</h1>
    
    <!-- 1. 결제 -->
    <div class="settings-section">
      <h2>1. 결제</h2>
      <p class="section-description">프렌츠 결제 설정 - 알림톡 발송을 위한 충전 서비스</p>
      <PaymentSettings />
    </div>

    <!-- 2. 연동 -->
    <div class="settings-section">
      <h2>2. 연동</h2>
      <p class="section-description">스마트스토어와 연동하여 본 프로젝트와 연결합니다</p>
      <div class="settings-card">
        <div class="form-group">
          <label>스마트스토어 연동 활성화</label>
          <input
            type="checkbox"
            v-model="localSettings.integration.smartstore.enabled"
            @change="handleSettingsChange"
          />
        </div>
        <div v-if="localSettings.integration.smartstore.enabled" class="integration-fields">
          <div class="form-group">
            <label>API Key</label>
            <input
              type="text"
              class="form-control"
              v-model="localSettings.integration.smartstore.apiKey"
              @input="handleSettingsChange"
              placeholder="스마트스토어 API Key 입력"
            />
          </div>
          <div class="form-group">
            <label>API Secret</label>
            <input
              type="password"
              class="form-control"
              v-model="localSettings.integration.smartstore.apiSecret"
              @input="handleSettingsChange"
              placeholder="스마트스토어 API Secret 입력"
            />
          </div>
          <div class="form-group">
            <label>스토어 ID</label>
            <input
              type="text"
              class="form-control"
              v-model="localSettings.integration.smartstore.storeId"
              @input="handleSettingsChange"
              placeholder="스마트스토어 ID 입력"
            />
          </div>
          <button class="btn btn-primary" @click="$emit('save-integration')">
            연동 설정 저장
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 템플릿 선택 -->
    <div class="settings-section">
      <h2>3. 템플릿 선택</h2>
      <p class="section-description">발송할 템플릿을 선택하세요</p>
      <div class="settings-card">
        <div class="templates-list">
          <div
            v-for="template in shoppingTemplates"
            :key="template.id"
            :class="['template-item', { selected: selectedTemplates.includes(template.id) }]"
            @click="handleTemplateToggle(template.id)"
          >
            <input
              type="checkbox"
              :checked="selectedTemplates.includes(template.id)"
              @change="handleTemplateToggle(template.id)"
            />
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-description">{{ template.description }}</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="$emit('save-settings')">
          템플릿 선택 저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import PaymentSettings from '../PaymentSettings.vue'

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({
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
  },
  selectedTemplates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-settings', 'update-templates', 'save-settings', 'save-integration'])

const localSettings = ref({
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

watch(() => props.settings, (newVal) => {
  if (newVal) {
    localSettings.value = { ...newVal }
  }
}, { immediate: true, deep: true })

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

const handleSettingsChange = () => {
  emit('update-settings', localSettings.value)
}

const handleTemplateToggle = (templateId) => {
  const current = [...props.selectedTemplates]
  if (current.includes(templateId)) {
    emit('update-templates', current.filter(id => id !== templateId))
  } else {
    emit('update-templates', [...current, templateId])
  }
}
</script>

<style scoped>
.ai-alimbot-settings {
  padding: 2rem 0;
}

.ai-alimbot-settings h1 {
  font-size: 2rem;
  color: #1a202c;
  margin-bottom: 2rem;
}

.settings-section {
  margin-bottom: 3rem;
}

.settings-section h2 {
  font-size: 1.5rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #718096;
  margin-bottom: 1rem;
}

.settings-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.integration-fields {
  margin-top: 1rem;
}

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  border-color: #667eea;
  background: #f7fafc;
}

.template-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.template-item input[type="checkbox"] {
  margin-right: 1rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.template-info {
  flex: 1;
}

.template-info .template-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.template-info .template-description {
  font-size: 0.875rem;
  color: #718096;
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


