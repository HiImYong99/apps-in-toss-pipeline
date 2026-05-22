---
name: toss-pipeline
description: 앱인토스 앱 개발 파이프라인 — 아이디어 브레인스토밍부터 에셋 생성, 앱 구현까지 원스톱 자동화
---

# 앱인토스 앱 개발 파이프라인

이 스킬은 앱인토스(Apps in Toss) 미니앱을 아이디어 구상부터 에셋 생성, 앱 구현까지 단계별로 안내합니다.
모든 단계는 순차적으로 실행하며, 각 Phase 완료 후 다음 Phase로 자동 전환합니다.

플러그인 루트: 이 스킬이 참조하는 파일은 Claude Code 가 주입하는 `${CLAUDE_PLUGIN_ROOT}` 환경변수를 기준으로 한다. SKILL.md 와 같은 폴더 안의 파일은 `references/...` 같은 상대경로로도 참조한다.

---

## Phase 1: 주제 브레인스토밍

### Step 1-1: 사용자 관심사 파악 (선택)

AskUserQuestion으로 사용자에게 질문합니다:

> 어떤 분야에 관심이 있으신가요? (예: 건강, 금융, 교육, 생산성 등)
> 특별히 만들고 싶은 앱이 있다면 키워드나 아이디어를 알려주세요.
> 없으면 Enter를 눌러 건너뛰셔도 됩니다.

### Step 1-2: 카테고리 및 트렌드 분석

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/categories.md` 파일을 읽어 9개 카테고리(금융/자산관리, 라이프스타일, 건강/운동, 교육, 쇼핑/커머스, 소셜, 생산성/도구, 엔터테인먼트, 여행/교통)의 트렌드 키워드와 예시 아이디어를 참고합니다.

사용자가 관심사를 입력한 경우 해당 카테고리 중심으로, 입력하지 않은 경우 전체 카테고리에서 트렌드 키워드를 분석하여 아이디어를 도출합니다.

### Step 1-3: 앱 아이디어 5개 제안

다음 형식으로 5개의 앱 아이디어를 생성합니다:

```
### 아이디어 1: {주제명}
- 타겟 사용자: {구체적인 사용자 그룹}
- 핵심 기능: {한 줄 요약}
- 예상 카테고리: {9개 카테고리 중 하나}
- 차별점: {기존 앱/서비스 대비 차별화 포인트}

### 아이디어 2: {주제명}
...
```

각 아이디어는 다음 기준을 충족해야 합니다:
- 토스 사용자(2030세대 중심)에게 실질적 가치 제공
- 미니앱 규모로 구현 가능 (WebView 또는 React Native)
- 게임 카테고리 제외
- **운영 부담 없는 구조**: 매일/매주 콘텐츠 업데이트가 필요한 아이디어는 제외. 사전 데이터셋, 결정론적 알고리즘, 또는 UGC 자동 순환 중 하나로 굴러가야 함

### Step 1-3.5: 운영 부담 자가검증

5개 아이디어 각각에 대해 다음 표를 작성하여 사용자에게 함께 보여줍니다:

```
| # | 주제 | 콘텐츠 공급원 | 운영 부담 | 통과 |
|---|------|--------------|----------|------|
| 1 | {주제} | {사전 데이터셋 / 알고리즘 / UGC / 매일 큐레이션} | {없음 / 낮음 / 높음} | ✓ / ✗ |
```

판정 기준:
- **사전 데이터셋**: 한 번 만들어 넣으면 끝나는 정적 콘텐츠(예: 100개 단어 풀, 운세 메시지 템플릿) → 통과
- **알고리즘/계산**: 사용자 입력만으로 결과가 도출(예: 칼로리 계산, 색상 매칭) → 통과
- **UGC 자동 순환**: 사용자끼리 콘텐츠를 만들어 굴러감(예: 익명 질문답변) → 통과
- **매일 큐레이션 필요**: 운영자가 매일 글/뉴스/추천을 올려야 함 → 탈락

탈락한 아이디어가 있으면 같은 카테고리에서 운영 부담 없는 대체안으로 즉시 교체합니다.

### Step 1-4: 사용자 선택

AskUserQuestion으로 선택을 요청합니다:

> 위 아이디어 중 하나를 선택해주세요 (1~5 번호 입력).
> 또는 직접 원하는 아이디어를 입력해주세요.

사용자가 번호를 선택하면 해당 아이디어를 확정하고, 직접 입력하면 입력된 아이디어를 기반으로 주제명, 타겟 사용자, 핵심 기능, 카테고리, 차별점을 정리합니다.

확정된 아이디어 정보를 이후 모든 Phase에서 참조할 수 있도록 기억합니다.

Phase 2로 자동 전환합니다.

---

## Phase 2: 에셋 생성

### Step 2-1: 앱 이름 생성

확정된 아이디어를 기반으로 앱 이름 후보를 생성합니다.

**한국어 이름 3개**: 2~4음절, 직관적이고 기억하기 쉬운 이름
**영어 이름 3개**: 1~2단어, 앱스토어 검색에 유리한 이름

```
한국어 이름 후보:
1. {한국어 이름 1}
2. {한국어 이름 2}
3. {한국어 이름 3}

