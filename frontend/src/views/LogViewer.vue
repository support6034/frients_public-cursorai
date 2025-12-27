<template>
  <div class="log-viewer min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">로그 뷰어</h2>
          <button
            @click="loadLogs"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ loading ? '로딩...' : '새로고침' }}
          </button>
        </div>

        <div class="border-b mb-4">
          <div class="flex space-x-4">
            <button
              :class="['px-4 py-2 border-b-2 transition-colors', activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
              @click="activeTab = 'events'"
            >
              GTM 수신 이벤트 ({{ eventLogs.length }})
            </button>
            <button
              :class="['px-4 py-2 border-b-2 transition-colors', activeTab === 'executions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
              @click="activeTab = 'executions'"
            >
              웹훅 발송 로그 ({{ executionLogs.length }})
            </button>
          </div>
        </div>

        <div class="log-content">
          <!-- 이벤트 로그 -->
          <div v-if="activeTab === 'events'" class="overflow-x-auto">
            <table v-if="eventLogs.length > 0" class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이벤트명</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">데이터</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="log in eventLogs" :key="log.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(log.received_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ log.event_name }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{{ formatJson(log.event_data) }}</pre>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-center py-12 text-gray-500">
              수신된 이벤트가 없습니다.
            </div>
          </div>

          <!-- 실행 로그 -->
          <div v-if="activeTab === 'executions'" class="overflow-x-auto">
            <table v-if="executionLogs.length > 0" class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">워크플로우 ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">응답</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="log in executionLogs" :key="log.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(log.executed_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ log.workflow_id }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['px-2 py-1 rounded text-xs font-medium', 
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                      {{ log.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{{ formatJson(log.webhook_response) }}</pre>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-center py-12 text-gray-500">
              실행 로그가 없습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const activeTab = ref('events')
const eventLogs = ref([])
const executionLogs = ref([])
const loading = ref(false)

onMounted(async () => {
  await loadLogs()
})

const loadLogs = async () => {
  loading.value = true
  try {
    const [eventsRes, executionsRes] = await Promise.all([
      api.get('/api/event-logs?limit=50'),
      api.get('/api/execution-logs?limit=50')
    ])

    if (eventsRes.data.success) {
      eventLogs.value = eventsRes.data.data
    }
    if (executionsRes.data.success) {
      executionLogs.value = executionsRes.data.data
    }
  } catch (error) {
    console.error('로그 로드 오류:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR')
}

const formatJson = (data) => {
  if (!data) return ''
  try {
    if (typeof data === 'string') {
      return JSON.stringify(JSON.parse(data), null, 2)
    }
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

