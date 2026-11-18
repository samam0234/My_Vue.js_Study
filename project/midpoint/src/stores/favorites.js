import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const KEY = 'mini-board:favorites'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return [] // 저장값이 깨졌을 때도 앱이 시작되도록
  }
}

// study3: watch + localStorage 로 새로고침 후에도 즐겨찾기를 유지한다. (Set 은 JSON 으로 저장되지 않아 배열)
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref(load())
  watch(ids, (v) => localStorage.setItem(KEY, JSON.stringify(v)), { deep: true })

  const isFavorite = (postId) => ids.value.includes(postId)
  function toggle(postId) {
    ids.value = isFavorite(postId)
      ? ids.value.filter((id) => id !== postId)
      : [...ids.value, postId]
  }
  return { ids, isFavorite, toggle }
})
