<script setup lang="ts">
// study13: 화면은 이 래퍼만 쓴다. 스타일 시스템을 바꿔도 이 파일만 고치면 된다.
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    loading?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', loading: false, type: 'button' },
)

const styles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
} as const
</script>

<template>
  <button
    :type="type"
    :disabled="loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
    :class="styles[variant]"
  >
    <slot />
  </button>
</template>
