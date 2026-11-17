import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ComputedPractice from '../ComputedPractice.vue'
import LifecyclePractice from '../LifecyclePractice.vue'

// 실제로 겪은 사고의 재발 방지: 렌더링/onUpdated 안에서 화면이 읽는 반응형 값을 바꾸면
// 무한 갱신(Maximum call stack size exceeded)에 빠진다. 갱신 횟수가 유한한지 확인한다.
describe('실습 컴포넌트가 무한 갱신에 빠지지 않는다', () => {
  it('ComputedPractice: 렌더링 트리거를 눌러도 computed 는 재계산하지 않고, 함수만 다시 호출된다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrapper = mount(ComputedPractice)
    await nextTick()

    const before = log.mock.calls.length
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await nextTick()

    const newLogs = log.mock.calls.slice(before).map((c) => c[0])
    expect(newLogs).toHaveLength(2)
    expect(newLogs.every((m) => m.startsWith('[function]'))).toBe(true)
  })

  it('LifecyclePractice: 메시지를 바꾸면 onUpdated 로그가 한 번만 늘어난다', async () => {
    const wrapper = mount(LifecyclePractice)
    await nextTick()
    await nextTick()
    const count = () => wrapper.findAll('.log-container li').length

    const before = count()
    await wrapper.get('.interactive button').trigger('click')
    await nextTick()
    await nextTick()
    await nextTick()

    expect(count() - before).toBeLessThanOrEqual(2) // 무한 반복이면 계속 늘어난다
    expect(count()).toBeLessThan(15 + 1)
  })
})
