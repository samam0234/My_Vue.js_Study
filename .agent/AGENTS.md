# 에이전트 공통 가이드라인 (인수인계 문서)

이 문서는 이 저장소에서 작업하는 모든 AI 에이전트(Claude, Grok, Codex 등)가 **공통으로** 지켜야 할 규칙을 정리한 인수인계 문서입니다.
`.claude/`, `.grok/`, `.codex/` 폴더의 에이전트별 문서는 이 문서를 기본으로 삼고, 도구별 특이사항만 추가로 기술합니다.

## 1. 저장소 개요

- Vue 3(+ Vite) 학습 기록 저장소입니다.
- 학습 문서 순서: `study0`~`study10`(기초) → `studyMidpoint`(중간 응용) → `study11`~`study18`(심화) → `studyFinal`(심화 응용). 전체 목차는 [../README.md](../README.md)를 따릅니다.
- 각 문서 공통 구성: 목표 한 줄 → 이론 → 실기(코드·줄별 설명) → 오류 노트 → ☐ 체크리스트 → 다음 단계 연결. (`☑` = 코드로 구현 완료, `☐` = 미완료)
- 문서 상단의 "구현 위치"가 해당 문서의 실제 코드 위치입니다. 코드를 구현·검증하면 문서의 체크리스트를 `☑`로 갱신하고, 실행하지 못한 항목(Docker 빌드, 실제 배포 등)은 `☐`로 두고 이유를 적습니다.
- `demo/`: study0~study10 범위를 개념별로 하나씩 실습하는 Vue 3 + Vite(JS) 프로젝트입니다. 실습 컴포넌트들이 홈 화면 한 페이지에 계속 누적되는 구조입니다.
- `project/`: `studyMidpoint.md`·`studyFinal.md`를 구현한 Mini Board(TypeScript, Tailwind, Vitest, Playwright, Docker). `studyFinal.md`의 JSONPlaceholder 버전에서 출발해 공통 API 스펙 v1 기반으로 재구성했습니다. 백엔드가 없어 MSW 목 서버로 개발·테스트합니다.
- `ai-proxy/`, `board-mcp/`: study18의 AI 프록시와 MCP 서버(각자 `package.json`, `npm test`).
- 주의: `vite.config.js`와 `vite.config.ts`가 함께 있으면 `.js`가 먼저 읽혀 `.ts` 설정이 무시됩니다. 하나만 둡니다.
- `studyMidpoint.md`·`studyFinal.md`: 중간·심화 응용 문서입니다. (옛 JSONPlaceholder 종합 실습 기록은 git 이력 `f0fdea4`의 `studyFinal.md`)

## 2. 작업 전 확인 사항

- 새 작업을 시작하기 전에 `studyN.md` 파일들을 번호 순서대로 확인하여 지금까지의 학습 진도와 맥락을 파악합니다.
- `demo/` 프로젝트 코드가 study 문서 설명과 어긋나지 않는지 확인합니다.
- 새 studyN.md 문서를 추가/수정할 때는 이전 study 문서와 이어지는 흐름을 유지합니다.

## 3. 커밋 규칙

- 커밋 관련 규칙은 [COMMIT_GUIDE.md](./COMMIT_GUIDE.md) 문서를 따릅니다.

## 4. 언어 규칙

- 문서 내용, 커밋 설명: 한글
- 커밋 타입(prefix), 코드, 식별자, 파일명: 영어

## 5. 에이전트별 문서

- Claude: [.claude/CLAUDE.md](../.claude/CLAUDE.md)
- Grok: [.grok/GROK.md](../.grok/GROK.md)
- Codex: [.codex/AGENTS.md](../.codex/AGENTS.md)

## 6. 인수인계 원칙

- 작업을 마칠 때는 다음 에이전트/세션이 이어받을 수 있도록 변경 내용과 다음 단계 후보를 간단히 남깁니다.
- 불확실한 결정은 추측하지 말고 study 문서 내용을 근거로 삼습니다.
- 이 문서나 커밋 가이드에 없는 새로운 컨벤션이 필요해지면, 추측해서 각자 다르게 처리하지 말고 이 문서를 먼저 갱신합니다.
