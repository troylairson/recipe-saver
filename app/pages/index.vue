<template>
  <div>
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">🍳 Recipe Saver</h1>
          <div class="flex items-center gap-2">
            <!-- Dark mode toggle -->
            <button
              @click="toggle"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              {{ isDark ? '☀️' : '🌙' }}
            </button>
            <button @click="showForm = !showForm" class="btn-primary">
              + Add Recipe
            </button>
          </div>
        </div>

        <!-- Add recipe form -->
        <Transition name="slide">
          <div v-if="showForm" class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            <AddRecipeForm @recipe-added="onRecipeAdded" />
          </div>
        </Transition>
      </div>
    </header>

    <!-- Filters + search -->
    <div class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 min-w-[200px]">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input
              v-model="search"
              type="search"
              placeholder="Search recipes…"
              class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-900
                     focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
                     dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>

          <RecipeFilters
            v-model:cuisine="cuisine"
            v-model:meal-type="mealType"
            v-model:difficulty="difficulty"
          />
        </div>
      </div>
    </div>

    <!-- Grid -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading -->
      <div v-if="pending" class="flex justify-center py-20">
        <LoadingSpinner size="lg" class="text-brand-500" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!recipes.length" class="py-20 text-center">
        <p class="text-4xl mb-4">📭</p>
        <p class="text-gray-500 dark:text-gray-400 text-lg">
          {{ search || cuisine || mealType || difficulty ? 'No recipes match those filters.' : 'No recipes yet — add your first one!' }}
        </p>
      </div>

      <!-- Recipe grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <RecipeCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
      </div>

      <!-- Pagination -->
      <div v-if="total > PAGE_SIZE" class="mt-8 flex justify-center gap-3">
        <button :disabled="page === 1" @click="page--" class="btn-secondary disabled:opacity-40">← Prev</button>
        <span class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          Page {{ page }} of {{ Math.ceil(total / PAGE_SIZE) }}
        </span>
        <button :disabled="page >= Math.ceil(total / PAGE_SIZE)" @click="page++" class="btn-secondary disabled:opacity-40">Next →</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { RecipeRow } from '~/server/db/schema'

const PAGE_SIZE = 24
const { isDark, toggle } = useDarkMode()

const showForm   = ref(false)
const search     = ref('')
const cuisine    = ref('')
const mealType   = ref('')
const difficulty = ref('')
const page       = ref(1)

watch([search, cuisine, mealType, difficulty], () => { page.value = 1 })

const debouncedSearch = ref(search.value)
let debounceTimer: ReturnType<typeof setTimeout>
watch(search, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedSearch.value = val }, 350)
})

const { data, pending, refresh } = await useFetch<{ recipes: RecipeRow[]; total: number }>(
  '/api/recipes',
  {
    query: computed(() => ({
      q:          debouncedSearch.value || undefined,
      cuisine:    cuisine.value || undefined,
      meal_type:  mealType.value || undefined,
      difficulty: difficulty.value || undefined,
      limit:      PAGE_SIZE,
      offset:     (page.value - 1) * PAGE_SIZE,
    })),
    watch: [debouncedSearch, cuisine, mealType, difficulty, page],
  }
)

const recipes = computed(() => data.value?.recipes ?? [])
const total   = computed(() => data.value?.total ?? 0)

async function onRecipeAdded(recipe: RecipeRow) {
  showForm.value = false
  await refresh()
}

useHead({ title: 'Recipe Saver' })
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
