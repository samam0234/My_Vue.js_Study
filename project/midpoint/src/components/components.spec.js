import { mount } from '@vue/test-utils'
import { ref, nextTick, effectScope } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import PostCard from './PostCard.vue'
import StateMessage from './StateMessage.vue'
import { useAsync } from '../composables/useAsync.js'
import { useDebouncedRef } from '../composables/useDebounce.js'

const post = {
  id: 7,
  title: '첫 글',
  body: 'a'.repeat(100),
  author: { nickname: 'mina' },
  commentCount: 3,
  createdAt: new Date().toISOString(),
}
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/posts/:id', name: 'post-detail', component: { template: '<div />' } }],
})
const mountCard = (props = {}) => mount(PostCard, { props: { post, ...props }, global: { plugins: [router] } })

describe('PostCard', () => {
  it('제목·작성자·댓글 수를 보여 주고 본문은 60자까지만 보여 준다', () => {
    const text = mountCard().text()
    expect(text).toContain('첫 글')
    expect(text).toContain('댓글 3')
    expect(text).toContain('a'.repeat(60) + '…')
  })

  it('별을 누르면 toggle-favorite 를 emit 하고 링크 이동은 막는다', async () => {
    const wrapper = mountCard()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.get('button').element.dispatchEvent(event)
    await nextTick()
    expect(wrapper.emitted('toggle-favorite')).toHaveLength(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('즐겨찾기 상태에 따라 별 모양이 바뀐다', () => {
    expect(mountCard({ isFavorite: true }).get('button').text()).toBe('★')
    expect(mountCard().get('button').text()).toBe('☆')
  })
})

describe('StateMessage', () => {
  it('loading / error / empty / slot 을 구분해 보여 준다', async () => {
    expect(mount(StateMessage, { props: { loading: true } }).text()).toContain('불러오는 중')
    expect(mount(StateMessage, { props: { empty: true, emptyText: '없음' } }).text()).toBe('없음')
    expect(mount(StateMessage, { slots: { default: '본문' } }).text()).toBe('본문')

    const wrapper = mount(StateMessage, { props: { error: { message: '서버 오류', requestId: 'r-1' } } })
    expect(wrapper.text()).toContain('r-1')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('useAsync', () => {
  it('성공하면 data, 실패하면 error 에 담고 loading 을 끈다', async () => {
    const ok = useAsync(async (n) => n * 2)
    const p = ok.run(21)
    expect(ok.loading.value).toBe(true)
    await p
    expect(ok.data.value).toBe(42)

    const bad = useAsync(async () => {
      throw new Error('boom')
    })
    await bad.run()
    expect(bad.error.value.message).toBe('boom')
    expect(bad.loading.value).toBe(false)
  })
})

describe('useDebouncedRef', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('입력이 멈춘 뒤에만 값이 따라온다', async () => {
    const scope = effectScope()
    const source = ref('')
    const debounced = scope.run(() => useDebouncedRef(source, 300))
    source.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(200)
    source.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(200)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(150)
    expect(debounced.value).toBe('ab')
    scope.stop()
  })
})