영어 이름 후보:
1. {영어 이름 1}
2. {영어 이름 2}
3. {영어 이름 3}
```

AskUserQuestion으로 한국어 이름을 선택하게 합니다:

> 한국어 이름을 선택해주세요 (1~3 번호 입력 또는 직접 입력):

한국어 이름이 확정된 후, 영어 이름을 질문합니다.

AskUserQuestion으로 영어 이름을 선택하게 합니다:

> 영어 이름을 선택해주세요 (1~3 번호 입력 또는 직접 입력):

선택된 영어 이름을 kebab-case로 변환하여 프로젝트 디렉토리명으로 사용합니다.
예: "Receipt Snap" → `receipt-snap`

이 값이 `{app-name}`입니다. 이후 모든 Phase에서 이 값을 일관되게 사용합니다.

**Step 2-0: 출력 디렉토리 생성**

`{app-name}` 확정 즉시 출력 디렉토리를 생성합니다:

```bash
mkdir -p ~/Desktop/{app-name}/app/assets
```

이후 모든 파일은 이 디렉토리에 저장됩니다.

**사전 확인 (의존성 bootstrap)**: 이미지 리사이즈에 필요한 `sharp`/`tsx` 를 `${CLAUDE_PLUGIN_DATA}` 에 설치하고, 실행 시 ESM 모듈 해석이 깨지지 않도록 `scripts/` 도 같은 디렉토리에 동기화합니다. `${CLAUDE_PLUGIN_ROOT}` 는 플러그인 업데이트 시 변경되는 ephemeral 경로이므로 의존성과 그 의존성을 사용하는 스크립트는 반드시 `${CLAUDE_PLUGIN_DATA}` 에 보관해야 합니다.

다음을 한 번 실행합니다 (이미 설치되어 있고 `package.json` 이 변경되지 않았으면 npm install 은 자동으로 skip; `scripts/` 는 매번 동기화):

```bash
PLUGIN_DATA="${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}"
mkdir -p "${PLUGIN_DATA}"
if ! diff -q "${CLAUDE_PLUGIN_ROOT}/package.json" "${PLUGIN_DATA}/package.json" >/dev/null 2>&1; then
  cp "${CLAUDE_PLUGIN_ROOT}/package.json" "${PLUGIN_DATA}/package.json"
  [ -f "${CLAUDE_PLUGIN_ROOT}/package-lock.json" ] && cp "${CLAUDE_PLUGIN_ROOT}/package-lock.json" "${PLUGIN_DATA}/package-lock.json"
  (cd "${PLUGIN_DATA}" && npm install)
fi
rm -rf "${PLUGIN_DATA}/scripts"
cp -R "${CLAUDE_PLUGIN_ROOT}/scripts" "${PLUGIN_DATA}/scripts"
```

`${CLAUDE_PLUGIN_DATA}` 가 unset 또는 빈 값이면 (예: `claude --plugin-dir` 로컬 개발) `${CLAUDE_PLUGIN_ROOT}` 로 fallback 합니다. `npm install` 은 외부 npm registry 접근이 필요하므로 Phase 2 진입 시 네트워크가 가용해야 합니다.

### Step 2-2: 부제 생성

앱의 핵심 가치를 20자 이내로 요약하는 부제 후보 3개를 생성합니다.
부제는 앱인토스 미니홈 리스트에서 앱 이름 옆에 표시됩니다.

```
부제 후보:
1. {부제 1} ({글자 수}자)
2. {부제 2} ({글자 수}자)
3. {부제 3} ({글자 수}자)
```

부제 작성 원칙:
- 20자 이내
- 핵심 기능 또는 사용자 혜택을 한 문장으로
- "~하는 앱", "~도우미" 등 구체적 표현 사용
- 추상적 표현("최적화", "혁신적") 금지

AskUserQuestion:

> 부제를 선택해주세요 (1~3 번호 입력 또는 직접 입력):

### Step 2-3: 로고 생성

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/asset-specs.md` 파일을 읽어 로고 프롬프트 가이드를 참조합니다.

