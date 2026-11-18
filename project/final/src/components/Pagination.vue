<script setup lang="ts">
defineProps<{ totalPages: number }>()
const page = defineModel<number>('page', { required: true })
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="페이지 이동"
    class="mt-6 flex items-center justify-center gap-3"
  >
    <button
      type="button"
      class="rounded-md px-3 py-1 text-sm ring-1 ring-slate-300 disabled:opacity-40"
      :disabled="page <= 1"
      @click="page -= 1"
    >
      이전
    </button>
    <span class="text-sm text-slate-600" aria-live="polite">{{ page }} / {{ totalPages }}</span>
    <button
      type="button"
      class="rounded-md px-3 py-1 text-sm ring-1 ring-slate-300 disabled:opacity-40"
      :disabled="page >= totalPages"
      @click="page += 1"
    >
      다음
    </button>
  </nav>
</template>
