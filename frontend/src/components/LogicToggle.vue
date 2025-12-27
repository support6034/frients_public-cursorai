<template>
  <div class="logic-toggle flex items-center space-x-2">
    <button
      :class="['px-4 py-2 rounded transition-colors', value === 'AND' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
      @click="$emit('update:value', 'AND')"
    >
      AND
    </button>
    <button
      :class="['px-4 py-2 rounded transition-colors', value === 'OR' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
      @click="$emit('update:value', 'OR')"
    >
      OR
    </button>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    default: 'AND'
  }
})

defineEmits(['update:value'])
</script>

