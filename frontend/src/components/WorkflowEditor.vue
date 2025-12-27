<template>
  <div class="workflow-editor fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
      <!-- 헤더 -->
      <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">{{ workflow ? '워크플로우 수정' : '새 워크플로우' }}</h2>
        <div class="flex space-x-2">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>

      <!-- 본문 -->
      <div class="p-6 space-y-6">
        <!-- 워크플로우 이름 -->
        <div>
          <label class="block text-sm font-medium mb-2">워크플로우 이름</label>
          <input
            v-model="name"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="예: 주문완료 알림톡 발송"
          />
        </div>

        <!-- 조건 빌더 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-gray-700">1</span>
            <span class="text-lg font-semibold text-gray-700">조건</span>
          </div>
          <ConditionBuilder
            :condition-groups="conditionGroups"
            :group-logic="groupLogic"
            :condition-settings="conditionSettings"
            @update:condition-groups="conditionGroups = $event"
            @update:group-logic="groupLogic = $event"
            @update:condition-settings="conditionSettings = $event"
            @open-goal-modal="showGoalModal = true"
          />
        </div>

        <!-- 액션 빌더 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-gray-700">2</span>
            <span class="text-lg font-semibold text-gray-700">액션</span>
            <span class="text-sm text-gray-500">순차 실행</span>
          </div>
          <ActionBuilder
            :actions="actions"
            @update:actions="actions = $event"
          />
        </div>
      </div>
    </div>

    <!-- 목표 설정 모달 -->
    <div
      v-if="showGoalModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
      @click="showGoalModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4"
        @click.stop
      >
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h3 class="text-lg font-semibold">목표 조건 설정</h3>
          <button
            @click="showGoalModal = false"
            class="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">
            리드가 아래 목표 조건을 충족하면 워크플로우의 액션을 더 이상 수행하지 않습니다.
          </p>

          <div class="goal-builder">
            <div class="goal-header flex items-center space-x-4 mb-4 pb-2 border-b">
              <span class="text-sm font-semibold text-gray-700 w-16">목표</span>
              <span class="text-sm font-semibold text-gray-700">조건</span>
            </div>

            <div class="goal-content space-y-4">
              <div v-if="goalGroups.length === 0" class="text-center py-8 text-gray-500">
                목표 조건 그룹이 없습니다. 아래 버튼으로 그룹을 추가하세요.
              </div>

              <template v-else>
                <div
                  v-for="(group, index) in goalGroups"
                  :key="group.id || index"
                  class="goal-group-item"
                >
                  <div v-if="index > 0" class="my-4 flex justify-center">
                    <LogicToggle
                      :value="goalGroupLogic"
                      @update:value="goalGroupLogic = $event"
                    />
                  </div>
                  <ConditionGroup
                    :group="group"
                    :group-index="index"
                    :lists="lists"
                    @update="(updated) => {
                      const newGroups = [...goalGroups]
                      newGroups[index] = updated
                      goalGroups = newGroups
                    }"
                    @remove="goalGroups = goalGroups.filter((_, i) => i !== index)"
                    :is-only="goalGroups.length === 1"
                  />
                </div>
              </template>

              <div class="mt-4">
                <button
                  @click="() => {
                    const newGroup = {
                      id: Date.now(),
                      logic: 'AND',
                      conditions: []
                    }
                    goalGroups = [...goalGroups, newGroup]
                  }"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 그룹 추가</span>
                </button>
              </div>
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
            @click="showGoalModal = false"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import ConditionBuilder from './ConditionBuilder.vue'
import ActionBuilder from './ActionBuilder.vue'
import ConditionGroup from './ConditionGroup.vue'
import LogicToggle from './LogicToggle.vue'
import { useWorkflowStore } from '../stores/workflow'
import api from '../api'

