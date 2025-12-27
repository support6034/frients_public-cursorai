<template>
  <div class="condition-builder bg-white border rounded-lg p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">조건 설정</h3>
    </div>

    <div v-if="conditionGroups.length === 0" class="text-center py-8 text-gray-500">
      <p>조건 그룹이 없습니다. 아래 버튼으로 그룹을 추가하세요.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(group, index) in conditionGroups"
        :key="group.id || index"
      >
        <div v-if="index > 0" class="my-4 flex justify-center">
          <LogicToggle
            :value="groupLogic"
            @update:value="(val) => $emit('update:groupLogic', val)"
          />
        </div>
        <ConditionGroup
          :group="group"
          :group-index="index"
          :lists="lists"
          :is-only="conditionGroups.length === 1"
          @update="(updated) => updateGroup(index, updated)"
          @remove="() => removeGroup(index)"
        />
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        @click="addGroup"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + 새 그룹 추가
      </button>
    </div>

    <!-- 조건 설정 옵션 버튼 및 패널 -->
    <div class="mt-4">
      <button
        @click="showSettings = !showSettings"
        class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span>{{ showSettings ? '▼' : '▶' }}</span>
        <span>조건 설정</span>
      </button>

      <!-- 설정 패널 -->
      <div v-if="showSettings" class="mt-3 pt-3 border-t space-y-3">
        <div class="space-y-2">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              :checked="conditionSettings.addCurrentLeads"
              @change="updateSetting('addCurrentLeads', $event.target.checked)"
              class="mt-1 mr-2"
            />
            <div class="flex-1">
              <span class="text-sm text-gray-700">현재 이 조건들을 충족시키는 리드를 워크플로우에 더하기</span>
              <button
                v-if="conditionGroups.length > 0"
                @click="loadMatchingLeads"
                :disabled="loadingLeads"
                class="ml-2 text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                현재 몇 명의 리드가 이 조건을 충족시키는지 확인하기
              </button>
            </div>
          </label>
        </div>

        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="conditionSettings.onlyFirstTime"
            @change="updateSetting('onlyFirstTime', $event.target.checked)"
            class="mr-2"
          />
          <span class="text-sm text-gray-700">리드가 최초로 조건을 충족시킬 때만 워크플로우에 더하기</span>
        </label>

        <div class="space-y-1">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              :checked="conditionSettings.enableGoal"
              @change="updateSetting('enableGoal', $event.target.checked)"
              class="mt-1 mr-2"
            />
            <div class="flex-1">
              <span class="text-sm text-gray-700">목표 설정하기</span>
              <p class="text-xs text-gray-500 mt-1">목표를 사용하여 워크플로우의 성공 여부를 판단하기</p>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- 조건을 만족하는 리드 모달 -->
    <div
      v-if="showLeadsModal"
      @click="showLeadsModal = false"
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div @click.stop class="modal bg-white rounded-xl p-6 w-[800px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">조건을 만족하는 리드</h3>
        <div v-if="loadingLeads" class="text-center py-8 text-gray-500">
          조회 중...
        </div>
        <div v-else-if="matchingLeads.length === 0" class="text-center py-8 text-gray-500">
          조건을 만족하는 리드가 없습니다.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left border-b border-gray-200 font-semibold text-gray-700">이메일</th>
                <th class="px-4 py-2 text-left border-b border-gray-200 font-semibold text-gray-700">이름</th>
                <th class="px-4 py-2 text-left border-b border-gray-200 font-semibold text-gray-700">휴대폰</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lead in matchingLeads"
                :key="lead.leadEmail || lead.lead_email"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-2 border-b border-gray-100 text-gray-800">
                  {{ lead.leadEmail || lead.lead_email }}
                </td>
                <td class="px-4 py-2 border-b border-gray-100 text-gray-800">
                  {{ lead.firstName || lead.first_name || '-' }}
                </td>
                <td class="px-4 py-2 border-b border-gray-100 text-gray-800">
                  {{ lead.phoneNumber || lead.phone_number || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 text-sm text-gray-600">
            총 {{ matchingLeads.length }}개의 리드가 조건을 만족합니다.
          </div>
        </div>
        <div class="modal-actions flex justify-end mt-6">
          <button
            @click="showLeadsModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ConditionGroup from './ConditionGroup.vue'
import LogicToggle from './LogicToggle.vue'
import api from '../api'

const props = defineProps({
  conditionGroups: {
    type: Array,
    default: () => []
  },
  groupLogic: {
    type: String,
    default: 'AND'
  },
  conditionSettings: {
    type: Object,
    default: () => ({ addCurrentLeads: false, onlyFirstTime: true, enableGoal: false })
  }
})

const emit = defineEmits(['update:conditionGroups', 'update:groupLogic', 'update:conditionSettings', 'open-goal-modal'])

const showSettings = ref(false)
const lists = ref([])
const showLeadsModal = ref(false)
const matchingLeads = ref([])
const loadingLeads = ref(false)

onMounted(async () => {
  await loadLists()
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

const addGroup = () => {
  const newGroup = {
    id: Date.now(),
    logic: 'AND',
    conditions: []
  }
  emit('update:conditionGroups', [...props.conditionGroups, newGroup])
}

const updateGroup = (index, updated) => {
  const newGroups = [...props.conditionGroups]
  newGroups[index] = updated
  emit('update:conditionGroups', newGroups)
}

const removeGroup = (index) => {
  const newGroups = props.conditionGroups.filter((_, i) => i !== index)
  emit('update:conditionGroups', newGroups)
}

const updateSetting = (key, value) => {
  emit('update:conditionSettings', {
    ...props.conditionSettings,
    [key]: value
  })
}

// 조건을 만족하는 리드 조회
const loadMatchingLeads = async () => {
  loadingLeads.value = true
  try {
    // 리스트 조건에서 리드 가져오기
    const listIds = []
    props.conditionGroups.forEach(group => {
      (group.conditions || []).forEach(cond => {
        if (cond.type === 'list' && cond.list_id) {
          listIds.push(cond.list_id)
        }
      })
    })

    if (listIds.length > 0) {
      const leads = []
      for (const listId of listIds) {
        try {
          const response = await api.get(`/api/lists/${listId}/members`)
          if (response.data.success) {
            leads.push(...response.data.data)
          }
        } catch (error) {
          console.error(`리스트 ${listId} 멤버 조회 오류:`, error)
        }
      }
      // 중복 제거
      const uniqueLeads = leads.reduce((acc, lead) => {
        const email = lead.leadEmail || lead.lead_email
        if (!acc.find(l => (l.leadEmail || l.lead_email) === email)) {
          acc.push(lead)
        }
        return acc
      }, [])
      matchingLeads.value = uniqueLeads
    } else {
      matchingLeads.value = []
    }
  } catch (error) {
    console.error('리드 조회 오류:', error)
    matchingLeads.value = []
  } finally {
    loadingLeads.value = false
    showLeadsModal.value = true
  }
}
</script>

