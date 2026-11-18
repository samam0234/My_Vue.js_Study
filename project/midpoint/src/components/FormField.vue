<script setup>
import { useId } from 'vue'

// label + 입력 + 오류 문구 한 묶음 (study5). defineModel 로 v-model 을 지원한다.
defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  multiline: Boolean,
  autocomplete: String,
})
const model = defineModel({ type: String, required: true })
defineEmits(['blur'])
const id = useId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <textarea v-if="multiline" :id="id" v-model="model" rows="8" :aria-invalid="!!error" @blur="$emit('blur')" />
    <input
      v-else
      :id="id"
      v-model="model"
      :type="type"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      @blur="$emit('blur')"
    />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>
