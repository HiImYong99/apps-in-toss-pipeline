# apps-in-toss-pipeline

> 앱인토스(Apps in Toss) 미니앱 개발 파이프라인 — 아이디어부터 에셋 생성, 앱 구현까지 원스톱 자동화하는 Claude Code 플러그인.

`toss-pipeline` 스킬을 호출하면 다음 4개 Phase 를 순차적으로 진행합니다.

1. **Phase 1 — 주제 브레인스토밍**: 카테고리·트렌드를 기반으로 미니앱 아이디어 5개 제안 → 선택
2. **Phase 2 — 에셋 생성**: 앱 이름·부제·로고(600×600)·썸네일(1932×828)·상세 설명·검색 키워드·`metadata.json`
3. **Phase 3 — 앱 구현**: 앱인토스 MCP + Granite SDK 표준 패턴으로 WebView 또는 React Native 미니앱 구현
4. **Phase 4 — 출력 정리**: 등록 가이드 `README.md` + 최종 요약

## 설치

### A) 로컬 클론 + 개발용 로드 (`--plugin-dir`)

```bash
git clone https://github.com/HiImYong99/apps-in-toss-pipeline.git
cd apps-in-toss-pipeline
npm install            # sharp, tsx 등 로컬 의존성

# 이 디렉토리를 플러그인으로 로드
claude --plugin-dir .
```

### B) 마켓플레이스 / 플러그인 매니저로 설치

```bash
/plugin install apps-in-toss-pipeline
```

설치 시 의존성은 따로 받지 않습니다. 스킬이 Phase 2 진입 시 자동으로 `${CLAUDE_PLUGIN_DATA}` 에 `sharp`/`tsx` 를 부트스트랩합니다 (`package.json` 변경 시에만 재설치).

> **네트워크 요구사항**: 자동 부트스트랩은 `npm install` 을 호출하므로 **Phase 2 실행 시점에** `npm` 이 PATH 에 있고 npm registry 외부 접속이 가능해야 합니다. 폐쇄망/오프라인 환경이라면 위 A) 흐름으로 사전에 `npm install` 을 마쳐주세요.

## 사용법

Claude Code 안에서 다음 스킬을 호출합니다.

```
/apps-in-toss-pipeline:toss-pipeline
```

스킬이 Phase 1부터 자동 시작하며, 각 단계에서 `AskUserQuestion` 으로 선택을 요청합니다.

생성물은 `~/Desktop/{app-name}/` 디렉토리에 저장됩니다.

```
~/Desktop/{app-name}/
├── logo-600x600.png        앱 아이콘
├── thumbnail-1932x828.png  프로모션 배너
├── description.md          앱 상세 설명 (5섹션)
├── metadata.json           앱 메타데이터
├── README.md               등록 가이드
└── app/                    앱 소스 코드
```

## 사전 요구사항

- [Claude Code](https://docs.claude.com/en/docs/claude-code) 최신 버전
- Node.js 18+ (이미지 리사이즈용 `sharp` + `tsx` 실행)
- 앱인토스 CLI(`ax`) 와 MCP — Phase 3 진입 시 필요. 연결 가이드는 스킬이 안내함
- 이미지 생성 — Claude Code 가 이미지 생성 도구(이미지 생성 MCP 등)에 연결되어 있어야 함. 없을 경우 스킬이 프롬프트만 출력하므로 외부에서 이미지를 만들어 `/tmp/` 에 넣고 진행

## 디렉토리 구조

```
apps-in-toss-pipeline/
├── .claude-plugin/
│   └── plugin.json            플러그인 매니페스트
├── skills/
│   └── toss-pipeline/
│       ├── SKILL.md           파이프라인 정의
│       └── references/
│           ├── categories.md     9개 카테고리 + 트렌드 키워드
│           ├── asset-specs.md    로고/썸네일/키워드 규격
│           ├── description-guide.md  5섹션 상세 설명 가이드
│           └── granite-sdk.md    Granite SDK 표준 패턴 + 함정
├── scripts/
│   └── resize-image.ts        이미지 리사이즈 유틸 (sharp)
├── package.json
└── LICENSE                    MIT
```

## 기여

이슈/PR 환영. 큰 변경은 먼저 이슈로 논의 부탁드립니다.

## 라이선스

[MIT](./LICENSE)
