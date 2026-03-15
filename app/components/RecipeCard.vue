<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md
           dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Image -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
      <img
        v-if="recipe.image_url"
        :src="recipe.image_url"
        :alt="recipe.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="flex h-full items-center justify-center text-4xl">🍽️</div>
      <DifficultyBadge v-if="recipe.difficulty" :difficulty="recipe.difficulty" class="absolute right-2 top-2" />
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col p-4">
      <div class="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="recipe.source_name" class="truncate">{{ recipe.source_name }}</span>
        <span v-if="recipe.source_name && recipe.cuisine">·</span>
        <span v-if="recipe.cuisine" class="capitalize">{{ recipe.cuisine }}</span>
      </div>

      <h3 class="mb-2 line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-brand-600 dark:text-gray-100 dark:group-hover:text-brand-400">
        {{ recipe.title }}
      </h3>

      <div class="mt-auto flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="recipe.cook_time_minutes" class="flex items-center gap-1">⏱ {{ recipe.cook_time_minutes }}m</span>
        <span v-if="recipe.servings" class="flex items-center gap-1">👤 {{ recipe.servings }}</span>
        <span v-if="recipe.meal_type" class="ml-auto capitalize">{{ recipe.meal_type }}</span>
      </div>

      <div v-if="recipe.tags.length" class="mt-3 flex flex-wrap gap-1">
        <TagBadge v-for="tag in recipe.tags.slice(0, 3)" :key="tag" :tag="tag" />
        <span
          v-if="recipe.tags.length > 3"
          class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        >
          +{{ recipe.tags.length - 3 }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { RecipeRow } from '~/server/db/schema'
defineProps<{ recipe: RecipeRow }>()
</script>
