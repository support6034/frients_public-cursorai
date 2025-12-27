<template>
  <div class="list-dashboard min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <!-- 헤더 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.back()"
              class="text-gray-600 hover:text-gray-900"
            >
              ◀ 뒤로
            </button>
            <h2 class="text-2xl font-bold text-gray-900">{{ list.name }}</h2>
          </div>
          <div class="flex space-x-2">
            <button
              @click="showRenameModal = true"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              이름수정
            </button>
            <button
              @click="handleDeleteList"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>

        <!-- 목표 섹션 -->
        <div class="mb-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span class="text-gray-700">
            목표: {{ list.goal_count > 0 ? `${list.goal_count}명` : '설정안됨' }}
          </span>
          <button
            @click="showGoalModal = true"
            class="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            수정
          </button>
        </div>

        <!-- 액션 버튼 -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex space-x-2">
            <button
              @click="showImportModal = true"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              리드 불러오기
            </button>
            <button
              @click="handleExport"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              리드 내보내기
            </button>
            <button
              @click="showAddModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + 리드 추가
            </button>
          </div>
          <div class="text-sm text-gray-600">
            전체 리드: {{ members.length }}명
          </div>
        </div>

        <!-- 멤버 목록 -->
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-600">로딩 중...</p>
        </div>

        <div v-else-if="members.length === 0" class="text-center py-12 text-gray-500">
          리드가 없습니다.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input type="checkbox" class="rounded" />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">휴대폰</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">추가일</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="member in members" :key="member.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(member.id)"
                    @change="toggleMember(member.id)"
                    class="rounded"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ member.lead_email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ member.first_name || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ member.phone_number || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(member.added_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 리스트 이름 수정 모달 -->
    <div
      v-if="showRenameModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showRenameModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">리스트 이름 수정</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">이름</label>
            <input
              v-model="renameName"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="리스트 이름"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showRenameModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleRename"
            :disabled="!renameName.trim() || renaming"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ renaming ? '수정 중...' : '수정' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 멤버 추가 모달 -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAddModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">리드 추가</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">이메일 *</label>
            <input
              v-model="newMember.email"
              type="email"
              class="w-full border rounded px-3 py-2"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">이름</label>
            <input
              v-model="newMember.first_name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">전화번호</label>
            <input
              v-model="newMember.phone_number"
              type="tel"
              class="w-full border rounded px-3 py-2"
              placeholder="010-1234-5678"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleAddMember"
            :disabled="!newMember.email.trim() || adding"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ adding ? '추가 중...' : '추가' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 멤버 수정 모달 -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showEditModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">멤버 수정</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">이메일</label>
            <input
              :value="editingMember.email"
              disabled
              type="email"
              class="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">이름</label>
            <input
              v-model="editingMember.first_name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">전화번호</label>
            <input
              v-model="editingMember.phone_number"
              type="tel"
              class="w-full border rounded px-3 py-2"
              placeholder="010-1234-5678"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showEditModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleUpdateMember"
            :disabled="editing"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ editing ? '수정 중...' : '수정' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CSV 가져오기 모달 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showImportModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">CSV 가져오기</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">CSV 파일 선택</label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".csv"
              @change="handleFileSelect"
              class="w-full border rounded px-3 py-2"
            />
            <p class="text-xs text-gray-500 mt-1">
              CSV 형식: 이메일, 이름, 휴대폰, 추가일 (첫 번째 줄은 헤더)
            </p>
          </div>
          
          <div v-if="importData.length > 0" class="border rounded p-4">
            <div class="text-sm font-semibold mb-2">
              가져올 데이터 ({{ importData.length }}개)
            </div>
            <div class="max-h-60 overflow-y-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-2 py-1 text-left border-b">이메일</th>
                    <th class="px-2 py-1 text-left border-b">이름</th>
                    <th class="px-2 py-1 text-left border-b">휴대폰</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in importData.slice(0, 10)" :key="idx" class="border-b">
                    <td class="px-2 py-1">{{ row.email }}</td>
                    <td class="px-2 py-1">{{ row.first_name || '-' }}</td>
                    <td class="px-2 py-1">{{ row.phone_number || '-' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="importData.length > 10" class="text-xs text-gray-500 mt-2 text-center">
                ... 외 {{ importData.length - 10 }}개 더
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showImportModal = false; importData = []"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleImport"
            :disabled="importData.length === 0 || importing"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ importing ? '가져오는 중...' : `가져오기 (${importData.length}개)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- 목표 설정 모달 -->
    <div
      v-if="showGoalModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showGoalModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">목표 설정</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">목표 리드 수</label>
            <input
              v-model.number="goalCount"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">목표 설명 (선택사항)</label>
            <input
              v-model="goalDescription"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="목표 설명을 입력하세요"
            />
          </div>
          <div v-if="list.goal_count > 0" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="text-sm font-semibold mb-2">진행률</div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all"
                :style="{ width: `${Math.min(100, (members.length / list.goal_count) * 100)}%` }"
              ></div>
            </div>
            <div class="text-xs text-gray-600 text-center">
              {{ members.length }} / {{ list.goal_count }}명
              ({{ Math.round((members.length / list.goal_count) * 100) }}%)
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showGoalModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleGoalSave"
            :disabled="savingGoal"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ savingGoal ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListStore } from '../stores/list'
import api from '../api'

const route = useRoute()
const router = useRouter()
const listStore = useListStore()

const list = ref({})
const members = ref([])
const loading = ref(false)
const adding = ref(false)
const editing = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const showGoalModal = ref(false)
const showRenameModal = ref(false)
const selectedIds = ref(new Set())
const renaming = ref(false)
const renameName = ref('')
const newMember = ref({
  email: '',
  first_name: '',
  phone_number: ''
})
const editingMember = ref({
  email: '',
  first_name: '',
  phone_number: ''
})
const editingMemberEmail = ref('')
const importData = ref([])
const importing = ref(false)
const goalCount = ref(0)
const goalDescription = ref('')
const savingGoal = ref(false)
const fileInputRef = ref(null)

onMounted(async () => {
  await loadList()
  await loadMembers()
})

const loadList = async () => {
  try {
    const listId = route.params.id
    const response = await api.get(`/api/lists/${listId}`)
    if (response.data.success) {
      list.value = response.data.data
      goalCount.value = list.value.goalCount || list.value.goal_count || 0
      goalDescription.value = list.value.goalDescription || list.value.goal_description || ''
      renameName.value = list.value.name || ''
    }
  } catch (error) {
    console.error('리스트 로드 오류:', error)
  }
}

const loadMembers = async () => {
  loading.value = true
  try {
    const listId = route.params.id
    const response = await api.get(`/api/lists/${listId}/members`)
    if (response.data.success) {
      members.value = response.data.data
    }
  } catch (error) {
    console.error('멤버 로드 오류:', error)
  } finally {
    loading.value = false
  }
}

const handleAddMember = async () => {
  if (!newMember.value.email.trim()) {
    alert('이메일은 필수입니다.')
    return
  }
  
  adding.value = true
  try {
    const listId = route.params.id
    await api.post(`/api/lists/${listId}/members`, newMember.value)
    await loadMembers()
    newMember.value = { email: '', first_name: '', phone_number: '' }
    showAddModal.value = false
    await listStore.fetchLists()
  } catch (error) {
    alert('멤버 추가 실패: ' + (error.response?.data?.error || error.message))
  } finally {
    adding.value = false
  }
}

const handleRename = async () => {
  if (!renameName.value.trim()) {
    alert('리스트 이름을 입력하세요.')
    return
  }
  
  renaming.value = true
  try {
    const listId = route.params.id
    await api.put(`/api/lists/${listId}`, {
      name: renameName.value.trim()
    })
    await loadList()
    showRenameModal.value = false
    await listStore.fetchLists()
  } catch (error) {
    alert('이름 수정 실패: ' + (error.response?.data?.error || error.message))
  } finally {
    renaming.value = false
  }
}

const handleDeleteList = async () => {
  if (!confirm('정말 이 리스트를 삭제하시겠습니까?')) return
  
  try {
    const listId = route.params.id
    await api.delete(`/api/lists/${listId}`)
    await listStore.fetchLists()
    router.push('/lists')
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

const handleDeleteMember = async (email) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    const listId = route.params.id
    await api.delete(`/api/lists/${listId}/members/${encodeURIComponent(email)}`)
    await loadMembers()
    await listStore.fetchLists()
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

const handleDeleteSelected = async () => {
  if (selectedIds.value.size === 0) return
  if (!confirm(`선택한 ${selectedIds.value.size}명의 리드를 삭제하시겠습니까?`)) return
  
  try {
    const listId = route.params.id
    const emails = members.value
      .filter(m => selectedIds.value.has(m.id))
      .map(m => m.lead_email)
    
    await api.delete(`/api/lists/${listId}/members`, { data: { emails } })
    
    await loadMembers()
    selectedIds.value.clear()
    await listStore.fetchLists()
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

const toggleMember = (id) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.size === members.value.length) {
    selectedIds.value.clear()
  } else {
    members.value.forEach(m => selectedIds.value.add(m.id))
  }
}

const handleExport = () => {
  const listId = route.params.id
  window.open(`/api/lists/${listId}/export`, '_blank')
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target.result
    const lines = text.split('\n').filter(line => line.trim())
    const data = []

    // 첫 번째 줄은 헤더이므로 건너뜀
    lines.slice(1).forEach(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim())
      if (values[0]) {
        data.push({
          email: values[0],
          first_name: values[1] || '',
          phone_number: values[2] || ''
        })
      }
    })

    importData.value = data
  }
  reader.readAsText(file, 'UTF-8')
  e.target.value = ''
}

const handleImport = async () => {
  if (importData.value.length === 0) return
  
  importing.value = true
  try {
    const listId = route.params.id
    const response = await api.post(`/api/lists/${listId}/import`, { data: importData.value })
    if (response.data.success) {
      alert(`${response.data.imported}명 가져오기 완료${response.data.errors > 0 ? ` (${response.data.errors}개 실패)` : ''}`)
      await loadMembers()
      await loadList()
      importData.value = []
      showImportModal.value = false
      await listStore.fetchLists()
    }
  } catch (error) {
    alert('가져오기 실패: ' + (error.response?.data?.error || error.message))
  } finally {
    importing.value = false
  }
}

const handleGoalSave = async () => {
  savingGoal.value = true
  try {
    const listId = route.params.id
    await api.put(`/api/lists/${listId}/goal`, {
      goal_count: goalCount.value,
      goal_description: goalDescription.value || ''
    })
    await loadList()
    showGoalModal.value = false
    await listStore.fetchLists()
  } catch (error) {
    alert('목표 저장 실패: ' + (error.response?.data?.error || error.message))
  } finally {
    savingGoal.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}
</script>

