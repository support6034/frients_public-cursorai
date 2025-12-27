<template>
  <div class="workflow-list bg-white rounded-lg shadow p-4">
    <!-- Toolbar -->
    <div class="workflow-toolbar flex justify-between items-center mb-4 pb-4 border-b border-gray-200 flex-wrap gap-3">
      <div class="toolbar-filters flex gap-2 flex-wrap">
        <select
          v-model="statusFilter"
          class="filter-select px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white cursor-pointer focus:outline-none focus:border-indigo-500"
        >
          <option value="all">전체 상태</option>
          <option value="live">라이브</option>
          <option value="draft">초안</option>
        </select>

        <select
          v-model="selectedFolder"
          class="filter-select px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white cursor-pointer focus:outline-none focus:border-indigo-500"
        >
          <option value="all">전체 폴더</option>
          <option value="none">폴더 없음</option>
          <option v-for="folder in folders" :key="folder.id" :value="folder.id">
            {{ folder.name }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="text"
          class="search-input px-3 py-1.5 border border-gray-300 rounded-md text-xs min-w-[180px] focus:outline-none focus:border-indigo-500"
          placeholder="워크플로우 검색..."
        />
      </div>

      <div class="toolbar-actions flex gap-2">
        <button
          @click="showFolderModal = true"
          class="btn-secondary btn-sm px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50"
        >
          + 새 폴더
        </button>
      </div>
    </div>

    <!-- Table -->
    <div v-if="filteredWorkflows.length === 0" class="empty-state text-center py-12 text-gray-500">
      <p>워크플로우가 없습니다.</p>
    </div>

    <div v-else class="table-wrapper overflow-x-auto">
      <table class="workflow-table w-full border-collapse text-xs">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">폴더</th>
            <th
              @click="handleSort('name')"
              class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap cursor-pointer select-none hover:bg-gray-100"
            >
              이름 {{ sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓') }}
            </th>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">조건</th>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">액션</th>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">상태</th>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">리드수</th>
            <th
              @click="handleSort('created_at')"
              class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap cursor-pointer select-none hover:bg-gray-100"
            >
              생성일 {{ sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓') }}
            </th>
            <th class="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs uppercase whitespace-nowrap">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="workflow in filteredWorkflows"
            :key="workflow.id"
            class="hover:bg-gray-50"
          >
            <td class="px-3 py-2.5 border-b border-gray-100 text-gray-800 whitespace-nowrap">
              <span class="folder-badge inline-block px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                {{ getFolderName(workflow.folderId) }}
              </span>
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 text-gray-800 max-w-[180px]">
              <span class="workflow-name block overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                {{ workflow.name || '(이름 없음)' }}
              </span>
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 text-xs text-gray-500 whitespace-nowrap">
              {{ getConditionsSummary(workflow) }}
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 text-xs text-gray-500 whitespace-nowrap">
              {{ getActionsSummary(workflow) }}
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100">
              <span
                :class="getWorkflowLaunchedState(workflow) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                class="status-badge inline-block px-2 py-1 rounded text-xs font-semibold uppercase"
              >
                {{ getWorkflowLaunchedState(workflow) ? '라이브' : '초안' }}
              </span>
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 text-center">
              <span class="lead-count font-semibold text-indigo-600">
                {{ leadCounts[workflow.id] ?? '-' }}
              </span>
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 text-xs text-gray-500 whitespace-nowrap">
              {{ formatDate(workflow.createdAt) }}
            </td>
            <td class="px-3 py-2.5 border-b border-gray-100 whitespace-nowrap">
              <div class="actions-cell flex items-center gap-2">
                <!-- 버튼 그룹: 수정, 런칭/중지, 복제 -->
                <div class="action-buttons flex gap-1">
                  <button
                    @click="$emit('edit', workflow)"
                    class="btn-action btn-edit px-2 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-all"
                    title="수정"
                  >
                    수정
                  </button>
                  <button
                    v-if="getWorkflowLaunchedState(workflow)"
                    @click="handleStop(workflow.id)"
                    :disabled="launching[workflow.id]"
                    class="btn-action btn-stop px-2 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="중지"
                  >
                    {{ launching[workflow.id] ? '...' : '중지' }}
                  </button>
                  <button
                    v-else
                    @click="handleLaunch(workflow.id)"
                    :disabled="launching[workflow.id]"
                    class="btn-action btn-launch px-2 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="런칭"
                  >
                    {{ launching[workflow.id] ? '...' : '런칭' }}
                  </button>
                  <button
                    @click="handleDuplicate(workflow)"
                    class="btn-action btn-duplicate px-2 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-all"
                    title="복제"
                  >
                    복제
                  </button>
                </div>

                <!-- 드롭다운 메뉴: 목표, 폴더이동, 삭제 -->
                <div class="dropdown-container relative" ref="dropdownRef">
                  <button
                    @click="openDropdown === workflow.id ? (openDropdown = null) : (openDropdown = workflow.id)"
                    class="btn-action btn-more px-2 py-1.5 bg-slate-100 text-slate-600 rounded text-base leading-none hover:bg-gray-200 transition-all"
                  >
                    ⋯
                  </button>
                  <div
                    v-if="openDropdown === workflow.id"
                    class="dropdown-menu absolute right-0 top-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] py-1"
                  >
                    <button
                      @click="openGoalModal(workflow); openDropdown = null"
                      class="block w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      🎯 목표 설정
                    </button>
                    <button
                      @click="openMoveModal(workflow); openDropdown = null"
                      class="block w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      📁 폴더 이동
                    </button>
                    <button
                      @click="$emit('delete', workflow.id); openDropdown = null"
                      class="block w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Folder Modal -->
    <div
      v-if="showFolderModal"
      @click="showFolderModal = false"
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div @click.stop class="modal bg-white rounded-xl p-6 w-[400px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">새 폴더 만들기</h3>
        <div class="form-group mb-4">
          <label class="block font-medium mb-2 text-gray-700 text-sm">폴더 이름</label>
          <input
            v-model="newFolderName"
            type="text"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
            placeholder="폴더 이름"
          />
        </div>
        <div class="modal-actions flex gap-2 justify-end mt-6">
          <button
            @click="showFolderModal = false"
            class="btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            취소
          </button>
          <button
            @click="handleCreateFolder"
            class="btn-primary px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            생성
          </button>
        </div>
      </div>
    </div>

    <!-- Goal Modal -->
    <div
      v-if="showGoalModal && selectedWorkflow"
      @click="showGoalModal = false"
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div @click.stop class="modal bg-white rounded-xl p-6 w-[400px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">워크플로우 목표</h3>
        <div class="form-group mb-4">
          <label class="block font-medium mb-2 text-gray-700 text-sm">목표 유형</label>
          <select
            v-model="goalType"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="conversion">전환</option>
            <option value="signup">가입</option>
            <option value="engagement">참여</option>
          </select>
        </div>
        <div class="form-group mb-4">
          <label class="block font-medium mb-2 text-gray-700 text-sm">목표 수치</label>
          <input
            v-model.number="goalTarget"
            type="number"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
            min="0"
          />
        </div>
        <div v-if="selectedWorkflow && selectedWorkflow.goalTarget > 0" class="goal-progress mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="progress-bar h-2 bg-gray-200 rounded overflow-hidden mb-2">
            <div
              class="progress-fill h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all"
              :style="{ width: `${Math.min(100, (selectedWorkflow.goalCurrent / selectedWorkflow.goalTarget) * 100)}%` }"
            ></div>
          </div>
          <span class="progress-text text-xs text-gray-500 text-center block">
            {{ selectedWorkflow.goalCurrent }}/{{ selectedWorkflow.goalTarget }}
            ({{ Math.round((selectedWorkflow.goalCurrent / selectedWorkflow.goalTarget) * 100) }}%)
          </span>
        </div>
        <div class="modal-actions flex gap-2 justify-end mt-6">
          <button
            @click="showGoalModal = false"
            class="btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            취소
          </button>
          <button
            @click="handleSaveGoal"
            class="btn-primary px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- Move Folder Modal -->
    <div
      v-if="showMoveModal && selectedWorkflow"
      @click="showMoveModal = false"
      class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div @click.stop class="modal bg-white rounded-xl p-6 w-[400px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">폴더로 이동</h3>
        <div class="form-group mb-4">
          <label class="block font-medium mb-2 text-gray-700 text-sm">폴더 선택</label>
          <select
            v-model="targetFolderId"
            class="form-control w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
          >
            <option :value="null">폴더 없음</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
              {{ folder.name }}
            </option>
          </select>
        </div>
        <div class="modal-actions flex gap-2 justify-end mt-6">
          <button
            @click="showMoveModal = false"
            class="btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            취소
          </button>
          <button
            @click="handleMoveToFolder"
            class="btn-primary px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            이동
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import api from '../api'

const props = defineProps({
  workflows: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'refresh'])

const launching = ref({})
const folders = ref([])
const selectedFolder = ref('all')
const statusFilter = ref('all')
const searchQuery = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const showFolderModal = ref(false)
const showGoalModal = ref(false)
const showMoveModal = ref(false)
const selectedWorkflow = ref(null)
const newFolderName = ref('')
const goalType = ref('conversion')
const goalTarget = ref(0)
const targetFolderId = ref(null)
const leadCounts = ref({})
const openDropdown = ref(null)
const dropdownRef = ref(null)
const localWorkflowStates = ref({})

onMounted(async () => {
  await loadFolders()
  await loadLeadCounts()
  
  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

watch(() => props.workflows, async () => {
  await loadFolders()
  await loadLeadCounts()
})

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    openDropdown.value = null
  }
}

const loadLeadCounts = async () => {
  try {
    const counts = {}
    for (const workflow of props.workflows) {
      try {
        const response = await api.get(`/api/workflows/${workflow.id}/lead-count`)
        if (response.data.success) {
          counts[workflow.id] = response.data.count
        }
      } catch (error) {
        console.error(`리드수 로드 오류 (워크플로우 ${workflow.id}):`, error)
      }
    }
    leadCounts.value = counts
  } catch (error) {
    console.error('리드수 로드 오류:', error)
  }
}

const loadFolders = async () => {
  try {
    const response = await api.get('/api/folders')
    if (response.data.success) {
      folders.value = response.data.data || []
    }
  } catch (error) {
    console.error('폴더 로드 오류:', error)
    folders.value = []
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

const handleLaunch = async (id) => {
  try {
    launching.value = { ...launching.value, [id]: true }
    await api.post(`/api/workflows/${id}/launch`)
    localWorkflowStates.value = { ...localWorkflowStates.value, [id]: true }
    emit('refresh')
  } catch (error) {
    alert('런칭에 실패했습니다.')
  } finally {
    launching.value = { ...launching.value, [id]: false }
  }
}

const handleStop = async (id) => {
  try {
    launching.value = { ...launching.value, [id]: true }
    await api.post(`/api/workflows/${id}/stop`)
    localWorkflowStates.value = { ...localWorkflowStates.value, [id]: false }
    emit('refresh')
  } catch (error) {
    alert('중지에 실패했습니다.')
  } finally {
    launching.value = { ...launching.value, [id]: false }
  }
}

const getWorkflowLaunchedState = (workflow) => {
  if (localWorkflowStates.value.hasOwnProperty(workflow.id)) {
    return localWorkflowStates.value[workflow.id]
  }
  return workflow.isLaunched || false
}

const getFolderName = (folderId) => {
  if (!folderId) return '폴더 없음'
  const folder = folders.value.find(f => f.id === folderId)
  return folder ? folder.name : '알 수 없음'
}

const getConditionsSummary = (workflow) => {
  if (workflow.conditionGroups) {
    try {
      const groups = JSON.parse(workflow.conditionGroups)
      return `${groups.length}개 그룹`
    } catch (e) {
      return '-'
    }
  }
  if (workflow.conditions) {
    try {
      const conditions = JSON.parse(workflow.conditions)
      return `${conditions.length}개 조건`
    } catch (e) {
      return '-'
    }
  }
  return '-'
}

const getActionsSummary = (workflow) => {
  if (workflow.actions) {
    try {
      const actions = JSON.parse(workflow.actions)
      return `${actions.length}개 액션`
    } catch (e) {
      return '-'
    }
  }
  if (workflow.webhookUrl) {
    return '웹훅 1개'
  }
  return '-'
}

const handleSort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
}

const filteredWorkflows = computed(() => {
  let filtered = props.workflows.filter(w => {
    // 상태 필터
    if (statusFilter.value === 'live' && !getWorkflowLaunchedState(w)) return false
    if (statusFilter.value === 'draft' && getWorkflowLaunchedState(w)) return false
    
    // 폴더 필터
    if (selectedFolder.value !== 'all') {
      if (selectedFolder.value === 'none' && w.folderId) return false
      if (selectedFolder.value !== 'none' && w.folderId !== parseInt(selectedFolder.value)) return false
    }
    
    // 검색 필터
    if (searchQuery.value && !w.name?.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    
    return true
  })
  
  // 정렬
  filtered = [...filtered].sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]
    
    if (sortBy.value === 'created_at') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })
  
  return filtered
})

const handleCreateFolder = async () => {
  if (!newFolderName.value.trim()) {
    alert('폴더 이름을 입력해주세요.')
    return
  }
  
  try {
    const response = await api.post('/api/folders', { name: newFolderName.value.trim() })
    if (response.data.success) {
      await loadFolders()
      showFolderModal.value = false
      newFolderName.value = ''
    }
  } catch (error) {
    alert('폴더 생성에 실패했습니다.')
  }
}

const openGoalModal = (workflow) => {
  selectedWorkflow.value = workflow
  goalType.value = workflow.goalType || 'conversion'
  goalTarget.value = workflow.goalTarget || 0
  showGoalModal.value = true
}

const handleSaveGoal = async () => {
  if (!selectedWorkflow.value) return
  
  try {
    await api.put(`/api/workflows/${selectedWorkflow.value.id}/goal`, {
      goal_type: goalType.value,
      goal_target: goalTarget.value
    })
    showGoalModal.value = false
    selectedWorkflow.value = null
    emit('refresh')
  } catch (error) {
    alert('목표 설정에 실패했습니다.')
  }
}

const openMoveModal = (workflow) => {
  selectedWorkflow.value = workflow
  targetFolderId.value = workflow.folderId || null
  showMoveModal.value = true
}

const handleMoveToFolder = async () => {
  if (!selectedWorkflow.value) return
  
  try {
    await api.put(`/api/workflows/${selectedWorkflow.value.id}/folder`, {
      folder_id: targetFolderId.value
    })
    showMoveModal.value = false
    selectedWorkflow.value = null
    emit('refresh')
  } catch (error) {
    alert('폴더 이동에 실패했습니다.')
  }
}

const handleDuplicate = async (workflow) => {
  try {
    await api.post(`/api/workflows/${workflow.id}/duplicate`)
    emit('refresh')
  } catch (error) {
    alert('복제에 실패했습니다.')
  }
}
</script>

<style scoped>
.workflow-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>

