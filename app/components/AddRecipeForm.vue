<template>
  <form @submit.prevent="submit" class="flex flex-col gap-3 sm:flex-row">
    <div class="flex-1">
      <input
        v-model="url"
        type="url"
        placeholder="Paste a recipe URL…"
        required
        :disabled="status === 'loading'"
        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm
               focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
               disabled:bg-gray-50 disabled:text-gray-400
               dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400
               dark:disabled:bg-gray-800"
      />
    </div>
    <button type="submit" class="btn-primary flex items-center gap-2 whitespace-nowrap" :disabled="status === 'loading'">
      <LoadingSpinner v-if="status === 'loading'" size="sm" />
      <span>{{ status === 'loading' ? 'Saving…' : 'Save Recipe' }}</span>
    </button>
  </form>

  <Transition name="fade">
    <div v-if="message" class="mt-3 rounded-lg px-4 py-3 text-sm" :class="messageClass">
      {{ message }}
      <NuxtLink v-if="duplicateId" :to="`/recipes/${duplicateId}`" class="ml-1 underline">
        View it →
      </NuxtLink>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const emit = defineEmits<{ recipeAdded: [recipe: any] }>()

const url = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')
const message = ref('')
const duplicateId = ref<number | null>(null)

const messageClass = computed(() => ({
  success:   'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  duplicate: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error:     'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}[status.value] ?? ''))

const ERROR_MESSAGES: Record<string, string> = {
  SCRAPE_TIMEOUT:    'That site took too long to respond. Try again or check the URL.',
  SCRAPE_HTTP_ERROR: 'Could not access that URL (the site may block scrapers).',
  NOT_HTML:          'That URL does not point to a webpage.',
  RECIPE_NOT_FOUND:  'No recipe found at that URL. Try a major recipe site like AllRecipes or Serious Eats.',
  NO_API_KEY:        'This site doesn\'t have structured recipe data. Add an ANTHROPIC_API_KEY to .env to support any site.',
  AI_UNAVAILABLE:    'AI extraction is temporarily unavailable. Try again in a moment.',
}

async function submit() {
  if (!url.value.trim()) return
  status.value = 'loading'
  message.value = ''
  duplicateId.value = null

  try {
    const result = await $fetch<{ recipe: any }>('/api/recipes', {
      method: 'POST',
      body: { url: url.value.trim() },
    })
    status.value = 'success'
    message.value = `"${result.recipe.title}" saved!`
    url.value = ''
    emit('recipeAdded', result.recipe)
    setTimeout(() => { message.value = ''; status.value = 'idle' }, 4000)
  } catch (err: any) {
    const code = err.data?.data?.code ?? err.data?.code
    if (err.statusCode === 409 || err.status === 409) {
      status.value = 'duplicate'
      duplicateId.value = err.data?.data?.id ?? null
      message.value = 'Already in your collection!'
    } else {
      status.value = 'error'
      message.value = ERROR_MESSAGES[code] ?? (err.data?.message ?? 'Something went wrong. Try again.')
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
