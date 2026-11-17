<script setup lang="ts">
import { computed } from 'vue'
import { ApiError } from '@/api/client'

// loading / error / empty 를 한 곳에서 표시하고, 아니면 slot 을 보여 준다 (study6, study8).
const props = defineProps<{
  loading?: boolean
  error?: Error | null
  empty?: boolean
  emptyText?: string
}>()
defineEmits<{ (e: 'retry'): void }>()

const requestId = computed(() =>
  props.error instanceof ApiError ? props.error.requestId : undefined,
)
</script>

<template>
  <div v-if="loading" class="py-8 text-center text-slate-500" role="status">
    ⏳ 불러오는 중입니다...
  </div>

  <div v-else-if="error" class="py-8 text-center text-red-600" role="alert">
    <p>⚠️ {{ error.message }}</p>
    <p v-if="requestId" class="mt-1 text-xs text-red-500">요청 번호: {{ requestId }}</p>
    <button
      type="button"
      class="mt-3 rounded-md bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
      @click="$emit('retry')"
    >
      다시 시도
    </button>
  </div>

  <div v-else-if="empty" class="py-8 text-center text-slate-500">
    {{ emptyText ?? '표시할 내용이 없습니다.' }}
  </div>

  <slot v-else />
</template>