**프롬프트 구성 규칙**:
```
{영어 앱 이름} app icon, {컨셉 키워드 1}, {컨셉 키워드 2},
minimal design, {배경색} background, simple symbol,
fills 80% of the canvas, large centered symbol, minimal padding,
{포인트 색상 1} and {포인트 색상 2} accent, app store icon style, 600x600px
```

- 컨셉 키워드: 앱의 핵심 기능을 상징하는 오브젝트 2개 (예: 영수증+체크마크, 책+별)
- 배경색: 카테고리에 맞는 색상 선택
  - 금융: 파란색/초록색
  - 커뮤니티/소셜: 주황색/분홍색
  - 교육: 보라색/노란색
  - 건강: 초록색/하늘색
  - 생산성: 네이비/회색
- 스타일: 미니멀리즘, 단색 또는 2~3색, 심플한 심볼
- 구도: 메인 심볼이 캔버스의 80% 이상 차지, 여백 최소화
- 피해야 할 것: 실사 사진, 복잡한 배경, 과도한 텍스트, 3D 효과, 심볼이 작게 그려진 여백 과다 구도

이미지를 생성합니다. Claude Code 가 사용 가능한 이미지 생성 도구(예: 이미지 생성 MCP, 이미지 생성 가능한 모델 호출, 또는 사용자가 설정한 다른 이미지 생성 경로)로 위에서 구성한 프롬프트를 그대로 사용하여 `/tmp/toss-logo-raw.png` 에 저장합니다.

이미지 생성 도구가 없으면 사용자에게 다음과 같이 안내합니다:

> 이 환경에 이미지 생성 도구가 연결되어 있지 않습니다. 아래 프롬프트로 외부에서 이미지를 생성한 뒤 `/tmp/toss-logo-raw.png` 로 저장해주세요:
>
> ```
> {위에서 구성한 프롬프트}
> ```

생성된 이미지를 600x600으로 리사이즈합니다:

```bash
cd "${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}" && npx tsx scripts/resize-image.ts --input /tmp/toss-logo-raw.png --output "$HOME/Desktop/{app-name}/logo-600x600.png" --width 600 --height 600
```

생성된 로고 이미지를 사용자에게 보여주고 AskUserQuestion:

> 로고가 생성되었습니다. ~/Desktop/{app-name}/logo-600x600.png를 확인해주세요.
> 마음에 드시나요? (y: 확정 / n: 다른 프롬프트로 재생성)

사용자가 `n`을 선택하면 프롬프트를 수정하여 다시 생성합니다.

