<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useStreamSummary } from '@/composables/useStreamSummary'
import AppButton from './AppButton.vue'

const props = defineProps<{ text: string }>()

const auth = useAuthStore()
const { text: summary, loading, error, start, stop } = useStreamSummary(() => auth.token)
</script>

<template>
  <section v-if="auth.isLoggedIn" class="mt-6 rounded-lg border border-violet-200 bg-violet-50 p-4">
    <div class="flex items-center gap-2">
      <AppButton :loading="loading" @click="start(props.text)">
        {{ loading ? '요약 중...' : '✨ AI 요약' }}
      </AppButton>
      <AppButton v-if="loading" variant="secondary" @click="stop">중지</AppButton>
    </div>
    <!-- AI 출력도 외부 입력이다: v-html 을 쓰지 않고 {{ }} 로만 출력한다 (study16, study18) -->
    <p v-if="summary" data-testid="ai-summary" class="mt-3 whitespace-pre-wrap text-sm">
      {{ summary }}
    </p>
    <p v-if="error" role="alert" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </section>
</template>
