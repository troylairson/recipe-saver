<template>
  <div class="flex flex-wrap items-center gap-3">
    <select v-model="localCuisine" class="filter-select">
      <option value="">All Cuisines</option>
      <option v-for="c in CUISINES" :key="c" :value="c">{{ c }}</option>
    </select>

    <select v-model="localMealType" class="filter-select">
      <option value="">All Meals</option>
      <option value="breakfast">Breakfast</option>
      <option value="lunch">Lunch</option>
      <option value="dinner">Dinner</option>
      <option value="snack">Snack</option>
      <option value="dessert">Dessert</option>
      <option value="other">Other</option>
    </select>

    <select v-model="localDifficulty" class="filter-select">
      <option value="">Any Difficulty</option>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>

    <button
      v-if="hasActiveFilters"
      @click="clearAll"
      class="text-sm text-gray-500 hover:text-gray-700 underline"
    >
      Clear filters
    </button>
  </div>
</template>

<script setup lang="ts">
const CUISINES = [
  'American', 'Chinese', 'French', 'Greek', 'Indian', 'Italian',
  'Japanese', 'Korean', 'Mexican', 'Mediterranean', 'Middle Eastern',
  'Thai', 'Vietnamese', 'Other',
]

const props = defineProps<{
  cuisine:    string
  mealType:   string
  difficulty: string
}>()

const emit = defineEmits<{
  'update:cuisine':    [string]
  'update:mealType':   [string]
  'update:difficulty': [string]
}>()

const localCuisine    = computed({ get: () => props.cuisine,    set: v => emit('update:cuisine', v) })
const localMealType   = computed({ get: () => props.mealType,   set: v => emit('update:mealType', v) })
const localDifficulty = computed({ get: () => props.difficulty, set: v => emit('update:difficulty', v) })

const hasActiveFilters = computed(() => props.cuisine || props.mealType || props.difficulty)

function clearAll() {
  emit('update:cuisine', '')
  emit('update:mealType', '')
  emit('update:difficulty', '')
}
</script>