### Step 2-4: 썸네일 생성

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/asset-specs.md` 파일을 읽어 썸네일 프롬프트 가이드를 참조합니다.

**프롬프트 구성 규칙**:
```
{영어 앱 이름} promotional banner, "{부제 또는 핵심 기능}",
horizontal banner, 1932x828px, 16:9 ratio,
{컨셉 키워드 1}, {컨셉 키워드 2}, {컨셉 키워드 3},
Toss mini-app style, bright and friendly tone, {주요 색상 1} and {주요 색상 2}
```

- 컨셉 키워드: 앱의 핵심 기능/특징을 나타내는 3개 단어
- 색상: 로고와 조화되는 2~3가지 색상
- 톤: 밝고 긍정적, 토스 미니앱 브랜드 느낌
- 피해야 할 것: 세로형 구도, 과도한 텍스트, 어두운 톤

이미지를 생성합니다. Claude Code 가 사용 가능한 이미지 생성 도구로 위에서 구성한 프롬프트를 그대로 사용하여 `/tmp/toss-thumbnail-raw.png` 에 저장합니다.

이미지 생성 도구가 없으면 사용자에게 다음과 같이 안내합니다:

> 이 환경에 이미지 생성 도구가 연결되어 있지 않습니다. 아래 프롬프트로 외부에서 이미지를 생성한 뒤 `/tmp/toss-thumbnail-raw.png` 로 저장해주세요:
>
> ```
> {위에서 구성한 프롬프트}
> ```

생성된 이미지를 1932x828로 리사이즈합니다:

```bash
cd "${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}" && npx tsx scripts/resize-image.ts --input /tmp/toss-thumbnail-raw.png --output "$HOME/Desktop/{app-name}/thumbnail-1932x828.png" --width 1932 --height 828
```

생성된 썸네일을 사용자에게 보여주고 AskUserQuestion:

> 썸네일이 생성되었습니다. ~/Desktop/{app-name}/thumbnail-1932x828.png를 확인해주세요.
> 마음에 드시나요? (y: 확정 / n: 다른 프롬프트로 재생성)

사용자가 `n`을 선택하면 프롬프트를 수정하여 다시 생성합니다.

### Step 2-5: 상세 설명 작성

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/description-guide.md` 파일을 읽어 5섹션 가이드와 placeholder 양식을 참조합니다.

확정된 앱 정보(이름, 부제, 핵심 기능, 타겟 사용자, 카테고리)를 기반으로 5개 섹션 구조의 상세 설명을 작성합니다:

**1. 한 줄 소개** (15~40자)
- 앱 이름 또는 서비스명 포함
- 주요 기능 또는 혜택 1개만 명시
- 3초 안에 이해 가능한 문장

**2. 해결하는 문제** (150~300자)
- 실제 사용자가 겪는 불편함 2~3가지
- 감정적 공감 또는 시간/돈 손실 표현
- 추상적 표현 금지

**3. 사용 흐름** (250~500자)
- 사용자 시점(일인칭)으로 작성
- "열다" → "누르다" → "입력하다" → "본다" 등 구체적 동사
- 최초 접근부터 목표 달성까지 3~5단계

**4. 핵심 기능 3~5개** (150~350자)
- 각 기능을 한 줄에 12~25자
- 사용자 혜택 중심 표현 (기술 용어 X)
- 중요도 순 배열

**5. 이런 분께 추천해요** (100~300자)
- 구체적 사용자 페르소나 3~4개
- "누구" + "왜" 형태

전체 작성 원칙:
- 쉬운 단어, 구체적 표현, 사용자 시점
- 현재형/진행형 ("해요" 체), 이점 강조, 수치 활용
- 전체 분량: 650~1500자 (권장 1000자)

Step 2-5에서 작성한 상세 설명을 Write 도구로 `~/Desktop/{app-name}/description.md`에 저장합니다.

### Step 2-6: 검색 키워드 생성

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/asset-specs.md`의 검색 키워드 구성 가이드를 참조합니다.

다음 4가지 구성 요소에 따라 10~15개 키워드를 생성합니다:

**1. 카테고리 키워드 (2~3개)**: 앱이 속한 카테고리의 일반명사
**2. 핵심 기능 키워드 (3~5개)**: 앱의 주요 기능/특징 단어
**3. 사용자 니즈 키워드 (3~5개)**: 사용자 관점의 검색어
**4. 앱 이름 관련 키워드 (1~2개)**: 앱 이름, 약자, 유사어

키워드 작성 원칙:
- 2~4자 정도의 짧은 단어 또는 2단어 조합
- 실제 사용자 검색어 반영
- 같은 의미의 유사어 중복 피하기

### Step 2-7: metadata.json 저장

아래 JSON 구조를 실제 값으로 채워 Write 도구로 `~/Desktop/{app-name}/metadata.json`에 저장합니다:

```json
{
  "nameKo": "{한국어 앱 이름}",
  "nameEn": "{영어 앱 이름}",
  "subtitle": "{선택된 부제}",
  "description": "{한 줄 소개 텍스트}",
  "keywords": ["{키워드1}", "{키워드2}", "..."],
  "category": "{카테고리명}",
  "logo": "logo-600x600.png",
  "thumbnail": "thumbnail-1932x828.png",
  "createdAt": "{현재 ISO 8601 타임스탬프}"
}
```

Phase 2 완료를 알리고 Phase 3로 자동 전환합니다.

---

## Phase 3: 앱 구현

### Step 3-1: 앱인토스 MCP 연결 확인

앱인토스 CLI 및 MCP 연결 상태를 확인합니다:

```bash
which ax
```

`ax` 명령어가 없거나 MCP 연결이 안 되어 있는 경우, 사용자에게 안내합니다:

> 앱인토스 MCP가 연결되어 있지 않습니다. 다음 명령어로 연결해주세요:
> ```
> claude mcp add --transport stdio apps-in-toss ax mcp start
> ```
> 연결 후 다시 진행해주세요.

MCP가 연결되어 있으면 다음 단계로 진행합니다.

### Step 3-1.5: Granite SDK 표준 패턴 숙지

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/granite-sdk.md` 파일을 읽어 백버튼, 화면 전환, 인증, 흔한 함정을 숙지합니다.

