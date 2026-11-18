<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { reportError } from '@/utils/report'
import { ApiError } from '@/api/client'

const error = ref<Error | null>(null)

// 렌더·라이프사이클·이벤트 핸들러에서 난 오류를 잡는다. (비동기 fetch 오류는 각 화면의 try/catch 가 담당)
onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  reportError(err, { where: 'boundary' })
  return false // 더 위로 전파하지 않는다
})

const requestId = () => (error.value instanceof ApiError ? error.value.requestId : undefined)
</script>

<template>
  <div v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
    <p class="font-medium text-red-700">화면을 표시하는 중 문제가 생겼습니다.</p>
    <p v-if="requestId()" class="mt-1 text-sm text-red-600">
      문의 시 요청 번호를 알려 주세요: {{ requestId() }}
    </p>
    <button
      type="button"
      class="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
      @click="error = null"
    >
      다시 시도
    </button>
  </div>
  <slot v-else />
</template>
