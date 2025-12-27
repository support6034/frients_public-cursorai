<template>
  <div
    :class="[
      'template-card bg-white border-2 rounded-lg p-6 cursor-pointer transition-all relative',
      selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-500 hover:shadow-md'
    ]"
    @click="$emit('toggle', template.id)"
  >
    <!-- 체크박스 -->
    <div
      :class="[
        'template-checkbox absolute top-2 right-2 w-6 h-6 border-2 rounded flex items-center justify-center font-bold text-sm',
        selected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300 text-transparent'
      ]"
    >
      ✓
    </div>

    <!-- 템플릿 이름 -->
    <div class="template-name font-semibold text-gray-900 mb-2">{{ template.name }}</div>

    <!-- 템플릿 설명 -->
    <div class="template-description text-sm text-gray-600 mb-2">{{ template.description }}</div>

    <!-- 기본 배지 -->
    <div v-if="template.default" class="template-badge inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold mt-2">
      기본
    </div>
  </div>
</template>

<script setup>
defineProps({
  template: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])
</script>

