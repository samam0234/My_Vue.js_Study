import { reactive } from 'vue'
import { defineStore } from 'pinia'

// 즐겨찾기한 게시글 id를 Set으로 관리하는 간단한 스토어.
// 로그인 여부와 무관하게 동작하지만, 실제 토글 여부는 컴포넌트 쪽에서
// authStore.isLoggedIn을 확인한 뒤에만 호출하도록 사용합니다.
export const useFavoritesStore = defineStore('favorites', () => {
  const favoriteIds = reactive(new Set())

  function isFavorite(postId) {
    return favoriteIds.has(postId)
  }

  function toggle(postId) {
    if (favoriteIds.has(postId)) {
      favoriteIds.delete(postId)
    } else {
      favoriteIds.add(postId)
    }
  }

  return { favoriteIds, isFavorite, toggle }
})
