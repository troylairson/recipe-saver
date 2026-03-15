<template>
  <span
    v-if="difficulty"
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
    :class="colorClass"
  >
    {{ difficulty }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ difficulty: string | null }>()
const colorClass = computed(() => ({
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard:   'bg-red-100 text-red-700',
}[props.difficulty ?? ''] ?? 'bg-gray-100 text-gray-600'))
</script>
