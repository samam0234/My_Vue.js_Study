<script setup lang="ts">
import { useId } from 'vue'

// label + 입력 + 오류 문구를 한 묶음으로 (study5). v-model 로 값을 연결한다.
defineProps<{
  label: string
  type?: string
  error?: string
  multiline?: boolean
  autocomplete?: string
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })
defineEmits<{ (e: 'blur'): void }>()

const id = useId()
</script>

<template>
  <div class="mb-4">
    <label :for="id" class="mb-1 block text-sm font-semibold">{{ label }}</label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      rows="8"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
      @blur="$emit('blur')"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
      @blur="$emit('blur')"
    />
    <p v-if="error" :id="`${id}-error`" role="alert" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
