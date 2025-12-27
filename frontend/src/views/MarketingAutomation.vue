<template>
  <div class="marketing-automation min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">마케팅자동화</h1>
        <p class="text-gray-600">워크플로우를 생성하고 관리하세요</p>
      </div>

      <!-- 탭 메뉴 -->
      <div class="mb-6 border-b">
        <div class="flex space-x-4">
          <button
            :class="['px-4 py-2 border-b-2 transition-colors', activeTab === 'workflows' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
            @click="activeTab = 'workflows'"
          >
            워크플로우
          </button>
          <button
            :class="['px-4 py-2 border-b-2 transition-colors', activeTab === 'lists' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
            @click="activeTab = 'lists'"
          >
            리스트
          </button>
          <button
            :class="['px-4 py-2 border-b-2 transition-colors', activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900']"
            @click="activeTab = 'logs'"
          >
            로그
          </button>
        </div>
      </div>

      <!-- 워크플로우 탭 -->
      <div v-if="activeTab === 'workflows'">
        <div class="mb-4">
          <button 
            @click="handleCreateNew"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 워크플로우 만들기
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-600">로딩 중...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ error }}
        </div>

        <WorkflowList
          v-else
          :workflows="workflows"
          @edit="handleEdit"
          @delete="handleDelete"
          @refresh="loadWorkflows"
        />
      </div>

      <!-- 리스트 탭 -->
      <div v-if="activeTab === 'lists'">
        <ListManager />
      </div>

      <!-- 로그 탭 -->
      <div v-if="activeTab === 'logs'">
        <LogViewer />
      </div>
    </div>

    <!-- 워크플로우 편집기 모달 -->
    <WorkflowEditor
      v-if="showEditor"
      :workflow="editingWorkflow"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWorkflowStore } from '../stores/workflow'
import WorkflowEditor from '../components/WorkflowEditor.vue'
import WorkflowList from '../components/WorkflowList.vue'
import ListManager from './ListManager.vue'
import LogViewer from './LogViewer.vue'

const workflowStore = useWorkflowStore()
const workflows = ref([])
const loading = ref(false)
const error = ref(null)
const showEditor = ref(false)
const editingWorkflow = ref(null)
const activeTab = ref('workflows')

onMounted(async () => {
  await loadWorkflows()
})

const loadWorkflows = async () => {
  loading.value = true
  error.value = null
  try {
    await workflowStore.fetchWorkflows()
    workflows.value = workflowStore.workflows
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleCreateNew = () => {
  editingWorkflow.value = null
  showEditor.value = true
}

const handleEdit = (workflow) => {
  editingWorkflow.value = workflow
  showEditor.value = true
}

const handleSave = async () => {
  showEditor.value = false
  editingWorkflow.value = null
  await loadWorkflows()
}

const handleCancel = () => {
  showEditor.value = false
  editingWorkflow.value = null
}

const handleDelete = async (id) => {
  if (confirm('정말 삭제하시겠습니까?')) {
    try {
      await workflowStore.deleteWorkflow(id)
      await loadWorkflows()
    } catch (err) {
      error.value = err.message
    }
  }
}
</script>

