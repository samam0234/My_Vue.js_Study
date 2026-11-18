import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ApiError } from '@/api/client'
import type { Post } from '@/types/api'
import PostCard from './PostCard.vue'
import Pagination from './Pagination.vue'
import StateMessage from './StateMessage.vue'
import FormField from './FormField.vue'
import ErrorBoundary from './ErrorBoundary.vue'

const post: Post = {
  id: 7,
  title: '첫 글',
  body: 'a'.repeat(100),
  tags: [],
  author: { id: 1, nickname: 'mina' },
  commentCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// PostCard 안의 <RouterLink> 가 동작하도록 테스트용 라우터를 제공한다.
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/posts/:id', name: 'post-detail', component: { template: '<div />' } }],
})

function mountCard(props: Partial<{ isFavorite: boolean }> = {}) {
  return mount(PostCard, { props: { post, ...props }, global: { plugins: [router] } })
}

describe('PostCard', () => {
  it('제목·작성자·댓글 수를 표시하고 본문은 60자까지만 보여 준다', () => {
    const text = mountCard().text()
    expect(text).toContain('첫 글')
    expect(text).toContain('mina')
    expect(text).toContain('댓글 3')
    expect(text).toContain('a'.repeat(60) + '…')
    expect(text).not.toContain('a'.repeat(61))
  })

  it('즐겨찾기 상태에 따라 별 모양과 접근성 이름이 바뀐다', () => {
    expect(mountCard({ isFavorite: false }).get('button').text()).toBe('☆')
    const on = mountCard({ isFavorite: true }).get('button')
    expect(on.text()).toBe('★')
    expect(on.attributes('aria-label')).toBe('즐겨찾기 해제')
  })

  it('별 버튼을 누르면 toggle-favorite 를 한 번 emit 하고 링크 이동은 막는다', async () => {
    const wrapper = mountCard()
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.get('button').element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('toggle-favorite')).toHaveLength(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('카드 링크는 상세 주소를 가리킨다', () => {
    expect(mountCard().get('a').attributes('href')).toBe('/posts/7')
  })
})

describe('Pagination', () => {
  it('한 페이지뿐이면 아무것도 그리지 않는다', () => {
    const wrapper = mount(Pagination, { props: { page: 1, totalPages: 1 } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('첫 페이지에서는 이전, 마지막 페이지에서는 다음이 비활성화된다', () => {
    const first = mount(Pagination, { props: { page: 1, totalPages: 3 } })
    expect(first.findAll('button')[0].attributes('disabled')).toBeDefined()
    expect(first.findAll('button')[1].attributes('disabled')).toBeUndefined()

    const last = mount(Pagination, { props: { page: 3, totalPages: 3 } })
    expect(last.findAll('button')[1].attributes('disabled')).toBeDefined()
  })

  it('다음을 누르면 page v-model 갱신 이벤트를 보낸다', async () => {
    const wrapper = mount(Pagination, { props: { page: 1, totalPages: 3 } })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
  })
})

describe('StateMessage', () => {
  it('loading 이면 로딩 문구, 아니면 slot 을 보여 준다', () => {
    const loading = mount(StateMessage, { props: { loading: true }, slots: { default: '본문' } })
    expect(loading.text()).toContain('불러오는 중')
    expect(loading.text()).not.toContain('본문')

    const ready = mount(StateMessage, { slots: { default: '본문' } })
    expect(ready.text()).toBe('본문')
  })

  it('오류면 메시지·요청 번호·다시 시도 버튼을 보여 주고 retry 를 emit 한다', async () => {
    const error = new ApiError(500, { code: 'INTERNAL', message: '서버 오류', requestId: 'req-9' })
    const wrapper = mount(StateMessage, { props: { error } })

    expect(wrapper.text()).toContain('서버 오류')
    expect(wrapper.text()).toContain('req-9')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('비어 있으면 emptyText 를 보여 준다', () => {
    const wrapper = mount(StateMessage, { props: { empty: true, emptyText: '글이 없어요' } })
    expect(wrapper.text()).toBe('글이 없어요')
  })
})

describe('FormField', () => {
  it('label 과 input 이 연결되어 있고 v-model 로 값이 갱신된다', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: '이메일',
        modelValue: '',
        'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
      },
    })
    const label = wrapper.get('label')
    const input = wrapper.get('input')
    expect(label.attributes('for')).toBe(input.attributes('id'))

    await input.setValue('a@b.com')
    expect(wrapper.props('modelValue')).toBe('a@b.com')
  })

  it('error 가 있으면 role=alert 로 보여 주고 input 과 연결한다', () => {
    const wrapper = mount(FormField, {
      props: { label: '이름', modelValue: '', error: '필수입니다' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toBe('필수입니다')
    expect(input.attributes('aria-describedby')).toBe(alert.attributes('id'))
  })

  it('multiline 이면 textarea 를 쓴다', () => {
    const wrapper = mount(FormField, { props: { label: '내용', modelValue: '', multiline: true } })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })
})

describe('ErrorBoundary', () => {
  const Boom = defineComponent({
    setup() {
      throw new Error('렌더 오류')
    },
    render: () => h('div'),
  })

  it('자식이 오류를 내면 그 영역만 안내 문구로 바꾸고 앱은 계속 동작한다', async () => {
    const wrapper = mount({
      components: { ErrorBoundary, Boom },
      template: '<header>헤더</header><ErrorBoundary><Boom /></ErrorBoundary>',
    })
    await nextTick()

    expect(wrapper.text()).toContain('헤더')
    expect(wrapper.get('[role="alert"]').text()).toContain('문제가 생겼습니다')
  })

  it('오류가 없으면 slot 을 그대로 보여 준다', () => {
    const wrapper = mount(ErrorBoundary, { slots: { default: '정상' } })
    expect(wrapper.text()).toBe('정상')
  })
})
