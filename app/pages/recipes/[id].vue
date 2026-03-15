<template>
  <div>
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-20">
      <LoadingSpinner size="lg" class="text-brand-500" />
    </div>

    <!-- 404 -->
    <div v-else-if="error" class="py-20 text-center">
      <p class="text-4xl mb-4">🫥</p>
      <p class="text-gray-500 dark:text-gray-400 text-lg">Recipe not found.</p>
      <NuxtLink to="/" class="mt-4 inline-block text-brand-500 underline">← Back to collection</NuxtLink>
    </div>

    <template v-else-if="recipe">
      <!-- YouTube embed or hero image -->
      <div v-if="youtubeId" class="w-full bg-black">
        <div class="mx-auto max-w-4xl">
          <div class="relative aspect-video">
            <iframe
              :src="`https://www.youtube.com/embed/${youtubeId}`"
              class="absolute inset-0 h-full w-full"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>
      <div v-else class="relative aspect-[16/6] w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img
          v-if="recipe.image_url"
          :src="recipe.image_url"
          :alt="recipe.title"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full items-center justify-center text-8xl">🍽️</div>
      </div>

      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Back link + actions -->
        <div class="mb-6 flex items-center justify-between">
          <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">← Back to collection</NuxtLink>
          <div class="flex gap-2">
            <a v-if="recipe.url" :href="recipe.url" target="_blank" rel="noopener noreferrer" class="btn-secondary text-xs">
              View original ↗
            </a>
            <button @click="deleteRecipe" class="btn-secondary text-xs text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
              Delete
            </button>
          </div>
        </div>

        <!-- Title + meta -->
        <h1 class="mb-3 text-3xl font-bold text-gray-900 dark:text-white">{{ recipe.title }}</h1>

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <DifficultyBadge :difficulty="recipe.difficulty" />
          <span v-if="recipe.cuisine" class="text-sm text-gray-600 dark:text-gray-400 capitalize">📍 {{ recipe.cuisine }}</span>
          <span v-if="recipe.meal_type" class="text-sm text-gray-600 dark:text-gray-400 capitalize">🍴 {{ recipe.meal_type }}</span>
          <span v-if="recipe.prep_time_minutes" class="text-sm text-gray-600 dark:text-gray-400">⏱ Prep: {{ recipe.prep_time_minutes }}m</span>
          <span v-if="recipe.cook_time_minutes" class="text-sm text-gray-600 dark:text-gray-400">🔥 Cook: {{ recipe.cook_time_minutes }}m</span>
          <span v-if="recipe.servings" class="text-sm text-gray-600 dark:text-gray-400">👤 Serves {{ recipe.servings }}</span>
          <span v-if="recipe.source_name" class="text-sm text-gray-400 dark:text-gray-500">— {{ recipe.source_name }}</span>
        </div>

        <p v-if="recipe.description" class="mb-5 text-gray-600 dark:text-gray-400 leading-relaxed">{{ recipe.description }}</p>

        <!-- Tags -->
        <div v-if="recipe.tags.length" class="mb-8 flex flex-wrap gap-2">
          <TagBadge v-for="tag in recipe.tags" :key="tag" :tag="tag" />
        </div>

        <hr class="mb-8 border-gray-200 dark:border-gray-700" />

        <!-- Ingredients + Instructions -->
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <!-- Ingredients -->
          <div class="lg:col-span-2">
            <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Ingredients</h2>
            <ul class="space-y-2">
              <li
                v-for="(ingredient, i) in recipe.ingredients"
                :key="i"
                class="flex gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                :class="{ 'line-through text-gray-400 dark:text-gray-600': crossed.has(i) }"
                @click="toggle(i)"
              >
                <span class="mt-0.5 flex-shrink-0 text-brand-500">
                  {{ crossed.has(i) ? '✓' : '•' }}
                </span>
                {{ ingredient }}
              </li>
            </ul>
          </div>

          <!-- Instructions -->
          <div class="lg:col-span-3">
            <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <ol class="space-y-4">
              <li
                v-for="(step, i) in recipe.instructions"
                :key="i"
                class="flex gap-4 text-sm text-gray-700 dark:text-gray-300"
              >
                <span class="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {{ i + 1 }}
                </span>
                <p class="leading-relaxed pt-0.5">{{ step }}</p>
              </li>
            </ol>
          </div>
        </div>

        <hr class="my-10 border-gray-200 dark:border-gray-700" />

        <!-- Notes -->
        <RecipeNotes :recipe-id="recipe.id" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { RecipeRow } from '~/server/db/schema'

const route  = useRoute()
const router = useRouter()
const id = route.params.id as string

const { data: recipe, pending, error } = await useFetch<RecipeRow>(`/api/recipes/${id}`)

const youtubeId = computed(() => {
  const url = recipe.value?.url
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {}
  return null
})

const crossed = ref<Set<number>>(new Set())
function toggle(i: number) {
  const s = new Set(crossed.value)
  s.has(i) ? s.delete(i) : s.add(i)
  crossed.value = s
}

async function deleteRecipe() {
  if (!confirm('Delete this recipe?')) return
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  router.push('/')
}

useHead({ title: () => recipe.value?.title ?? 'Recipe' })
</script>
