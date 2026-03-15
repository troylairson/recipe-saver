<template>
  <div>
    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>

    <form @submit.prevent="submit" class="mb-6">
      <textarea
        v-model="draft"
        placeholder="Add a note… (e.g. 'Used less sugar, turned out great')"
        rows="3"
        class="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm text-gray-900
               focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none
               dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
      />
      <div class="mt-2 flex justify-end">
        <button type="submit" class="btn-primary" :disabled="!draft.trim() || saving">
          {{ saving ? 'Saving…' : 'Add Note' }}
        </button>
      </div>
    </form>

    <ul v-if="notes.length" class="space-y-3">
      <li
        v-for="note in notes"
        :key="note.id"
        class="group relative rounded-lg border border-gray-200 bg-white px-4 py-3
               dark:border-gray-700 dark:bg-gray-800"
      >
        <p class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ note.content }}</p>
        <div class="mt-2 flex items-center justify-between">
          <time class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(note.created_at) }}</time>
          <button
            @click="deleteNote(note.id)"
            class="text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>

    <p v-else class="text-sm text-gray-400 dark:text-gray-500">No notes yet.</p>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '~/server/db/schema'

const props = defineProps<{ recipeId: number }>()

const draft = ref('')
const saving = ref(false)

const { data, refresh } = await useFetch<Note[]>(`/api/recipes/${props.recipeId}/notes`)
const notes = computed(() => data.value ?? [])

async function submit() {
  if (!draft.value.trim()) return
  saving.value = true
  try {
    await $fetch(`/api/recipes/${props.recipeId}/notes`, {
      method: 'POST',
      body: { content: draft.value.trim() },
    })
    draft.value = ''
    await refresh()
  } finally {
    saving.value = false
  }
}

async function deleteNote(noteId: number) {
  await $fetch(`/api/recipes/${props.recipeId}/notes/${noteId}`, { method: 'DELETE' })
  await refresh()
}

function formatDate(iso: string) {
  return new Date(iso + 'Z').toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}
</script>