특히 백버튼은 **반드시 `graniteEvent.backEvent`를 사용**해야 하며, `history.pushState`/`popstate`로 가로채면 네이티브 스택과 어긋나 동작이 깨집니다. 메서드 시그니처는 MCP에서 최종 확인합니다.

### Step 3-2: 기술 스택 결정

AskUserQuestion:

> 앱 구현 기술 스택을 선택해주세요:
> 1. WebView (HTML/CSS/JS) — 기본 추천, 빠른 개발 가능
> 2. React Native — 네이티브 기능 필요 시
>
> 번호를 입력해주세요 (기본: 1):

### Step 3-3: 프로젝트 스캐폴딩

선택된 기술 스택에 맞는 프로젝트 구조를 생성합니다.

```bash
mkdir -p ~/Desktop/{app-name}/app/src/styles
mkdir -p ~/Desktop/{app-name}/app/src/components
mkdir -p ~/Desktop/{app-name}/app/assets
cp ~/Desktop/{app-name}/logo-600x600.png ~/Desktop/{app-name}/app/assets/logo-600x600.png
```

**WebView 기술 스택인 경우** 다음 파일들을 생성합니다:

`~/Desktop/{app-name}/app/src/index.html` — 메인 HTML 파일
`~/Desktop/{app-name}/app/src/styles/main.css` — 스타일시트
`~/Desktop/{app-name}/app/package.json` — 프로젝트 메타데이터
`~/Desktop/{app-name}/app/toss.config.json` — 앱인토스 설정 파일

앱인토스 MCP를 통해 Granite SDK 문서를 참조하여 `toss.config.json`과 `package.json`의 올바른 구조를 확인합니다.

**프로젝트 구조** (WebView):
```
~/Desktop/{app-name}/
├── logo-600x600.png
├── thumbnail-1932x828.png
├── description.md
├── metadata.json
└── app/
    ├── src/
    │   ├── index.html
    │   ├── styles/
    │   │   └── main.css
    │   └── components/
    ├── assets/
    │   └── logo-600x600.png
    ├── package.json
    └── toss.config.json
```

### Step 3-4: 핵심 기능 구현

Step 3-1.5에서 읽은 `references/granite-sdk.md`의 표준 패턴과 함정을 우선 적용한 뒤, 앱인토스 MCP의 Granite SDK API 문서로 메서드 시그니처를 확정하여 다음을 구현합니다:

1. **기본 앱 셸**: Phase 1에서 정의한 핵심 기능에 맞는 UI 레이아웃
2. **Granite SDK 연동**:
   - 백버튼: `graniteEvent.backEvent` 핸들러 등록 (pushState/popstate 금지)
   - 화면 제어 (페이지 전환, 모달)
   - 외부 링크/타 미니앱 호출은 Granite API
   - 인증 (사용자 정보 접근이 필요한 경우): 자체 로그인 폼 만들지 말고 Granite 토큰 사용
3. **핵심 비즈니스 로직**: Phase 1에서 정의한 주요 기능 구현
4. **스타일링**: 토스 디자인 시스템과 조화되는 UI

구현 시 원칙:
- 토스 앱 내에서 동작하는 미니앱이므로 경량 구현
- 반응형 모바일 레이아웃 (최소 너비 320px, 최대 너비 428px)
- 토스 브랜드 톤에 맞는 깔끔한 디자인

### Step 3-5: 사용자 검토

구현 완료 후 사용자에게 요약을 보여줍니다:

