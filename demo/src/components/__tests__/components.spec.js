import { mount } from '@vue/test-utils'
import StatusBadge from '../StatusBadge.vue'
import ProductCard from '../ProductCard.vue'

describe('StatusBadge', () => {
  it('슬롯 내용을 보여 주고, 없으면 기본 문구를 쓴다', () => {
    expect(mount(StatusBadge, { slots: { default: '품절' } }).text()).toBe('품절')
    expect(mount(StatusBadge).text()).toBe('상태 없음')
  })

  it('type 에 따라 클래스가 바뀐다', () => {
    expect(mount(StatusBadge, { props: { type: 'danger' } }).classes()).toContain('danger')
    expect(mount(StatusBadge).classes()).toContain('success')
  })

  it('허용되지 않은 type 은 개발 모드 경고를 낸다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(StatusBadge, { props: { type: 'nope' } })
    expect(warn).toHaveBeenCalled()
  })
})

describe('ProductCard', () => {
  const product = { id: 1, name: '무선 키보드', price: 45000, favorite: false }

  it('상품 정보를 표시한다', () => {
    const text = mount(ProductCard, { props: { product } }).text()
    expect(text).toContain('무선 키보드')
    expect(text).toContain('45,000')
  })

  it('카드를 누르면 select, 별을 누르면 toggle-favorite 만 emit 한다', async () => {
    const wrapper = mount(ProductCard, { props: { product } })

    await wrapper.get('.favorite-btn').trigger('click')
    expect(wrapper.emitted('toggle-favorite')).toHaveLength(1)
    expect(wrapper.emitted('select')).toBeUndefined() // stopPropagation 덕분에 카드 클릭은 발생하지 않는다

    await wrapper.get('.card').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })
})
