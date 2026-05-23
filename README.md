# apps-in-toss-pipeline

> 앱인토스(Apps in Toss) 비게임 미니앱 개발 파이프라인 — 아이디어부터 에셋 생성, 앱 구현까지 원스톱 자동화하는 Claude Code 플러그인.

`toss-pipeline` 스킬을 호출하면 다음 5개 Phase 를 순차적으로 진행합니다.

0. **Phase 0 — Pre-flight**: 앱인토스 CLI(`ax`) + Claude Code MCP 등록 확인·자동 설치 유도
1. **Phase 1 — 주제 브레인스토밍**: 9개 카테고리 + 검수 정책(출시 불가 카테고리/어뷰징 방지)을 적용해 미니앱 아이디어 5개 제안 → 선택. 광고는 사용자가 직접 결정, 인증·권한·외부 의존·결제/송금·생성형 AI 사용 여부는 플러그인이 자동 추론
2. **Phase 2 — 에셋 생성**: 앱 이름·부제·로고(600×600)·썸네일(1932×828)·상세 설명·검색 키워드·`metadata.json`. 로고/썸네일은 **SVG 템플릿 우선** (typographic-bold 패턴: 단색 BG + 큰 한글 + 액센트 글자 1개 + 검정 솔리드 pill) + AI 이미지 fallback
3. **Phase 3 — 앱 구현**: `npx create-ait-app` 으로 공식 부트스트랩 → `granite.config.ts` 수정 → Granite SDK 표준 패턴으로 WebView 또는 React Native 미니앱 구현. TDS(Toss Design System) 포함
4. **Phase 4 — 출시 준비**: 샌드박스 테스트 안내 + 등록 가이드 `README.md` + 최종 검수 체크리스트

## 설치

### A) 마켓플레이스로 설치 (권장)

Claude Code 안에서 두 명령을 순서대로 실행합니다. 첫 명령은 이 저장소를 마켓플레이스로 등록하고, 두 번째 명령이 그 마켓플레이스에서 플러그인을 설치합니다 (`@` 뒤가 마켓플레이스 이름).

```
/plugin marketplace add HiImYong99/apps-in-toss-pipeline
/plugin install apps-in-toss-pipeline@apps-in-toss-pipeline
```

`Marketplace ... not found` 오류가 나오면 첫 명령(`marketplace add`)을 빠뜨린 경우입니다 — 순서대로 다시 실행.

이후 업데이트는:

```
/plugin marketplace update apps-in-toss-pipeline
/plugin update
```

### B) 로컬 클론 + 개발용 로드 (`--plugin-dir`)

플러그인을 직접 수정·테스트하려는 경우:

```bash
git clone https://github.com/HiImYong99/apps-in-toss-pipeline.git
cd apps-in-toss-pipeline
npm install            # sharp, tsx 등 로컬 의존성

# 이 디렉토리를 플러그인으로 로드
claude --plugin-dir .
```

### 의존성·네트워크

설치 시 npm 의존성은 받지 않습니다. 스킬이 Phase 2 진입 시점에 자동으로 `${CLAUDE_PLUGIN_DATA}` 로 `sharp`/`tsx` 를 부트스트랩하고 `scripts/` (템플릿 포함) 를 동기화합니다 (`package.json` 변경 시에만 재설치).

> **네트워크 요구사항**: 자동 부트스트랩은 `npm install` 을 호출하므로 **Phase 2 실행 시점에** `npm` 이 PATH 에 있고 npm registry 외부 접속이 가능해야 합니다. 폐쇄망/오프라인 환경이라면 위 B) 흐름으로 사전에 `npm install` 을 마쳐주세요.

## 사용법

Claude Code 안에서 다음 스킬을 호출합니다.

```
/apps-in-toss-pipeline:toss-pipeline
```

스킬이 Phase 0 부터 자동 시작하며, 각 단계에서 `AskUserQuestion` 으로 선택을 요청합니다.

생성물은 `~/Desktop/{app-name}/` 디렉토리에 저장됩니다.

