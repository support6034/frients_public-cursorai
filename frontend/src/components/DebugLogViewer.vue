<template>
  <div class="debug-log-viewer">
    <div class="log-header">
      <h2>GW/WF 디버그 로그</h2>
      <div class="log-controls">
        <button class="btn btn-test" @click="handleGWTest">🧪 GW 테스트</button>
        <button class="btn btn-test" @click="handleWFTest">🧪 WF 테스트</button>
        <label class="auto-refresh-label">
          <input type="checkbox" v-model="autoRefresh" />
          자동 새로고침 (3초)
        </label>
        <button class="btn btn-refresh" @click="loadLogs" :disabled="loading">
          {{ loading ? '로딩 중...' : '새로고침' }}
        </button>
      </div>
    </div>

    <div class="log-filters">
      <select v-model="filters.component" @change="loadLogs">
        <option value="">전체 컴포넌트</option>
        <option value="GW">게이트웨이 (GW)</option>
        <option value="WF">워크플로우 (WF)</option>
      </select>
      <select v-model="filters.direction" @change="loadLogs">
        <option value="">전체 방향</option>
        <option value="IN">수신 (IN)</option>
        <option value="OUT">발신 (OUT)</option>
      </select>
      <select v-model="filters.limit" @change="loadLogs">
        <option value="20">최근 20개</option>
        <option value="50">최근 50개</option>
        <option value="100">최근 100개</option>
        <option value="200">최근 200개</option>
      </select>
    </div>

    <div v-if="logs.length === 0" class="empty-logs">
      로그가 없습니다.
    </div>
    <div v-else class="log-list">
      <div v-for="log in logs" :key="log.id" :class="['log-item', getStatusClass(log.status)]">
        <div class="log-meta">
          <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
          <span :class="['log-component', `component-${log.component}`]">
            {{ getComponentLabel(log.component) }}
          </span>
          <span :class="['log-direction', `direction-${log.direction}`]">
            {{ getDirectionIcon(log.direction) }}
          </span>
          <span :class="['log-status', `status-${log.status}`]">
            {{ getStatusLabel(log.status) }}
          </span>
        </div>
        <div class="log-action">{{ getActionLabel(log.action) }}</div>
        <div v-if="log.url" class="log-url">{{ log.url }}</div>
        <div v-if="log.error_message" class="log-error">{{ log.error_message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import api from '../api'

const logs = ref([])
const loading = ref(false)
const filters = ref({
  component: '',
  direction: '',
  limit: 50
})
const autoRefresh = ref(true)
let refreshInterval = null

onMounted(() => {
  loadLogs()
  if (autoRefresh.value) {
    refreshInterval = setInterval(() => {
      loadLogs()
    }, 3000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

watch(autoRefresh, (newVal) => {
  if (newVal) {
    refreshInterval = setInterval(() => {
      loadLogs()
    }, 3000)
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
})

const loadLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.component) params.append('component', filters.value.component)
    if (filters.value.direction) params.append('direction', filters.value.direction)
    params.append('limit', filters.value.limit)

    const response = await api.get(`/api/debug-logs?${params.toString()}`)
    if (response.data.success) {
      logs.value = response.data.data || []
    }
  } catch (error) {
    console.error('로그 조회 오류:', error)
  } finally {
    loading.value = false
  }
}

const handleGWTest = async () => {
  try {
    const response = await api.post('/api/test/gw-smartstore-poll')
    if (response.data.success) {
      alert('GW 테스트 완료!\n스마트스토어 API 폴링 및 GTM 트리거가 발생했습니다.')
      loadLogs()
    }
  } catch (error) {
    console.error('GW 테스트 오류:', error)
    alert('GW 테스트 실패: ' + (error.response?.data?.error || error.message))
  }
}

const handleWFTest = async () => {
  try {
    const response = await api.post('/api/test/wf-trigger')
    if (response.data.success) {
      alert('WF 테스트 완료!\n워크플로우가 트리거되었습니다.')
      loadLogs()
    }
  } catch (error) {
    console.error('WF 테스트 오류:', error)
    alert('WF 테스트 실패: ' + (error.response?.data?.error || error.message))
  }
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusClass = (status) => {
  if (status === 'success' || status === 'received') return 'status-success'
  if (status === 'error') return 'status-error'
  if (status === 'skipped') return 'status-skipped'
  return 'status-info'
}

const getDirectionIcon = (direction) => {
  return direction === 'IN' ? '⬇️' : '⬆️'
}

const getComponentLabel = (component) => {
  return component === 'GW' ? '게이트웨이' : '워크플로우'
}

const getActionLabel = (action) => {
  const labels = {
    '스마트스토어 API 폴링': '스마트스토어 API 폴링',
    'GTM 트리거 발생': 'GTM 트리거 발생',
    'GTM 이벤트 수신': 'GTM 이벤트 수신',
    '알림봇 웹훅 API 호출': '알림봇 웹훅 API 호출'
  }
  return labels[action] || action
}

const getStatusLabel = (status) => {
  const labels = {
    success: '성공',
    received: '수신',
    error: '오류',
    skipped: '건너뜀'
  }
  return labels[status] || status
}
</script>

<style scoped>
.debug-log-viewer {
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.log-header h2 {
  font-size: 1.5rem;
  color: #1a202c;
}

.log-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-test {
  background: #667eea;
  color: white;
}

.btn-test:hover {
  background: #5568d3;
}

.btn-refresh {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-refresh:hover:not(:disabled) {
  background: #cbd5e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-refresh-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}

.log-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.log-filters select {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.empty-logs {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f7fafc;
}

.log-item.status-success {
  border-left: 4px solid #48bb78;
}

.log-item.status-error {
  border-left: 4px solid #f56565;
}

.log-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.log-time {
  color: #718096;
}

.log-component {
  font-weight: 600;
}

.component-GW {
  color: #667eea;
}

.component-WF {
  color: #48bb78;
}

.log-direction {
  font-size: 1rem;
}

.log-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-success {
  background: #c6f6d5;
  color: #22543d;
}

.status-error {
  background: #fed7d7;
  color: #742a2a;
}

.log-action {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.log-url {
  font-size: 0.875rem;
  color: #667eea;
  word-break: break-all;
}

.log-error {
  font-size: 0.875rem;
  color: #f56565;
  margin-top: 0.5rem;
}
</style>