const props = defineProps({
  workflow: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const workflowStore = useWorkflowStore()

const name = ref('')
const conditionGroups = ref([])
const groupLogic = ref('AND')
const actions = ref([])
const conditionSettings = ref({
  addCurrentLeads: false,
  onlyFirstTime: true,
  enableGoal: false
})
const showGoalModal = ref(false)
const goalGroups = ref([])
const goalGroupLogic = ref('AND')
const lists = ref([])

// 워크플로우 데이터 로드
watch(() => props.workflow, (workflow) => {
  if (workflow) {
    name.value = workflow.name || ''

    // 새 형식 (condition_groups)
    if (workflow.condition_groups) {
      try {
        const parsedGroups = typeof workflow.condition_groups === 'string'
          ? JSON.parse(workflow.condition_groups)
          : workflow.condition_groups
        conditionGroups.value = parsedGroups || []
      } catch (e) {
        conditionGroups.value = []
      }
      groupLogic.value = workflow.group_logic || 'AND'

      try {
        const parsedActions = typeof workflow.actions === 'string'
          ? JSON.parse(workflow.actions)
          : workflow.actions
        actions.value = parsedActions || []
      } catch (e) {
        actions.value = []
      }
    }
    // 기존 형식 (conditions 배열)
    else if (workflow.conditions) {
      try {
        const parsedConditions = typeof workflow.conditions === 'string'
          ? JSON.parse(workflow.conditions)
          : workflow.conditions

        conditionGroups.value = [{
          id: Date.now(),
          logic: workflow.condition_logic || 'AND',
          conditions: parsedConditions || []
        }]
        groupLogic.value = 'AND'
      } catch (e) {
        conditionGroups.value = []
      }

      try {
        const parsedActions = typeof workflow.actions === 'string'
          ? JSON.parse(workflow.actions)
          : workflow.actions
        actions.value = (parsedActions || []).map((a, i) => ({ ...a, step: i + 1 }))
      } catch (e) {
        actions.value = []
      }
    }
    // 레거시 형식
    else if (workflow.event_name) {
      conditionGroups.value = [{
        id: Date.now(),
        logic: 'AND',
        conditions: [{
          type: 'custom_event',
          event_name: workflow.event_name,
          filter: workflow.filter || '존재하는',
          frequency: workflow.frequency || 1,
          frequency_period: workflow.frequency_period || '기간과 상관없이'
        }]
      }]
      groupLogic.value = 'AND'

      if (workflow.webhook_url) {
        actions.value = [{
          step: 1,
          type: 'webhook',
          webhook_url: workflow.webhook_url,
          webhook_params: workflow.webhook_params ? (typeof workflow.webhook_params === 'string' ? JSON.parse(workflow.webhook_params) : workflow.webhook_params) : {}
        }]
      } else {
        actions.value = []
      }
    } else {
      conditionGroups.value = []
      actions.value = []
    }

    // 조건 설정 로드
    if (workflow.condition_settings) {
      try {
        const parsedSettings = typeof workflow.condition_settings === 'string'
          ? JSON.parse(workflow.condition_settings)
          : workflow.condition_settings
        conditionSettings.value = parsedSettings
      } catch (e) {
        conditionSettings.value = { addCurrentLeads: false, onlyFirstTime: true, enableGoal: false }
      }
    }

    // 목표 조건 그룹 로드
    if (workflow.goal_groups) {
      try {
        const parsedGoalGroups = typeof workflow.goal_groups === 'string'
          ? JSON.parse(workflow.goal_groups)
          : workflow.goal_groups
        goalGroups.value = parsedGoalGroups || []
      } catch (e) {
        goalGroups.value = []
      }
      goalGroupLogic.value = workflow.goal_group_logic || 'AND'
    } else {
      goalGroups.value = []
      goalGroupLogic.value = 'AND'
    }
  } else {
    // 새 워크플로우
    name.value = ''
    conditionGroups.value = []
    actions.value = []
    conditionSettings.value = { addCurrentLeads: false, onlyFirstTime: true, enableGoal: false }
    goalGroups.value = []
    goalGroupLogic.value = 'AND'
  }
}, { immediate: true })

// 리스트 로드
onMounted(async () => {
  try {
    const response = await api.get('/api/lists')
    if (response.data.success) {
      lists.value = response.data.data || []
    }
  } catch (error) {
    console.error('리스트 로드 오류:', error)
  }
})

const handleSave = async () => {
  if (!name.value.trim()) {
    alert('워크플로우 이름을 입력하세요.')
    return
  }

  const hasConditions = conditionGroups.value.some(g => g.conditions && g.conditions.length > 0)
  if (!hasConditions) {
    alert('최소 하나의 조건을 추가하세요.')
    return
  }

  if (actions.value.length === 0) {
    alert('최소 하나의 액션을 추가하세요.')
    return
  }

  try {
    const firstCondition = conditionGroups.value[0]?.conditions?.[0]
    const firstWebhook = actions.value.find(a => a.type === 'webhook')

    const data = {
      name: name.value,
      condition_groups: JSON.stringify(conditionGroups.value),
      group_logic: groupLogic.value,
      actions: JSON.stringify(actions.value),
      condition_settings: JSON.stringify(conditionSettings.value),
      goal_groups: JSON.stringify(goalGroups.value),
      goal_group_logic: goalGroupLogic.value,
      // 하위 호환성 필드
      conditions: JSON.stringify(conditionGroups.value.flatMap(g => g.conditions || [])),
      condition_logic: conditionGroups.value[0]?.logic || 'AND',
      event_name: firstCondition?.type === 'custom_event' ? firstCondition.event_name : null,
      filter: firstCondition?.type === 'custom_event' ? firstCondition.filter : null,
      frequency: firstCondition?.type === 'custom_event' ? firstCondition.frequency : 1,
      frequency_period: firstCondition?.type === 'custom_event' ? firstCondition.frequency_period : '기간과 상관없이',
      webhook_url: firstWebhook?.webhook_url || null,
      webhook_params: firstWebhook?.webhook_params ? JSON.stringify(firstWebhook.webhook_params) : null
    }

    if (props.workflow) {
      await workflowStore.updateWorkflow(props.workflow.id, {
        ...data,
        is_launched: props.workflow.is_launched || false
      })
    } else {
      await workflowStore.createWorkflow(data)
    }

    emit('save')
  } catch (error) {
    console.error('저장 오류:', error)
    const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류가 발생했습니다.'
    alert(`저장에 실패했습니다.\n\n오류: ${errorMessage}`)
  }
}
</script>

<style scoped>
.workflow-editor {
  z-index: 50;
}
</style>