```
~/Desktop/{app-name}/
├── logo-600x600.png         앱 아이콘 (공통 내비 로고로도 사용)
├── thumbnail-1932x828.png   프로모션 배너
├── description.md           앱 상세 설명 (5섹션)
├── metadata.json            앱 메타데이터
├── README.md                등록·검수 가이드
└── {app-folder}/            create-ait-app 으로 만든 프로젝트
    └── granite.config.ts    콘솔 등록 후 brand.icon URL 입력 필요
```

### 스킬 없이 에셋만 직접 렌더

SVG 템플릿은 단독 호출도 가능합니다 (typographic-bold 패턴 — 단색 BG + 큰 한글 + 액센트 한 글자):

```bash
npx tsx scripts/render-svg-asset.ts \
  --template logo \
  --bg "#FFCD3C" --accent "#EA3C53" \
  --title-line1 "데일리" --title-line2 "단어" --accent-char "5" \
  --tagline "DAILY WORD" \
  --output ./logo-600x600.png
```

옵션 전체는 `--help` 없이 인자 누락하면 출력됩니다. 카테고리별 `--bg`/`--accent` 추천 페어는 `skills/toss-pipeline/references/design-system.md` §1.b.

## 사전 요구사항

- [Claude Code](https://docs.claude.com/en/docs/claude-code) 최신 버전
- Node.js 18+ (`sharp` + `tsx` 실행)
- 앱인토스 CLI(`ax`) — Phase 0 에서 자동 설치 유도 (`brew tap toss/tap && brew install ax` 또는 scoop)
- (선택) 이미지 생성 도구 — SVG 템플릿이 안 맞는 디자인일 때 AI 이미지 fallback 으로 사용. 없으면 SVG 템플릿 결과만 사용

## 핵심 참조 문서

스킬이 참조하는 references 폴더의 가이드:

- `review-policy.md` — 앱인토스 검수 통과 정책 (출시 불가 카테고리, 다크패턴, 광고 정책, 외부 링크 제한, 생성형 AI 의무, 검수 체크리스트)
- `granite-sdk.md` — Granite SDK 운영 원칙·함정 (백버튼 단일화, [2005] 회피, pinch-zoom, 공통 내비, 광고 운영). SDK 시그니처는 `ax search docs` 위임
- `design-system.md` — 디자인 토큰, 미니앱 UI 가이드, TDS 안내, SVG 템플릿 사용법
- `categories.md` — 9개 카테고리 트렌드·아이디어 + 출시 불가 영역
- `asset-specs.md` — 로고/썸네일 규격 + 검색 키워드 + AI 이미지 프롬프트
- `description-guide.md` — 상세 설명 5섹션 작성 가이드

## 디렉토리 구조

```
apps-in-toss-pipeline/
├── .claude-plugin/
│   ├── plugin.json                 플러그인 매니페스트
│   └── marketplace.json            마켓플레이스 카탈로그
├── skills/
│   └── toss-pipeline/
│       ├── SKILL.md                파이프라인 정의 (Phase 0~4)
│       └── references/
│           ├── review-policy.md    검수 정책 + 체크리스트
│           ├── granite-sdk.md      SDK 운영 원칙 + 함정
│           ├── design-system.md    디자인 토큰 + UI 가이드
│           ├── categories.md       9개 카테고리 + 출시 불가 영역
│           ├── asset-specs.md      로고/썸네일/키워드 규격
│           └── description-guide.md  5섹션 상세 설명 가이드
├── scripts/
│   ├── resize-image.ts             이미지 리사이즈 유틸 (sharp)
│   ├── render-svg-asset.ts         SVG 템플릿 → PNG 렌더러
│   └── templates/
│       ├── logo-template.svg       로고 SVG 템플릿 (600×600, typographic-bold)
│       └── thumbnail-template.svg  썸네일 SVG 템플릿 (1932×828, typographic-bold)
├── package.json
└── LICENSE                         MIT
```

## 기여

이슈/PR 환영. 큰 변경은 먼저 이슈로 논의 부탁드립니다.

## 라이선스

[MIT](./LICENSE)
