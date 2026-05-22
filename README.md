# apps-in-toss-pipeline

> 앱인토스(Apps in Toss) 미니앱 개발 파이프라인 — 아이디어부터 에셋 생성, 앱 구현까지 원스톱 자동화하는 Claude Code 플러그인.

`toss-pipeline` 스킬을 호출하면 다음 4개 Phase 를 순차적으로 진행합니다.

1. **Phase 1 — 주제 브레인스토밍**: 카테고리·트렌드를 기반으로 미니앱 아이디어 5개 제안 → 선택
2. **Phase 2 — 에셋 생성**: 앱 이름·부제·로고(600×600)·썸네일(1932×828)·상세 설명·검색 키워드·`metadata.json`
3. **Phase 3 — 앱 구현**: 앱인토스 MCP + Granite SDK 표준 패턴으로 WebView 또는 React Native 미니앱 구현
4. **Phase 4 — 출력 정리**: 등록 가이드 `README.md` + 최종 요약

## 설치

### 1) Claude Code 플러그인으로 설치

```bash
# 1) 로컬 클론
git clone https://github.com/HiImYong99/apps-in-toss-pipeline.git
cd apps-in-toss-pipeline

# 2) 의존성 설치 (이미지 리사이즈용 sharp 등)
npm install

# 3) 이 디렉토리를 플러그인으로 로드
claude --plugin-dir .
```

또는 마켓플레이스에 등록된 경우:

```bash
/plugin install apps-in-toss-pipeline
```

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
