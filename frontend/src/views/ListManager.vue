<template>
  <div class="list-manager min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">리스트 관리</h2>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + 새 리스트
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-600">로딩 중...</p>
        </div>

        <div v-else-if="lists.length === 0" class="text-center py-12 text-gray-500">
          리스트가 없습니다. 새 리스트를 만들어보세요.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="list in lists"
            :key="list.id"
            @click="handleListClick(list)"
            class="list-card bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ list.name }}</h3>
            </div>
            <p class="text-sm text-gray-600 mb-4">{{ list.description || '설명 없음' }}</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">목표: {{ list.goal_count || 0 }}명</span>
              <span class="text-blue-600">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 리스트 생성 모달 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showCreateModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">새 리스트 만들기</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">리스트 이름</label>
            <input
              v-model="newListName"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="예: VIP 고객"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">설명</label>
            <textarea
              v-model="newListDescription"
              class="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="리스트에 대한 설명을 입력하세요"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="createList"
            :disabled="!newListName.trim() || creating"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ creating ? '생성 중...' : '생성' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useListStore } from '../stores/list'
import api from '../api'

const router = useRouter()
const listStore = useListStore()

const lists = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const newListName = ref('')
const newListDescription = ref('')
const creating = ref(false)

onMounted(async () => {
  await loadLists()
})

const loadLists = async () => {
  loading.value = true
  try {
    await listStore.fetchLists()
    lists.value = listStore.lists
  } catch (error) {
    console.error('리스트 로드 오류:', error)
  } finally {
    loading.value = false
  }
}

const createList = async () => {
  if (!newListName.value.trim()) return
  
  creating.value = true
  try {
    await listStore.createList({
      name: newListName.value,
      description: newListDescription.value
    })
    await loadLists()
    showCreateModal.value = false
    newListName.value = ''
    newListDescription.value = ''
  } catch (error) {
    alert('리스트 생성 실패: ' + (error.response?.data?.error || error.message))
  } finally {
    creating.value = false
  }
}

const handleListClick = (list) => {
  router.push({ name: 'list-detail', params: { id: list.id } })
}
</script>

