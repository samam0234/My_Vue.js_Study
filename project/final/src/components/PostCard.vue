<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/api'
import { fromNow, formatDate } from '@/utils/format'

withDefaults(defineProps<{ post: Post; isFavorite?: boolean }>(), { isFavorite: false })

// study2: 이 컴포넌트는 데이터를 바꾸지 않고 "눌렸다"고만 알린다. 로그인 확인은 부모가 한다.
const emit = defineEmits<{ (e: 'toggle-favorite'): void }>()

function handleFavoriteClick(event: Event) {
  event.preventDefault() // RouterLink 의 페이지 이동을 막고 즐겨찾기만 토글
  event.stopPropagation()
  emit('toggle-favorite')
}
</script>

<template>
  <RouterLink
    :to="{ name: 'post-detail', params: { id: post.id } }"
    class="relative block rounded-lg border border-slate-200 bg-white p-4 text-inherit no-underline transition hover:border-slate-400"
  >
    <button
      type="button"
      class="absolute right-3 top-3 text-xl leading-none"
      :class="isFavorite ? 'text-amber-500' : 'text-slate-400'"
      :aria-label="isFavorite ? '즐겨찾기 해제' : '즐겨찾기'"
      :aria-pressed="isFavorite"
      @click="handleFavoriteClick"
    >
      {{ isFavorite ? '★' : '☆' }}
    </button>
    <h3 class="mb-2 mr-8 text-base font-semibold text-slate-900">{{ post.title }}</h3>
    <p class="mb-3 text-sm text-slate-600">
      {{ post.body.slice(0, 60) }}{{ post.body.length > 60 ? '…' : '' }}
    </p>
    <p class="text-xs text-slate-500">
      {{ post.author.nickname }} ·
      <time :datetime="post.createdAt" :title="formatDate(post.createdAt)">{{
        fromNow(post.createdAt)
      }}</time>
      · 댓글 {{ post.commentCount }}
    </p>
  </RouterLink>
</template>