```
## 구현 요약

- 기술 스택: {WebView / React Native}
- 생성된 파일: {파일 목록}
- 구현된 기능:
  1. {기능 1}
  2. {기능 2}
  3. {기능 3}

프로젝트 경로: ~/Desktop/{app-name}/app/
```

AskUserQuestion:

> 구현 결과를 확인해주세요. 수정이 필요한 부분이 있나요?
> (수정 사항을 입력하거나, "완료"를 입력하면 다음 단계로 넘어갑니다)

사용자가 수정 사항을 입력하면 해당 부분을 수정하고 다시 검토를 요청합니다.
"완료"를 입력하면 Phase 4로 전환합니다.

---

## Phase 4: 출력 정리

### Step 4-1: README.md 생성

`~/Desktop/{app-name}/README.md` 파일을 생성합니다. 내용 구성:

```markdown
# {한국어 앱 이름} ({영어 앱 이름})

> {부제}

## 앱 정보

| 항목 | 내용 |
|------|------|
| 한국어 이름 | {한국어 앱 이름} |
| 영어 이름 | {영어 앱 이름} |
| 부제 | {부제} |
| 카테고리 | {카테고리} |

## 생성된 에셋

| 파일 | 규격 | 설명 |
|------|------|------|
| `logo-600x600.png` | 600×600px PNG | 앱 아이콘 |
| `thumbnail-1932x828.png` | 1932×828px PNG | 프로모션 배너 |
| `description.md` | - | 앱 상세 설명 (5섹션) |
| `metadata.json` | - | 앱 메타데이터 |
| `app/` | - | 앱 소스 코드 |

## 상세 설명 미리보기

Step 2-5에서 작성한 `~/Desktop/{app-name}/description.md`를 읽어 한 줄 소개와 해결하는 문제 섹션을 여기에 인용합니다.

{description.md의 한 줄 소개 + 해결하는 문제 섹션}

## 검색 키워드

{키워드 목록을 쉼표로 나열}

## 앱인토스 콘솔 등록 방법

1. [앱인토스 콘솔](https://console.appsintoss.com)에 접속합니다
2. "새 앱 등록"을 클릭합니다
3. 앱 정보(이름, 부제, 카테고리)를 입력합니다
4. 로고(`logo-600x600.png`)와 썸네일(`thumbnail-1932x828.png`)을 업로드합니다
5. 상세 설명(`description.md` 내용)을 입력합니다
6. 검색 키워드를 등록합니다
7. 앱 바이너리를 업로드합니다

## 검수 체크리스트

- [ ] 앱 이름이 명확하고 서비스 내용을 반영하는가
- [ ] 로고가 600×600px PNG 형식이고 축소 시에도 식별 가능한가
- [ ] 썸네일이 1932×828px PNG 형식이고 프로모션 용도에 적합한가
- [ ] 상세 설명이 5개 섹션을 모두 포함하고 있는가
- [ ] 검색 키워드가 10개 이상이고 앱과 관련성이 높은가
- [ ] 앱이 정상적으로 실행되고 핵심 기능이 동작하는가
- [ ] Granite SDK 연동이 올바르게 작동하는가
- [ ] 모바일 레이아웃이 다양한 화면 크기에서 정상 표시되는가

## 다음 단계

1. **콘솔 등록**: https://console.appsintoss.com 에서 앱 등록
2. **검수 요청**: 등록 완료 후 검수 요청 제출
3. **출시**: 검수 통과 후 앱인토스 마켓플레이스에 자동 게시
```

### Step 4-2: 최종 요약 출력

파이프라인 완료 메시지를 사용자에게 보여줍니다:

```
============================================
  앱인토스 파이프라인 완료!
============================================

앱 이름: {한국어 이름} ({영어 이름})
부제: {부제}
카테고리: {카테고리}

출력 디렉토리: ~/Desktop/{app-name}/
├── logo-600x600.png       (앱 아이콘)
├── thumbnail-1932x828.png (프로모션 배너)
├── description.md         (앱 상세 설명)
├── metadata.json          (메타데이터)
├── README.md              (등록 가이드)
└── app/                   (앱 소스 코드)

다음 단계:
→ https://console.appsintoss.com 에서 앱을 등록하세요
→ 검수 요청 후 출시까지 약 1~3영업일 소요됩니다
============================================
```
