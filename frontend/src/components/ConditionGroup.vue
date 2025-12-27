<template>
  <div class="condition-group bg-white border rounded-lg p-4 mb-4">
    <div class="group-header flex items-center justify-between mb-4">
      <span class="text-sm font-semibold text-gray-700">그룹 {{ groupIndex + 1 }}</span>
      <button
        v-if="!isOnly"
        @click="$emit('remove')"
        class="text-red-600 hover:text-red-800 text-sm"
      >
        그룹 삭제
      </button>
    </div>

    <div class="conditions space-y-3">
      <div
        v-for="(condition, index) in group.conditions"
        :key="index"
        class="condition-item border rounded p-3"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">조건 {{ index + 1 }}</span>
          <button
            @click="removeCondition(index)"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            삭제
          </button>
        </div>
        
        <div v-if="condition.type === 'list'" class="space-y-2">
          <div>
            <label class="block text-sm font-medium mb-1">리스트 검색</label>
            <input
              v-model="listSearchQuery"
              type="text"
              class="w-full border rounded px-3 py-2 mb-2"
              placeholder="리스트 이름으로 검색..."
              @input="updateCondition(index)"
            />
          </div>
          <select
            v-model="condition.list_id"
            @change="updateCondition(index)"
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
          <select
            v-model="condition.filter"
            @change="updateCondition(index)"
            class="w-full border rounded px-3 py-2"
          >
            <option value="in_list">리스트에 있음</option>
            <option value="not_in_list">리스트에 없음</option>
          </select>
        </div>

        <div v-else-if="condition.type === 'custom_event'" class="space-y-2">
          <select
            v-model="condition.event_name"
            @change="updateCondition(index)"
            class="w-full border rounded px-3 py-2"
          >
            <option value="">이벤트 선택</option>
            <option
              v-for="eventName in availableEvents"
              :key="eventName"
              :value="eventName"
            >
              {{ eventName }}
            </option>
          </select>
          <select
            v-model="condition.filter"
            @change="updateCondition(index)"
            class="w-full border rounded px-3 py-2"
          >
            <option value="존재하는">존재하는</option>
            <option value="존재하지 않는">존재하지 않는</option>
          </select>
        </div>
      </div>

      <div class="flex space-x-2">
        <button
          @click="addCondition('list')"
          class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          + 리스트 조건
        </button>
        <button
          @click="addCondition('custom_event')"
          class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          + 이벤트 조건
        </button>
      </div>
    </div>

    <div v-if="group.conditions.length > 1" class="mt-4 pt-4 border-t">
      <LogicToggle
        :value="group.logic || 'AND'"
        @update:value="(val) => updateGroupLogic(val)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LogicToggle from './LogicToggle.vue'
import api from '../api'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  groupIndex: {
    type: Number,
    required: true
  },
  lists: {
    type: Array,
    default: () => []
  },
  isOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'remove'])

const availableEvents = ref([])
const listSearchQuery = ref('')

const filteredLists = computed(() => {
  if (!listSearchQuery.value.trim()) {
    return props.lists
  }
  const query = listSearchQuery.value.toLowerCase()
  return props.lists.filter(list => 
    list.name.toLowerCase().includes(query)
  )
})

// 사용 가능한 이벤트 목록 로드
const loadAvailableEvents = async () => {
  try {
    const response = await api.get('/api/events/distinct')
    if (response.data.success) {
      availableEvents.value = response.data.data
    }
  } catch (error) {
    console.error('이벤트 목록 로드 오류:', error)
  }
}

loadAvailableEvents()

const addCondition = (type) => {
  const newCondition = type === 'list'
    ? { type: 'list', filter: 'in_list', list_id: null }
    : { type: 'custom_event', event_name: '', filter: '존재하는', frequency: 1, frequency_period: '기간과 상관없이' }

  emit('update', {
    ...props.group,
    conditions: [...(props.group.conditions || []), newCondition]
  })
}

const updateCondition = (index) => {
  const newConditions = [...props.group.conditions]
  emit('update', { ...props.group, conditions: newConditions })
}

const removeCondition = (index) => {
  const newConditions = props.group.conditions.filter((_, i) => i !== index)
  emit('update', { ...props.group, conditions: newConditions })
}

const updateGroupLogic = (newLogic) => {
  emit('update', { ...props.group, logic: newLogic })
}
</script>

