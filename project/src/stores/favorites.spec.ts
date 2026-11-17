import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useFavoritesStore } from './favorites'

describe('favorites store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('toggle 하면 추가되고, 다시 toggle 하면 제거된다', () => {
    const store = useFavoritesStore()

    store.toggle(3)
    expect(store.isFavorite(3)).toBe(true)

    store.toggle(3)
    expect(store.isFavorite(3)).toBe(false)
  })

  it('새로고침 뒤에도 즐겨찾기가 유지된다 (localStorage 저장·복원)', async () => {
    const first = useFavoritesStore()
    first.toggle(1)
    first.toggle(5)
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))

    setActivePinia(createPinia()) // 새 앱 = 새로고침
    const second = useFavoritesStore()

    expect(second.isFavorite(1)).toBe(true)
    expect(second.isFavorite(5)).toBe(true)
    expect(second.isFavorite(2)).toBe(false)
  })
})
