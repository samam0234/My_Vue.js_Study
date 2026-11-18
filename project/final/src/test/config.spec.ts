import { readdirSync } from 'node:fs'

// 실제로 겪은 사고의 재발 방지: vite.config.js 와 vite.config.ts 가 함께 있으면 .js 가 먼저 읽혀
// .ts 에 넣은 플러그인·프록시·청크 설정이 오류 없이 통째로 무시된다 (study14).
describe('프로젝트 설정', () => {
  it('Vite 설정 파일은 하나만 있다', () => {
    const configs = readdirSync(process.cwd()).filter((f) => /^vite\.config\./.test(f))
    expect(configs).toEqual(['vite.config.ts'])
  })
})
