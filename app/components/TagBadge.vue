<template>
  <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
    {{ tag }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ tag: string }>()
</script>
