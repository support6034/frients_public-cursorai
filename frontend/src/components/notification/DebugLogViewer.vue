<template>
  <div class="debug-log-viewer mt-12">
    <div class="debug-log-header mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">GW/WF 디버그 로그</h2>
      <div class="debug-log-controls flex flex-wrap items-center gap-4 mb-4">
        <div class="test-buttons flex gap-2">
          <button
            class="test-btn test-btn-gw px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="handleGWTest"
            :disabled="loading"
          >
            🧪 GW 테스트
          </button>
          <button
            class="test-btn test-btn-wf px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            @click="handleWFTest"
            :disabled="loading"
          >
            🧪 WF 테스트
          </button>
        </div>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="autoRefresh"
            class="w-4 h-4"
          />
          자동 새로고침 (3초)
        </label>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          @click="loadLogs"
          :disabled="loading"
        >
          {{ loading ? '로딩 중...' : '새로고침' }}
        </button>
      </div>
    </div>

    <div class="debug-log-filters flex flex-wrap gap-4 mb-6">
      <select
        v-model="filters.component"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
        @change="loadLogs"
      >
        <option value="">전체 컴포넌트</option>
        <option value="GW">게이트웨이 (GW)</option>
        <option value="WF">워크플로우 (WF)</option>
      </select>

      <select
        v-model="filters.direction"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
        @change="loadLogs"
      >
        <option value="">전체 방향</option>
        <option value="IN">수신 (IN)</option>
        <option value="OUT">발신 (OUT)</option>
      </select>

      <select
        v-model.number="filters.limit"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
        @change="loadLogs"
      >
        <option :value="20">최근 20개</option>
        <option :value="50">최근 50개</option>
        <option :value="100">최근 100개</option>
        <option :value="200">최근 200개</option>
      </select>
    </div>

    <div class="debug-log-list">
      <div v-if="debugLogs.value.length === 0" class="empty-logs text-center py-8 text-gray-500">
        로그가 없습니다.
      </div>
      <div
        v-for="log in debugLogs.value"
        :key="log.id"
        :class="[
          'debug-log-item p-4 border rounded-lg mb-2',
          getStatusBadgeClass(log.status)
        ]"
      >
        <div class="log-header flex justify-between items-start mb-2">
          <div class="log-meta flex flex-wrap gap-2 text-sm text-gray-600">
            <span class="log-component font-semibold">{{ getComponentLabel(log.component) }}</span>
            <span class="log-direction">{{ getDirectionIcon(log.direction) }} {{ log.direction }}</span>
            <span class="log-time">{{ formatDateTime(log.createdAt || log.created_at) }}</span>
          </div>
          <span :class="['log-status px-2 py-1 rounded text-xs font-semibold', getStatusBadgeClass(log.status)]">
            {{ getStatusText(log.status) }}
          </span>
        </div>

        <div class="log-action mb-2">
          <strong class="text-gray-900">{{ getActionLabel(log.action) }}</strong>
        </div>

        <div v-if="log.url" class="log-url text-sm text-gray-600 mb-2">
          <strong>URL:</strong> {{ log.url }}
        </div>

        <div v-if="log.requestData" class="log-request text-sm mb-2">
          <details class="cursor-pointer">
            <summary class="text-gray-700 font-medium">요청 데이터</summary>
            <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{{ formatJSON(log.requestData) }}</pre>
          </details>
        </div>

        <div v-if="log.responseData" class="log-response text-sm mb-2">
          <details class="cursor-pointer">
            <summary class="text-gray-700 font-medium">응답 데이터</summary>
            <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{{ formatJSON(log.responseData) }}</pre>
          </details>
        </div>

        <div v-if="log.errorMessage" class="log-error text-sm text-red-600">
          <strong>오류:</strong> {{ log.errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification'
import api from '../../api'

const store = useNotificationStore()
const { debugLogs } = storeToRefs(store)

const { fetchDebugLogs } = store

const loading = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref(null)

const filters = ref({
  component: '',
  direction: '',
  limit: 50
})

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusBadgeClass = (status) => {
  if (status === 'success' || status === 'received') return 'border-green-200 bg-green-50'
  if (status === 'error') return 'border-red-200 bg-red-50'
  if (status === 'skipped') return 'border-yellow-200 bg-yellow-50'
  return 'border-gray-200 bg-gray-50'
}

const getStatusText = (status) => {
  const statusMap = {
    success: '✅ 성공',
    received: '📥 수신',
    error: '❌ 오류',
    skipped: '⏭️ 건너뜀'
  }
  return statusMap[status] || status
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

const formatJSON = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

const loadLogs = async () => {
  loading.value = true
  try {
    await fetchDebugLogs(filters.value)
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
    alert('GW 테스트 실패: ' + (error.response?.data?.error || error.message))
  }
}

const handleWFTest = async () => {
  try {
    const response = await api.post('/api/test/wf-gtm-event', {
      event: '결제완료',
      email: 'test@example.com',
      customerName: '테스트 고객',
      customerPhone: '010-1234-5678',
      orderId: `ORDER-${Date.now()}`,
      orderAmount: 50000
    })
    if (response.data.success) {
      alert('WF 테스트 완료!\nGTM 이벤트 수신 및 워크플로우 처리가 완료되었습니다.')
      loadLogs()
    }
  } catch (error) {
    alert('WF 테스트 실패: ' + (error.response?.data?.error || error.message))
  }
}

watch([() => filters.value.component, () => filters.value.direction, () => filters.value.limit], () => {
  loadLogs()
})

watch(autoRefresh, (newVal) => {
  if (newVal) {
    refreshInterval.value = setInterval(() => {
      loadLogs()
    }, 3000)
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }
})

onMounted(() => {
  loadLogs()
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(() => {
      loadLogs()
    }, 3000)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

