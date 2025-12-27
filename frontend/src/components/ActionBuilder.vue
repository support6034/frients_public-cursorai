<template>
  <div class="action-builder bg-white border rounded-lg p-6">
    <div v-if="actions.length === 0" class="text-center py-8 text-gray-500">
      <p>액션이 없습니다. 아래 버튼으로 액션을 추가하세요.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(action, index) in actions"
        :key="index"
        class="action-item border rounded p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-700">Step {{ index + 1 }}</span>
            <div class="flex gap-1">
              <button
                @click="moveAction(index, 'up')"
                :disabled="index === 0"
                class="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                ↑
              </button>
              <button
                @click="moveAction(index, 'down')"
                :disabled="index === actions.length - 1"
                class="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                ↓
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-700">
              {{ action.type === 'webhook' ? '🔗' : '📋' }}
              {{ action.type === 'webhook' ? '웹훅 발동' : '리스트 추가' }}
            </span>
            <button
              @click="toggleCollapse(index)"
              class="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {{ collapsedActions[index] ? '펼치기' : '접기' }}
            </button>
            <button
              @click="removeAction(index)"
              class="px-2 py-1 text-lg text-gray-600 hover:text-red-600"
              title="삭제"
            >
              ×
            </button>
          </div>
        </div>

        <div v-if="action.type === 'webhook' && !collapsedActions[index]" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">Webhook URL</label>
            <input
              v-model="action.webhook_url"
              @input="updateAction(index)"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="https://example.com/webhook"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">파라미터</label>
            <div class="space-y-2">
              <div
                v-for="(value, key) in action.webhook_params || {}"
                :key="key"
                class="flex space-x-2"
              >
                <input
                  :value="key"
                  @input="updateParamKey(index, key, $event.target.value)"
                  type="text"
                  class="flex-1 border rounded px-3 py-2"
                  placeholder="키"
                />
                <input
                  :value="value"
                  @input="updateParamValue(index, key, $event.target.value)"
                  type="text"
                  class="flex-1 border rounded px-3 py-2"
                  placeholder="값 (예: {{email}})"
                />
                <button
                  @click="removeParam(index, key)"
                  class="px-3 py-2 text-gray-600 hover:text-red-600 text-lg"
                  title="삭제"
                >
                  ×
                </button>
              </div>
              <button
                @click="addParam(index)"
                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                + 파라미터 추가
              </button>
            </div>
          </div>

          <!-- 웹훅 테스트 섹션 -->
          <div class="mt-4 pt-4 border-t">
            <h4 class="text-sm font-semibold mb-2">웹훅 테스트</h4>
            
            <!-- 이벤트 데이터 참조 -->
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">이벤트 데이터 참조</label>
              <select
                v-model="selectedEvent"
                @change="handleEventSelect"
                class="w-full border rounded px-3 py-2"
              >
                <option value="">-- 이벤트를 선택하세요 (선택사항) --</option>
                <option
                  v-for="event in availableEvents"
                  :key="event.event_name || event"
                  :value="event.event_name || event"
                >
                  {{ event.event_name || event }}
                </option>
              </select>
            </div>

            <!-- 테스트 리드 선택 -->
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">테스트 리드 선택</label>
              <button
                @click="showLeadSearchModal = true"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <span>🔍</span>
                <span>리드 검색 및 선택</span>
              </button>
              <div v-if="selectedLead" class="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <div class="text-sm font-medium text-green-800">선택된 리드:</div>
                <div class="text-xs text-green-700">
                  {{ selectedLead.leadEmail || selectedLead.lead_email }} 
                  ({{ selectedLead.firstName || selectedLead.first_name || '' }} 
                  {{ selectedLead.phoneNumber || selectedLead.phone_number || '' }})
                </div>
                <button
                  @click="selectedLead = null"
                  class="mt-1 text-xs text-green-600 hover:text-green-800"
                >
                  선택 해제
                </button>
              </div>
            </div>

            <!-- 테스트 버튼 -->
            <button
              @click="handleWebhookTest(index)"
              :disabled="isTesting || !action.webhook_url || !selectedLead"
              class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>🧪</span>
              <span>{{ isTesting ? '테스트 중...' : '웹훅 테스트 실행' }}</span>
            </button>

            <!-- 테스트 결과 -->
            <div v-if="testResult" class="mt-3 p-3 rounded" :class="testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="text-sm font-semibold" :class="testResult.success ? 'text-green-800' : 'text-red-800'">
                {{ testResult.success ? '테스트 성공!' : '테스트 실패' }}
              </div>
              <div v-if="testResult.error" class="text-xs text-red-700 mt-1">
                {{ testResult.error }}
              </div>
              <div v-if="testResult.details" class="text-xs text-red-600 mt-1">
                {{ JSON.stringify(testResult.details) }}
              </div>
              <div v-if="testResult.response" class="mt-2 text-xs">
                <div class="font-semibold">응답:</div>
                <pre class="whitespace-pre-wrap mt-1">{{ JSON.stringify(testResult.response, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="action.type === 'list' && !collapsedActions[index]" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">리스트 검색</label>
            <input
              v-model="listSearchQuery"
              type="text"
              class="w-full border rounded px-3 py-2 mb-2"
              placeholder="리스트 이름으로 검색..."
              @input="updateAction(index)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">리스트</label>
            <select
              v-model="action.list_id"
              @change="updateAction(index)"
              class="w-full border rounded px-3 py-2"
            >
              <option :value="null">리스트 선택</option>
              <option
                v-for="list in filteredLists"
                :key="list.id"
                :value="list.id"
              >
                {{ list.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 리드 검색 모달 -->
    <div
      v-if="showLeadSearchModal"
      @click="showLeadSearchModal = false"
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div @click.stop class="modal bg-white rounded-xl p-6 w-[600px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">리드 검색 및 선택</h3>

        <div class="mb-4">
          <div class="flex gap-2">
            <input
              v-model="leadSearchQuery"
              type="text"
              class="flex-1 border rounded px-3 py-2"
              placeholder="이메일, 이름, 전화번호로 검색..."
              @keyup.enter="searchLeads"
            />
            <button
              @click="searchLeads"
              :disabled="isSearching"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isSearching ? '검색 중...' : '검색' }}
            </button>
          </div>
        </div>

        <div v-if="searchResults.length > 0" class="border rounded p-2 max-h-60 overflow-y-auto mb-4">
          <div
            v-for="lead in searchResults"
            :key="lead.leadEmail || lead.lead_email"
            @click="selectLead(lead); showLeadSearchModal = false"
            class="p-2 hover:bg-gray-100 cursor-pointer rounded"
          >
            <div class="text-sm font-medium">{{ lead.leadEmail || lead.lead_email }}</div>
            <div class="text-xs text-gray-600">
              {{ lead.firstName || lead.first_name || '' }}
              {{ lead.phoneNumber || lead.phone_number || '' }}
            </div>
          </div>
        </div>

        <div v-else-if="leadSearchQuery && !isSearching" class="text-center py-8 text-gray-500 mb-4">
          검색 결과가 없습니다.
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="showLeadSearchModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 flex space-x-2">
      <button
        @click="addAction('list')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <span>📋</span>
        <span>리스트 추가</span>
      </button>
      <button
        @click="addAction('webhook')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <span>🔗</span>
        <span>웹훅발동 추가</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const props = defineProps({
  actions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:actions'])

const lists = ref([])
const listSearchQuery = ref('')
const showLeadSearchModal = ref(false)
const leadSearchQuery = ref('')
const searchResults = ref([])
const selectedLead = ref(null)
const isSearching = ref(false)
const isTesting = ref(false)
const testResult = ref(null)
const availableEvents = ref([])
const selectedEvent = ref('')
const eventData = ref(null)
const collapsedActions = ref({})

const filteredLists = computed(() => {
  if (!listSearchQuery.value.trim()) {
    return lists.value
  }
  const query = listSearchQuery.value.toLowerCase()
  return lists.value.filter(list => 
    list.name.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await loadLists()
  await loadAvailableEvents()
})

const loadLists = async () => {
  try {
    const response = await api.get('/api/lists')
    if (response.data.success) {
      lists.value = response.data.data
    }
  } catch (error) {
    console.error('리스트 로드 오류:', error)
  }
}

const addAction = (type) => {
  const newAction = type === 'webhook'
    ? { step: props.actions.length + 1, type: 'webhook', webhook_url: '', webhook_params: {} }
    : { step: props.actions.length + 1, type: 'list', list_id: null }
  
  emit('update:actions', [...props.actions, newAction])
}

const updateAction = (index) => {
  emit('update:actions', [...props.actions])
}

const removeAction = (index) => {
  const newActions = props.actions.filter((_, i) => i !== index)
  emit('update:actions', newActions)
}

const moveAction = (index, direction) => {
  const newActions = [...props.actions]
  if (direction === 'up' && index > 0) {
    [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]]
  } else if (direction === 'down' && index < newActions.length - 1) {
    [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]]
  }
  emit('update:actions', newActions)
}

const toggleCollapse = (index) => {
  collapsedActions.value[index] = !collapsedActions.value[index]
}

const addParam = (actionIndex) => {
  const action = props.actions[actionIndex]
  if (!action.webhook_params) {
    action.webhook_params = {}
  }
  const newKey = `param${Object.keys(action.webhook_params).length + 1}`
  action.webhook_params[newKey] = ''
  updateAction(actionIndex)
}

const updateParamKey = (actionIndex, oldKey, newKey) => {
  const action = props.actions[actionIndex]
  const value = action.webhook_params[oldKey]
  delete action.webhook_params[oldKey]
  action.webhook_params[newKey] = value
  updateAction(actionIndex)
}

const updateParamValue = (actionIndex, key, value) => {
  const action = props.actions[actionIndex]
  action.webhook_params[key] = value
  updateAction(actionIndex)
}

const removeParam = (actionIndex, key) => {
  const action = props.actions[actionIndex]
  delete action.webhook_params[key]
  updateAction(actionIndex)
}

const loadAvailableEvents = async () => {
  try {
    // 원본은 /api/events에서 이벤트 이름 목록을 반환하지만, 신규는 /api/events/distinct 사용
    const response = await api.get('/api/events/distinct')
    if (response.data.success) {
      // 문자열 배열이면 그대로 사용, 객체 배열이면 event_name 추출
      const events = response.data.data || []
      availableEvents.value = events.map(e => typeof e === 'string' ? e : (e.event_name || e))
    }
  } catch (error) {
    console.error('이벤트 목록 로드 오류:', error)
    availableEvents.value = []
  }
}

const loadEventData = async (eventName) => {
  if (!eventName) {
    eventData.value = null
    return
  }
  try {
    const response = await api.get('/api/event-logs')
    if (response.data.success) {
      const events = response.data.data || []
      // 해당 이벤트 이름과 일치하는 가장 최근 이벤트 찾기
      const event = events.find(e => {
        const name = e.event_name || e.eventName || ''
        return name === eventName
      })
      if (event) {
        // event_data가 문자열이면 파싱, 객체면 그대로 사용
        const data = event.event_data || event.eventData
        if (typeof data === 'string') {
          try {
            eventData.value = JSON.parse(data)
          } catch (e) {
            eventData.value = {}
          }
        } else {
          eventData.value = data || {}
        }
      } else {
        eventData.value = null
      }
    }
  } catch (error) {
    console.error('이벤트 데이터 로드 오류:', error)
    eventData.value = null
  }
}

const handleEventSelect = (event) => {
  selectedEvent.value = event.target.value
  loadEventData(event.target.value)
}

const searchLeads = async () => {
  if (!leadSearchQuery.value.trim()) return

  isSearching.value = true
  try {
    const results = []
    for (const list of lists.value) {
      try {
        const response = await api.get(`/api/lists/${list.id}/members`)
        if (response.data.success) {
          const matchingLeads = response.data.data.filter(lead => {
            const email = (lead.leadEmail || lead.lead_email || '').toLowerCase()
            const firstName = (lead.firstName || lead.first_name || '').toLowerCase()
            const phoneNumber = (lead.phoneNumber || lead.phone_number || '')
            const query = leadSearchQuery.value.toLowerCase()
            
            return email.includes(query) || 
                   firstName.includes(query) || 
                   phoneNumber.includes(leadSearchQuery.value)
          })
          matchingLeads.forEach(lead => {
            const email = lead.leadEmail || lead.lead_email
            if (!results.find(r => (r.leadEmail || r.lead_email) === email)) {
              results.push({ ...lead, list_name: list.name })
            }
          })
        }
      } catch (error) {
        console.error(`리스트 ${list.id} 검색 오류:`, error)
      }
    }
    searchResults.value = results
  } catch (error) {
    console.error('리드 검색 오류:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const selectLead = (lead) => {
  selectedLead.value = lead
  searchResults.value = []
  leadSearchQuery.value = ''
}

const handleWebhookTest = async (actionIndex) => {
  const action = props.actions[actionIndex]
  if (!action || !action.webhook_url) {
    testResult.value = { success: false, error: 'Webhook URL이 설정되지 않았습니다.' }
    return
  }

  if (!selectedLead.value) {
    testResult.value = { success: false, error: '테스트할 리드를 선택하세요.' }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    // 리드 데이터로 웹훅 테스트
    const testData = {
      email: selectedLead.value.leadEmail || selectedLead.value.lead_email,
      first_name: selectedLead.value.firstName || selectedLead.value.first_name || '',
      phone_number: selectedLead.value.phoneNumber || selectedLead.value.phone_number || '',
      ...(selectedLead.value.leadData ? (typeof selectedLead.value.leadData === 'string' ? JSON.parse(selectedLead.value.leadData) : selectedLead.value.leadData) : {}),
      ...(eventData.value || {})
    }

    const response = await api.post('/api/webhook-test', {
      webhook_url: action.webhook_url,
      webhook_params: action.webhook_params || {},
      testData
    })

    testResult.value = {
      success: true,
      message: '웹훅 테스트 성공!',
      response: response.data.response || response.data
    }
  } catch (error) {
    testResult.value = {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details
    }
  } finally {
    isTesting.value = false
  }
}
</script>

