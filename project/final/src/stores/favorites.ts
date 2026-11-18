import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

// 즐겨찾기한 게시글 id. VueUse 의 useLocalStorage 가 저장·복원을 맡는다 (study3 → study13).
// Set 은 JSON 으로 저장되지 않으므로 배열을 쓴다.
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = useLocalStorage<number[]>('mini-board:favorites', [])

  const isFavorite = (postId: number) => ids.value.includes(postId)

  function toggle(postId: number) {
    ids.value = isFavorite(postId)
      ? ids.value.filter((id) => id !== postId)
      : [...ids.value, postId]
  }

  return { ids, isFavorite, toggle }
})
