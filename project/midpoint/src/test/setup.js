import { createServer, createDb } from '../../server/api-server.js'
import { configureApi } from '../api/client.js'

// study9: 가짜(mock) 대신 실제 개발 API 서버를 띄워 테스트한다. 서버는 메모리 DB 라 테스트마다 초기화한다.
const db = createDb()
const server = createServer(db)

beforeAll(() => new Promise((resolve) => server.listen(8123, '127.0.0.1', resolve)))
afterAll(() => new Promise((resolve) => server.close(resolve)))
beforeEach(() => {
  Object.assign(db, createDb())
  configureApi({ getToken: () => null, onUnauthorized: () => {} })
})
afterEach(() => localStorage.clear())
