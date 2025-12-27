<template>
  <div
    :class="[
      'industry-card bg-white border-2 rounded-xl p-8 text-center cursor-pointer transition-all relative',
      active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:-translate-y-1 hover:shadow-lg'
    ]"
    @click="handleClick"
  >
    <div class="industry-icon text-5xl mb-4">{{ industry.icon }}</div>
    <div class="industry-name text-lg font-semibold text-gray-900">{{ industry.name }}</div>
    <div v-if="disabled" class="coming-soon absolute top-2 right-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
      준비중
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  industry: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const disabled = computed(() => props.industry.disabled)

const handleClick = () => {
  if (!disabled.value) {
    emit('select', props.industry.id)
  }
}
</script>

