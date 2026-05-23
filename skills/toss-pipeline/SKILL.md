---
name: toss-pipeline
description: 앱인토스 앱 개발 파이프라인 — 아이디어 브레인스토밍부터 에셋 생성, 앱 구현까지 원스톱 자동화
---

# 앱인토스 앱 개발 파이프라인

이 스킬은 앱인토스(Apps in Toss) 비게임 미니앱을 아이디어 구상부터 에셋 생성, 앱 구현까지 단계별로 안내합니다. 모든 단계는 순차적으로 실행하며, 각 Phase 완료 후 다음 Phase로 자동 전환합니다.

플러그인 루트: 이 스킬이 참조하는 파일은 Claude Code 가 주입하는 `${CLAUDE_PLUGIN_ROOT}` 환경변수를 기준으로 합니다. SKILL.md 와 같은 폴더 안의 파일은 `references/...` 같은 상대경로로도 참조합니다.

핵심 참조 문서 (모든 Phase 에서 활용):
- `references/review-policy.md` — 검수 통과 정책 (출시 불가 카테고리, 다크패턴, 광고 정책, 외부 링크 제한, 생성형 AI 의무)
- `references/granite-sdk.md` — Granite SDK 운영 원칙·함정 (시그니처는 ax 위임)
- `references/design-system.md` — 디자인 토큰, 미니앱 UI 가이드, TDS 안내
- `references/categories.md` — 9개 카테고리 트렌드·아이디어
- `references/asset-specs.md` — 로고/썸네일 규격 + 검색 키워드 + AI 이미지 프롬프트
- `references/description-guide.md` — 상세 설명 5섹션 작성 가이드

SDK 시그니처가 필요하면 `ax search docs --query "<주제>"` → `ax get doc --id <id>` 로 공식 문서 직접 조회 (Phase 0 에서 ax 가 설치됨).

---

## Phase 0: Pre-flight (앱인토스 CLI + MCP 사전 체크)

다른 모든 작업에 앞서 앱인토스 CLI(`ax`)와 MCP 연결 상태를 확인합니다. CLI 가 있어야 공식 문서를 정확히 인용할 수 있고, MCP 가 연결되어 있으면 SDK 시그니처 조회가 빨라집니다.

### Step 0-1: `ax` CLI 존재 확인

```bash
which ax 2>/dev/null && ax help 2>&1 | head -1 || echo "AX_NOT_FOUND"
```

`AX_NOT_FOUND` 가 출력되면 사용자에게 안내합니다:

> 앱인토스 CLI(`ax`)가 설치되어 있지 않습니다.
> 공식 설치 명령:
> - macOS: `brew tap toss/tap && brew install ax`
> - Windows: `scoop bucket add toss https://github.com/toss/scoop-bucket.git && scoop install ax`
> 설치 후 새 터미널에서 다시 이 스킬을 실행해주세요.

AskUserQuestion 으로 진행 방식을 묻습니다:

> `ax` 설치 여부를 어떻게 할까요?
> 1. (권장) 지금 자동 설치 — macOS면 `brew tap toss/tap && brew install ax` 실행
> 2. 직접 설치 후 재진입 — 위 명령을 사용자가 직접 실행
> 3. CLI 없이 계속 진행 — references 폴더의 캐시된 가이드만 사용 (정확도 일부 저하 가능)

`1` 선택 시 다음을 실행합니다 (실패 시 출력을 그대로 사용자에게 보여줌):

```bash
brew tap toss/tap && brew install ax
```

`3` 을 선택하면 이후 단계에서 ax 호출이 필요한 곳을 references 기반으로 대체하고 "MCP 미연결 모드" 로 기억합니다.

### Step 0-2: Claude Code MCP 등록 확인

```bash
claude mcp list 2>/dev/null | grep -i apps-in-toss || echo "NOT_REGISTERED"
```

`NOT_REGISTERED` 가 출력되면 AskUserQuestion:

> 앱인토스 MCP 가 Claude Code 에 등록되어 있지 않습니다.
> 1. (권장) 지금 자동 등록 — `claude mcp add --transport stdio apps-in-toss ax mcp start` 실행
> 2. 직접 실행 후 재진입
> 3. MCP 없이 계속 진행 — `ax` CLI 직접 호출로 대체

`1` 선택 시:

```bash
claude mcp add --transport stdio apps-in-toss ax mcp start
```

등록 직후 동일 세션에서는 MCP 가 즉시 로드되지 않을 수 있습니다. MCP 호출이 실패하면 사용자에게 세션 재시작을 안내하거나, 이 세션에서는 `ax search docs` / `ax get doc` 직접 호출로 대체합니다.

### Step 0-3: 공식 AI 컨텍스트 안내 (선택)

토스가 제공하는 공식 LLM 컨텍스트 URL 도 함께 활용할 수 있음을 사용자에게 한 줄 안내합니다 (별도 액션 없음):

> 참고: 토스 공식 AI 컨텍스트 — `https://developers-apps-in-toss.toss.im/llms.txt` (기본), `https://developers-apps-in-toss.toss.im/llms-full.txt` (확장). Cursor/Claude 의 docs 인덱싱에 추가하면 SDK 답변 정확도가 올라갑니다. 또 Claude Code 마켓플레이스의 `/plugin install knowledge-skills@apps-in-toss-skills` 가 docs-search 보조 스킬을 제공합니다.

Phase 1 로 자동 전환합니다.

---

## Phase 1: 주제 브레인스토밍

### Step 1-1: 사용자 관심사 파악 (선택)

AskUserQuestion으로 사용자에게 질문합니다:

> 어떤 분야에 관심이 있으신가요? (예: 건강, 금융, 교육, 생산성 등)
> 특별히 만들고 싶은 앱이 있다면 키워드나 아이디어를 알려주세요.
> 없으면 Enter를 눌러 건너뛰셔도 됩니다.

### Step 1-2: 카테고리 및 정책 확인

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/categories.md` 와 `${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/review-policy.md` §1, §2 를 함께 읽습니다.

- categories.md 의 9개 카테고리 트렌드 키워드와 예시 아이디어를 참고
- review-policy.md §1 의 출시 불가 카테고리(디지털자산/NFT, 자금세탁, 사행성, 금융상품 중개, 투자 자문, 의료 마케팅, 단순 자사 홍보)와 §2 의 어뷰징 방지 정책(동일 핵심기능 중복, 동일 브랜드 다중 출시)을 자동 배제 기준으로 적용

### Step 1-3: 앱 아이디어 5개 제안

다음 형식으로 5개의 앱 아이디어를 생성합니다:

```
### 아이디어 1: {주제명}
- 타겟 사용자: {구체적인 사용자 그룹}
- 핵심 기능: {한 줄 요약}
- 예상 카테고리: {9개 카테고리 중 하나}
- 차별점: {기존 앱/서비스 대비 차별화 포인트}
- 정책 적합성: {review-policy.md §1·§2 위반 없음을 한 줄로 확인}
```

기준:
- 토스 사용자(2030 세대 중심) 실질적 가치 제공
- 미니앱 규모로 구현 가능 (WebView 또는 React Native)
- 게임 카테고리 제외
- review-policy.md §1 출시 불가 카테고리 해당 없음
- **운영 부담 없는 구조**: 매일/매주 콘텐츠 업데이트 필요 X. 사전 데이터셋, 결정론적 알고리즘, 또는 UGC 자동 순환 중 하나로 굴러가야 함

### Step 1-3.5: 운영 부담 + 정책 자가검증

5개 아이디어 각각에 대해 다음 표를 작성하여 사용자에게 함께 보여줍니다:

```
| # | 주제 | 콘텐츠 공급원 | 운영 부담 | 정책 적합 | 통과 |
|---|------|--------------|----------|----------|------|
| 1 | {주제} | {사전 데이터셋/알고리즘/UGC/매일 큐레이션} | {없음/낮음/높음} | {OK/위반: §X.Y} | ✓/✗ |
```

콘텐츠 공급원 판정:
- **사전 데이터셋**: 한 번 만들어 넣으면 끝나는 정적 콘텐츠 → 통과
- **알고리즘/계산**: 사용자 입력만으로 결과 도출 → 통과
- **UGC 자동 순환**: 사용자끼리 콘텐츠를 만들어 굴러감 → 통과
- **매일 큐레이션 필요**: 운영자가 매일 글/뉴스/추천 등록 → 탈락

정책 적합 판정 (review-policy.md):
- §1.1 디지털 자산·NFT — 위반시 탈락
- §1.2 자금세탁 가능 흐름 — 탈락
- §1.3 불법·부정행위 조장 — 탈락
- §1.4 사행성·복권·베팅 — 탈락
- §1.5 금융상품 중개·판매·광고 — 탈락
- §1.6 투자 자문·리딩 — 탈락
- §1.7 의료 행위·병원 마케팅 (공공데이터 단순 조회만 예외) — 탈락
- §1.8 단순 자사 홍보 — 탈락
- §1 추가 제한: 쇼핑몰(고객센터·가품방지·환불정책 부재) / 교육(자격증 없이 수익화) — 탈락
- §2 어뷰징 (동일 워크스페이스 유사 기능 중복, 동일 브랜드 다중 출시) — 탈락
- §4 자사 앱 설치 유도·외부 결제창 의존 — 탈락

탈락한 아이디어는 같은 카테고리에서 정책 적합한 대체안으로 즉시 교체합니다.

### Step 1-4: 사용자 선택

AskUserQuestion 으로 선택을 요청합니다:

> 위 아이디어 중 하나를 선택해주세요 (1~5 번호 입력).
> 또는 직접 원하는 아이디어를 입력해주세요.

사용자가 번호를 선택하면 해당 아이디어를 확정하고, 직접 입력하면 입력된 아이디어를 review-policy.md §1·§2 기준으로 한 번 더 검증한 뒤 주제명, 타겟 사용자, 핵심 기능, 카테고리, 차별점을 정리합니다.

확정된 아이디어 정보를 이후 모든 Phase 에서 참조할 수 있도록 기억합니다.

### Step 1-5: 구현 가능 범위 확정

이 단계는 두 부분으로 나뉩니다:
- **(A) 사용자에게 묻는 항목** — BM·제품 결정 (광고, 콘텐츠 운영 모델 재확인).
- **(B) 플러그인이 자동 추론하는 항목** — 확정된 아이디어에서 결정 가능한 것 (인증, 권한, 외부 의존, 결제/송금, 생성형 AI 사용 여부).

#### (A) 사용자에게 묻는 항목

AskUserQuestion 으로 묻습니다. **multi-select** 항목은 `multiSelect: true`. "없음" 은 다른 옵션과 상호배제.

**A-1. 광고 사용 여부** *(multi-select)*
> 이 앱에 광고를 넣을 계획인가요? (해당 항목 모두 선택, 복수 가능)
> - 없음
> - 리워드 광고
> - 배너 광고
> - 전면 광고

광고 사용 답변이 있으면 다음을 강제 정책으로 안내 (별도 질문 없이 적용):
- 광고 노출 사전 고지 UI (AD 뱃지·안내) 포함
- 광고 SDK 로드 중 목업/플레이스홀더 광고 금지
- 스플래시·로딩·결과 토스트 등 일시 화면에 배너 광고 금지
- 사용자 행위와 무관한 갑작스러운 전면 광고 금지

(상세 규정: review-policy.md §6)

**A-2. 콘텐츠 운영 모델 재확인**
Step 1-3.5 에서 통과한 운영 부담 모델(사전 데이터셋/알고리즘/UGC)을 한 줄로 명시하여 사용자에게 확인받습니다.

#### (B) 플러그인이 자동 추론하는 항목

다음은 확정된 아이디어(주제·타겟·핵심기능·카테고리·차별점)를 기반으로 플러그인이 결정합니다. 사용자에게 묻지 않고, 마지막에 검증 결과로 한꺼번에 보여주고 override 받습니다.

**B-1. 사용자 인증**

추론 기준:
- 사용자별 데이터(개인 기록, 즐겨찾기, 사용자 간 인터랙션, 결제·송금) → "Granite 인증 토큰" 이상
- 백엔드 저장 필요 → "백엔드 세션" (Granite 인증 토큰 → 자체 서버 검증, mTLS 인증서 필수)
- 클라이언트만 동작 + 사용자별 식별 불필요 → "불필요"
- 결제/송금 흐름 있음 → 자동으로 "Granite 인증 토큰" 이상

자체 로그인 폼 어떤 경우에도 금지 (granite-sdk.md §5, review-policy.md §7 의 "자체 로그인 폼 금지" 항목).

**B-2. 디바이스 권한** (다중)

- 사진/영수증/QR/얼굴 분석 등 이미지 입력 → `camera`, `photos`
- 주변 매장·길찾기·지역 기반 → `location`
- 음성 입력·녹음 → `microphone`
- 리마인더·정기 알림 → `notification`
- 클립보드 복사·붙여넣기 → `clipboard`
- 외부 파일 가져오기/내보내기 → `files`
- 위 조건 없음 → `없음`

`granite.config.ts` 의 `permissions: [{name, access}, ...]` 객체 배열 형태로 선언. access 값은 `ax search docs --query "permission"` 확인.

**B-3. 외부 API / 서버 의존** (다중, "없음" 단독)

- 핵심 기능이 사전 데이터셋만으로 동작 → `정적 데이터(JSON) 번들`
- 사용자별 데이터 저장·동기, 인증 토큰 교환 → `자체 백엔드 API`
- 실시간 외부 정보(환율, 날씨, 지도, 시세) → `제3자 API`
- 전부 클라이언트 결정론적 계산 → `없음`

자체 백엔드 또는 제3자 API 가 있으면 mTLS·CORS·키 보안·실패 fallback UX 가 Phase 3 자가 점검에 추가.

**B-4. 결제 / 송금** (다중)

- 핵심 기능에 "결제", "구매", "주문" → `토스 결제 API`
- 핵심 기능에 "송금", "정산", "더치페이", "선물하기(현금성)" → `토스 송금 API`
- 그 외 → `없음`

자체 결제 위젯 금지. Granite 결제·송금 API 시그니처는 `ax search docs --query "간편 결제"` / `"송금"` 확인. mTLS 인증서 발급·IP 화이트리스트 필요.

**B-5. 생성형 AI 사용**

- 핵심 기능에 "AI", "생성", "요약", "추천", "자동 작성", "이미지 생성", "챗봇" 등 → `사용함`
- 그 외 → `사용 안 함`

`사용함` 인 경우 Phase 3 에서 다음을 필수 구현 (review-policy.md §5):
- 최초 사용 시 "생성형 AI 활용 안내" 화면
- AI 결과물마다 "AI 생성" 라벨·뱃지·워터마크

#### 검증 결과 정리

다음 형식으로 사용자에게 요약을 보여주고 동의를 받습니다:

```
## 구현 범위 확정

[사용자 결정]
- 광고: {없음 / 리워드 / 배너 / 전면 (복수)} {광고 있으면: 사전 고지 UI ON · 목업 광고 금지 · 일시 화면 배너 금지 · 예상 못한 광고 금지}
- 콘텐츠 운영 모델: {한 줄}

[플러그인 자동 추론]
- 인증: {불필요 / Granite 인증 토큰 / 백엔드 세션}     ← {추론 근거 한 줄}
- 권한: {없음 / camera, photos, ...}              ← {추론 근거 한 줄}
- 외부 의존: {없음 / 정적 / 자체 API / 제3자 API}  ← {추론 근거 한 줄}
- 결제/송금: {없음 / 토스 결제 / 토스 송금 (복수)}  ← {추론 근거 한 줄}
- 생성형 AI: {사용함 (사전 고지+결과물 표시 필수) / 사용 안 함} ← {추론 근거 한 줄}

이 범위로 진행할까요?
- y: 그대로 진행
- 자동 추론 항목 중 X를 바꾸고 싶다 (어떤 항목/어떻게)
```

사용자가 자동 추론을 수정 요청하면 해당 항목만 갱신한 뒤 다시 요약을 보여줍니다. `y` 이면 이 결정 사항을 Phase 2/3/4 가 참조할 수 있도록 기억합니다.

Phase 2 로 자동 전환합니다.

---

## Phase 2: 에셋 생성

### Step 2-1: 앱 이름 생성

확정된 아이디어를 기반으로 앱 이름 후보를 생성합니다.

**한국어 이름 3개**: 2~4 음절, 직관적이고 기억하기 쉬운 이름
**영어 이름 3개**: 1~2 단어, 앱스토어 검색에 유리한 이름

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

AskUserQuestion 한국어 → 영어 순서로 각각 선택받습니다. 선택된 영어 이름을 kebab-case 로 변환하여 프로젝트 디렉토리명(`{app-name}`)으로 사용합니다.

예: "Receipt Snap" → `receipt-snap`

이 값을 이후 모든 Phase 에서 일관되게 사용합니다.

### Step 2-1.5: 출력 디렉토리 + 의존성 준비

`{app-name}` 확정 즉시 출력 디렉토리를 만들고 의존성을 준비합니다.

```bash
mkdir -p ~/Desktop/{app-name}/app/assets
```

**의존성 bootstrap**: 이미지 리사이즈·SVG 렌더에 필요한 `sharp`/`tsx` 를 `${CLAUDE_PLUGIN_DATA}` 에 설치하고 `scripts/` 를 동기화합니다.

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

`${CLAUDE_PLUGIN_DATA}` 가 unset 이면 `${CLAUDE_PLUGIN_ROOT}` 로 fallback.

### Step 2-2: 부제 생성

앱의 핵심 가치를 20자 이내로 요약하는 부제 후보 3개를 생성합니다.

```
부제 후보:
1. {부제 1} ({글자 수}자)
2. {부제 2} ({글자 수}자)
3. {부제 3} ({글자 수}자)
```

원칙:
- 20자 이내
- 핵심 기능 또는 사용자 혜택을 한 문장으로
- "~하는 앱", "~도우미" 등 구체적 표현
- 추상적 표현("최적화", "혁신적") 금지

AskUserQuestion 으로 선택받습니다.

### Step 2-3: 디자인 토큰 결정

`references/design-system.md` §1 (typographic-bold 단일 패턴) 을 읽어 다음을 결정합니다:

1. **`--bg` 컬러** — 카테고리별 추천 페어 (§1.b 표). 캔버스 단색 배경. 카테고리 기본값을 1차 추천으로 보여주고, 후보 BG 2~3개 제시
2. **`--accent` 컬러** — 카테고리별 페어 추천. 액센트 글자·강조 요소 컬러. `--bg` 와 보색·삼각배색 관계, WCAG AA 대비 통과
3. **`--text` 컬러** — `--bg` 명도에 따라 자동 결정 (밝은 BG → `#1A1A1A`, 어두운 BG → `#FFFFFF`). 명시적 override 가능
4. **앱이름 분할 + 액센트 글자**
   - 한글 앱이름 4자 이상 → 2줄 분할 (`titleLine1` / `titleLine2`). 예: `데일리` / `단어`
   - 한글 3자 이하 → 1줄만 (`titleLine1` 만)
   - 끝에 액센트 글자 1개 (`accentChar`) — 앱 정체성 한 글자 또는 숫자. 예: `5`, `?`, `₩`, `↑`, `★`, `토`. 생략 가능
5. **영문 태그라인** — 로고 하단 letter-spaced 1~2단어 (예: `DAILY WORD`, `MONEY LEAF`). 생략 가능

AskUserQuestion 으로 `--bg`/`--accent` 페어 · `titleLine1`/`titleLine2`/`accentChar` · `tagline` 3가지를 확정합니다.

### Step 2-4: 로고 생성 (SVG 템플릿 우선)

`scripts/render-svg-asset.ts` 로 결정론적으로 PNG 를 생성합니다 (typographic-bold 패턴).

```bash
cd "${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}" && npx tsx scripts/render-svg-asset.ts \
  --template logo \
  --bg "{BG_HEX}" \
  --accent "{ACCENT_HEX}" \
  --text "{TEXT_HEX}"                  # 선택, 기본 #1A1A1A
  --title-line1 "{한글 라인1}" \
  --title-line2 "{한글 라인2}"         # 선택, 비우면 1줄 로고
  --accent-char "{액센트 글자}"        # 선택, 1글자 권장 (예: 5, ?, ★)
  --tagline "{영문 태그}"              # 선택, 비우면 미출력
  --output "$HOME/Desktop/{app-name}/logo-600x600.png"
```

생성된 로고를 사용자에게 보여주고 AskUserQuestion:

> 로고가 생성되었습니다. ~/Desktop/{app-name}/logo-600x600.png 를 확인해주세요.
> 1. 확정 — 이대로 사용
> 2. 색상/라인 분할/액센트 글자/태그 변경 — Step 2-3 으로 돌아가 재생성
> 3. AI 이미지 fallback — `references/asset-specs.md` 의 AI 프롬프트 가이드로 생성 시도

`3` 선택 시 asset-specs.md 의 로고 프롬프트 가이드를 참조해 AI 이미지를 생성하고 `/tmp/toss-logo-raw.png` 에 저장, 이후 `scripts/resize-image.ts` 로 600×600 PNG 변환:

```bash
cd "${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}" && npx tsx scripts/resize-image.ts \
  --input /tmp/toss-logo-raw.png \
  --output "$HOME/Desktop/{app-name}/logo-600x600.png" \
  --width 600 --height 600
```

### Step 2-5: 썸네일 생성 (SVG 템플릿 우선)

같은 `--bg`/`--accent`/`--text`/`--accent-char` 토큰 + 풀 한글 앱이름 + 부제 + feature pills 로 썸네일을 생성합니다.

```bash
cd "${CLAUDE_PLUGIN_DATA:-${CLAUDE_PLUGIN_ROOT}}" && npx tsx scripts/render-svg-asset.ts \
  --template thumbnail \
  --bg "{BG_HEX}" \
  --accent "{ACCENT_HEX}" \
  --text "{TEXT_HEX}"                  # 선택, Step 2-4 와 동일
  --accent-char "{액센트 글자}" \
  --title-ko "{한국어 앱 이름 풀네임}" \
  --subtitle "{부제 한 줄}" \
  --pills "{핵심기능 키워드 3개 콤마구분}" \
  --sub "{영문 sub, letter-spaced}" \
  --output "$HOME/Desktop/{app-name}/thumbnail-1932x828.png"
```

원칙:
- `--pills` 최대 3개, 각 2~5자 (예: `"토익,비즈니스,일상회화"`). 검정 솔리드 배경 + 흰 글자로 렌더됨
- 이모지 pill 은 비권장 (librsvg silhouette 이슈)
- `--sub` 는 영문 letter-spaced (예: `"DAILY WORD · 30 SEC QUIZ"`)

사용자에게 보여주고 동일한 3-옵션 확인 (확정/재생성/AI fallback).

### Step 2-6: 상세 설명 작성

`references/description-guide.md` 의 5섹션 가이드를 따라 작성합니다:

1. **한 줄 소개** (15~40자)
2. **해결하는 문제** (150~300자)
3. **사용 흐름** (250~500자, 일인칭, 구체적 동사)
4. **핵심 기능 3~5개** (각 12~25자)
5. **이런 분께 추천해요** (100~300자)

원칙: 쉬운 단어, 구체적 표현, 현재형 "해요" 체, 이점 강조, 수치 활용. 전체 650~1500자 (권장 1000자).

작성 완료 후 `~/Desktop/{app-name}/description.md` 에 저장.

### Step 2-7: 검색 키워드 생성

`references/asset-specs.md` 의 검색 키워드 4구성(카테고리/핵심기능/사용자니즈/앱이름) 기준으로 10~15개 키워드를 생성.

원칙: 2~4자 짧은 단어 또는 2단어 조합, 실제 검색어 반영, 유사어 중복 피하기.

### Step 2-8: metadata.json 저장

```json
{
  "nameKo": "{한국어 앱 이름}",
  "nameEn": "{영어 앱 이름}",
  "subtitle": "{선택된 부제}",
  "description": "{한 줄 소개 텍스트}",
  "keywords": ["{키워드1}", "{키워드2}", "..."],
  "category": "{카테고리명}",
  "design": {
    "pattern": "typographic-bold",
    "bg": "{BG_HEX}",
    "accent": "{ACCENT_HEX}",
    "text": "{TEXT_HEX}",
    "titleLine1": "{한글 라인1}",
    "titleLine2": "{한글 라인2 또는 빈 문자열}",
    "accentChar": "{액센트 글자 또는 빈 문자열}",
    "tagline": "{영문 태그 또는 빈 문자열}"
  },
  "logo": "logo-600x600.png",
  "thumbnail": "thumbnail-1932x828.png",
  "createdAt": "{현재 ISO 8601 타임스탬프}"
}
```

`~/Desktop/{app-name}/metadata.json` 에 저장.

Phase 3 로 자동 전환합니다.

---

## Phase 3: 앱 구현

### Step 3-1: Granite SDK 원칙 숙지

`${CLAUDE_PLUGIN_ROOT}/skills/toss-pipeline/references/granite-sdk.md` 를 처음부터 끝까지 읽어 다음을 모두 숙지합니다:

- §1 백버튼 단일화 + 루트 화면 종료 + [2005] 에러 회피
- §2 공통 내비게이션 바 (자동 제공 + `withBackButton`/`withHomeButton`/`initialAccessoryButton`)
- §3 viewport / pinch-zoom 비활성화
- §4 화면 전환 / iframe 금지 / 외부 링크 Granite API
- §5 인증 / 권한
- §6 광고 정책 + 운영 패턴
- §7 결제 / 송금
- §8 흔한 함정 표

함께 `references/review-policy.md` 도 다시 한 번 훑어 검수 정책 (§3 다크패턴, §4 외부 링크, §5 생성형 AI, §6 광고) 을 머릿속에 둡니다.

### Step 3-2: 기술 스택 결정

AskUserQuestion:

> 앱 구현 기술 스택을 선택해주세요:
> 1. (권장) WebView — `@apps-in-toss/web-framework`, 빠른 개발, 토스 디자인 시스템 `@toss/tds-mobile`
> 2. React Native — `@apps-in-toss/framework` + `@granite-js/react-native`, 네이티브 기능 필요 시
>
> 번호를 입력해주세요 (기본: 1):

### Step 3-3: 공식 부트스트랩 (`create-ait-app`)

수동 디렉토리·파일 생성이 아니라 토스가 제공하는 공식 부트스트랩 CLI 를 사용합니다.

Phase 2 가 이미 `~/Desktop/{app-name}/` 에 logo/thumbnail/description/metadata 를 만들어 두었으므로, `create-ait-app` 이 같은 경로를 비어 있는 디렉토리로 요구할 수 있습니다. **충돌을 피하기 위해 Phase 2 산출물을 임시 폴더로 옮기고, 부트스트랩 후 복원합니다**:

```bash
# 1. Phase 2 산출물 임시 이동
ASSETS_TMP=$(mktemp -d)
mv ~/Desktop/{app-name}/logo-600x600.png ~/Desktop/{app-name}/thumbnail-1932x828.png \
   ~/Desktop/{app-name}/description.md ~/Desktop/{app-name}/metadata.json \
   "$ASSETS_TMP"/ 2>/dev/null || true
# 같이 만들어진 디버그 SVG 가 있으면 함께 이동
mv ~/Desktop/{app-name}/logo-600x600.svg ~/Desktop/{app-name}/thumbnail-1932x828.svg "$ASSETS_TMP"/ 2>/dev/null || true
rmdir ~/Desktop/{app-name}/app 2>/dev/null || true
rmdir ~/Desktop/{app-name} 2>/dev/null || true

# 2. 공식 부트스트랩
cd ~/Desktop && npx create-ait-app {app-name}

# 3. 의존성 설치
cd ~/Desktop/{app-name} && npm install

# 4. Phase 2 산출물 복원 (프로젝트 루트로)
mv "$ASSETS_TMP"/* ~/Desktop/{app-name}/
rmdir "$ASSETS_TMP"
```

대화형 프롬프트에서 다음을 선택:

| 항목 | 권장 답변 |
|------|----------|
| TDS (Toss Design System) | **사용** (비게임 미니앱 필수) |
| AI Skills | **추가** (Claude Code/Cursor/Codex 컨텍스트) |
| 예제 코드 | 광고/인증/결제 등 Phase 1 Step 1-5 에서 추론된 항목에 맞는 예제 포함 |

생성된 프로젝트 구조 (대략):

```
~/Desktop/{app-name}/
├── logo-600x600.png       (Phase 2)
├── thumbnail-1932x828.png (Phase 2)
├── description.md         (Phase 2)
├── metadata.json          (Phase 2)
├── app/  또는 src/ 등 create-ait-app 이 만든 프로젝트 루트
│   ├── granite.config.ts  ← 핵심 설정 파일
│   ├── package.json
│   ├── (WebView) index.html, src/
│   └── (RN) ...
```

> 부트스트랩이 사용하는 정확한 폴더명·구조는 `create-ait-app` 의 출력이 결정합니다. 생성된 디렉토리 구조를 그대로 사용.

### Step 3-4: `granite.config.ts` 설정

Step 1-5 결과와 Phase 2 metadata 를 반영해 `granite.config.ts` 를 수정합니다. 예 (WebView):

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '{app-name}',                       // kebab-case, 콘솔 등록 ID 와 동일해야 함
  brand: {
    displayName: '{한국어 앱 이름}',            // 사용자에게 노출되는 이름
    primaryColor: '{Phase 2 design.bg}',       // 예: '#FFCD3C' (typographic-bold --bg 와 동일)
    icon: '',                                  // 콘솔 등록 후 업로드한 이미지 URL 로 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [
    // Step 1-5 B-2 추론 결과를 객체 배열로
    // { name: 'camera', access: 'access' },
    // { name: 'photos', access: 'read' },
  ],
  navigationBar: {
    withBackButton: true,                      // 공통 내비 뒤로가기 (자체 헤더에 X 추가 금지)
    withHomeButton: true,                      // 비게임 미니앱은 좌측 홈 버튼 가능
    // initialAccessoryButton: {                // 더보기 왼쪽 모노톤 아이콘 1개, 필요 시
    //   id: 'heart', title: '하트', icon: { name: 'icon-heart-mono' },
    // },
  },
  outdir: 'dist',
  webViewProps: {
    type: 'partner',                           // 비게임은 'partner'
  },
});
```

React Native 의 경우 `granite.config.ts` 구조가 다릅니다 (`plugins: [appsInToss({brand, permissions})]` 형태). `ax search docs --query "공통 설정"` 으로 정확한 구조 확인.

### Step 3-5: 핵심 기능 구현

Step 1-5 의 자동 추론 결과와 review-policy.md / granite-sdk.md 를 종합 적용해 구현합니다.

**필수 구현 사항**

1. **기본 앱 셸** — 핵심 기능에 맞는 화면 1~3개
2. **공통 내비게이션 바 연동**
   - 자체 헤더에 별도 뒤로가기·로고·X 버튼 그리지 않음
   - `granite.config.ts` 의 `brand.icon` 에 콘솔 업로드 후 이미지 URL 입력 예정 (Phase 4)
   - 필요하면 `withBackButton`, `withHomeButton`, `initialAccessoryButton` 설정 (모노톤 아이콘만, 1개만)
3. **백버튼 핸들러** (granite-sdk.md §1)
   - Granite 백 이벤트 API 사용 (시그니처 `ax search docs --query "뒤로가기"`)
   - 핸들러 순서: 모달 닫기 → 라우터 백 → 루트면 네이티브 종료에 맡김
   - `pushState`/`popstate`/`window.close()` 금지
4. **viewport meta** (WebView, granite-sdk.md §3)
   - `index.html` 에 `user-scalable=no, maximum-scale=1.0` viewport meta
   - `main.css` 에 `touch-action: manipulation`
5. **인증** (Step 1-5 B-1 이 "Granite 인증 토큰" 또는 "백엔드 세션" 인 경우)
   - 자체 로그인 폼 X
   - Granite 인증 토큰 → (백엔드 세션이면) mTLS 로 서버 검증
6. **광고** (Step 1-5 A-1 이 "없음" 이 아닌 경우, granite-sdk.md §6 + review-policy.md §6)
   - `loadFullScreenAd` / `showFullScreenAd` 또는 `TossAds.initialize`/`attachBanner` — 시그니처 `ax search docs --query "광고"`
   - `isSupported()` fallback
   - 일시 화면에 배너 X
   - SDK 로드 중 placeholder/목업 광고 X
   - AD 뱃지/사전 안내 UI
   - 사용자 액션 뒤에만 전면 광고
7. **결제·송금** (Step 1-5 B-4)
   - Granite 결제·송금 API 만 사용, 자체 결제 위젯 X
8. **생성형 AI 안내·표시** (Step 1-5 B-5 가 "사용함" 인 경우, review-policy.md §5)
   - 최초 사용 시 "생성형 AI 활용 안내" 화면
   - AI 결과물마다 라벨·뱃지·워터마크
9. **외부 링크·결제 의존 금지** (review-policy.md §4)
   - 핵심 기능을 외부 링크에 의존 X
   - 자사 앱 설치 유도 X
   - 외부 URL 은 Granite 외부 링크 API 만
10. **다크패턴 방지** (review-policy.md §3)
    - 진입 직후 바텀시트 X
    - 뒤로가기 시 바텀시트 X
    - 모든 화면에 나갈 선택지 존재
    - CTA 라벨은 다음 행동을 명확히 표현
11. **iframe 금지** (granite-sdk.md §4) — YouTube embed 만 예외
12. **TDS 컴포넌트 사용** — `@toss/tds-mobile` 의 Button/Text 등 (시그니처 `ax search tds-web` 또는 `ax search tds-rn`)

**구현 직후 자가 점검 (Step 3-6 검토 전에 반드시 통과)**

- [ ] `granite.config.ts` 의 `appName`/`brand`/`primaryColor`/`webViewProps.type` 정확
- [ ] `permissions` 가 객체 배열 `{name, access}` 형태
- [ ] (WebView) `index.html` 에 `user-scalable=no` viewport meta
- [ ] 자체 헤더에 뒤로가기·로고·X 버튼 없음
- [ ] 백 핸들러 루트 화면에서 네이티브 종료 허용 (Granite API 사용)
- [ ] `pushState`/`popstate`/`window.close()`/`history.back()`/`window.onbeforeunload` 흔적 없음
- [ ] (광고 사용 시) 일시 화면 배너 없음, placeholder 광고 없음, AD 뱃지 있음, 사용자 액션 뒤 전면 광고만
- [ ] 자체 로그인 폼 없음
- [ ] iframe 없음 (YouTube 예외)
- [ ] (생성형 AI 사용 시) 사전 고지 + 결과물 표시
- [ ] 외부 결제창/외부 회원가입 페이지로 빠지는 흐름 없음
- [ ] 모든 화면에 나갈 선택지 (백/닫기/거절) 존재
- [ ] CTA 라벨이 다음 행동을 명확히 표현

### Step 3-6: 사용자 검토

구현 완료 후 사용자에게 요약을 보여줍니다:

```
## 구현 요약

- 기술 스택: {WebView / React Native}
- 생성된 파일: {파일 목록}
- 핵심 기능:
  1. {기능 1}
  2. {기능 2}
  ...
- 통합:
  - 백버튼: Granite SDK 이벤트 API
  - 광고: {없음 / loadFullScreenAd 등}
  - 인증: {없음 / Granite 인증 토큰 / 백엔드 세션 (mTLS)}
  - 결제/송금: {없음 / 토스 결제 / 토스 송금}
  - 생성형 AI: {없음 / 사용 (사전 고지 + 결과물 표시 구현됨)}
- 검수 자가 점검: 모든 항목 통과 (Step 3-5)

프로젝트 경로: ~/Desktop/{app-name}/
```

AskUserQuestion:

> 구현 결과를 확인해주세요. 수정이 필요한 부분이 있나요?
> (수정 사항을 입력하거나, "완료"를 입력하면 다음 단계로)

"완료" 입력 시 Phase 4 로 전환.

---

## Phase 4: 출시 준비

### Step 4-1: 샌드박스 테스트 안내

`create-ait-app` 으로 만든 프로젝트는 샌드박스 앱에서 즉시 테스트 가능합니다.

```bash
cd ~/Desktop/{app-name} && npm run dev
```

사용자에게 안내:

> 1. iOS/Android 샌드박스 앱이 설치되어 있는지 확인하세요.
>    - 미설치 시: `ax search docs --query "샌드박스 설치"` 로 OS 별 설치 가이드 확인
> 2. 샌드박스 앱에서 `intoss://{app-name}` 으로 접근
> 3. 핵심 기능 + 백버튼 + (광고 사용 시) 광고 흐름 + (생성형 AI 사용 시) 사전 고지·결과물 표시 모두 확인
> 4. 토스앱에서 최종 테스트하려면 `npm run build` 후 토스앱에 업로드 (`ax search docs --query "토스앱 테스트"`)

### Step 4-2: README.md 생성

`~/Desktop/{app-name}/README.md` 파일을 생성합니다. 내용 구성:

```markdown
# {한국어 앱 이름} ({영어 앱 이름})

> {부제}

## 앱 정보

| 항목 | 내용 |
|------|------|
| 한국어 이름 | {한국어 앱 이름} |
| 영어 이름 | {영어 앱 이름} |
| appName (kebab-case) | {app-name} |
| 부제 | {부제} |
| 카테고리 | {카테고리} |
| primaryColor (= design.bg) | {design.bg} |
| accent | {design.accent} |
| 기술 스택 | {WebView / React Native} |

## 생성된 에셋

| 파일 | 규격 | 설명 |
|------|------|------|
| `logo-600x600.png` | 600×600 PNG | 앱 아이콘 (공통 내비 로고로도 사용) |
| `thumbnail-1932x828.png` | 1932×828 PNG | 프로모션 배너 |
| `description.md` | - | 앱 상세 설명 (5섹션) |
| `metadata.json` | - | 앱 메타데이터 |
| `{app-folder}/` | - | `create-ait-app` 으로 생성된 앱 소스 |

## 상세 설명 미리보기

{description.md 의 한 줄 소개 + 해결하는 문제}

## 검색 키워드

{쉼표로 나열}

## 앱인토스 콘솔 등록 방법

1. [앱인토스 콘솔](https://console.appsintoss.com) 접속
2. "새 앱 등록" 클릭
3. 앱 정보(이름·부제·카테고리) 입력 — `appName` 은 `{app-name}` 으로 동일하게
4. 로고(`logo-600x600.png`)·썸네일(`thumbnail-1932x828.png`) 업로드
5. 콘솔에서 업로드된 로고의 링크를 복사하여 `granite.config.ts` 의 `brand.icon` 값으로 채워 넣기
6. 상세 설명(`description.md`) 입력, 검색 키워드 등록
7. `npm run build` 산출물 업로드, 토스앱에서 최종 테스트 후 출시 요청

## 검수 체크리스트

### 카테고리·정책 (review-policy.md §1·§2·§4·§5)
- [ ] 출시 불가 카테고리(디지털자산/사행성/금융상품/투자자문/의료 마케팅/자사 홍보) 해당 없음
- [ ] 동일 워크스페이스에 유사 핵심 기능 미니앱 없음 (어뷰징 방지 §2)
- [ ] 자사 앱 설치 유도 문구·이미지·배너 없음 (§4a)
- [ ] 핵심 기능이 외부 링크/외부 결제창에 의존하지 않음 (§4b)
- [ ] (생성형 AI 사용 시) 최초 사용 시 사전 고지 + 결과물에 AI 라벨·뱃지 (§5)

### 에셋·메타데이터
- [ ] 로고 600×600 PNG, 배경 단색·꽉 참
- [ ] 썸네일 1932×828 PNG, 배경 단색·꽉 참
- [ ] alpha=255 (투명 영역 없음), 둥근 모서리 없음
- [ ] 한 줄 소개·5섹션 설명 모두 존재
- [ ] 검색 키워드 10개 이상

### UX·다크패턴 (review-policy.md §3)
- [ ] 진입 직후 바텀시트(광고/알림 동의 포함) 없음
- [ ] 뒤로가기 시 바텀시트 없음
- [ ] 모든 화면에 나갈 선택지 (백/닫기/거절) 존재
- [ ] CTA 라벨이 다음 행동을 명확히 표현

### 광고 (review-policy.md §6 · granite-sdk.md §6, 해당 시)
- [ ] 일시 화면 배너 없음
- [ ] 광고 SDK 로드 중 placeholder/목업 광고 없음
- [ ] AD 뱃지·사전 안내 UI 존재
- [ ] 사용자 행위와 무관한 갑작스러운 광고 없음

### 기술 (granite-sdk.md)
- [ ] (WebView) viewport meta `user-scalable=no`
- [ ] 자체 헤더에 뒤로가기·로고·X 버튼 없음 (공통 내비 사용)
- [ ] 루트 화면에서 백버튼 누르면 `[2005]` 에러 없이 종료
- [ ] `pushState`/`popstate`/`window.close()`/`history.back()` 사용 없음
- [ ] 자체 로그인 폼 없음, Granite 인증 토큰 사용
- [ ] iframe 미사용 (YouTube 예외)
- [ ] `localStorage` 에 토큰·결제정보 없음
- [ ] 외부 URL 은 Granite 외부 링크 API 만
- [ ] `granite.config.ts` 의 `permissions` 가 `{name, access}` 객체 배열 형태

### 기능 완결성
- [ ] 콘솔 등록한 '앱 내 기능'이 미니앱 안에서 완결됨
```

### Step 4-3: 최종 요약 출력

```
============================================
  앱인토스 파이프라인 완료!
============================================

앱 이름: {한국어 이름} ({영어 이름})
appName: {app-name}
부제: {부제}
카테고리: {카테고리}
primaryColor (= design.bg): {design.bg}
accent: {design.accent}
기술 스택: {WebView / React Native}

출력 디렉토리: ~/Desktop/{app-name}/
├── logo-600x600.png       (앱 아이콘)
├── thumbnail-1932x828.png (프로모션 배너)
├── description.md         (앱 상세 설명)
├── metadata.json          (메타데이터)
├── README.md              (등록·검수 가이드)
└── {app-folder}/          (create-ait-app 프로젝트)
    └── granite.config.ts  (콘솔 등록 후 brand.icon URL 입력 필요)

다음 단계:
→ npm run dev → 샌드박스 앱에서 테스트
→ https://console.appsintoss.com 에서 앱 등록 + 로고 업로드
→ 콘솔 로고 URL 을 granite.config.ts 의 brand.icon 으로 복사
→ npm run build → 토스앱에서 최종 테스트
→ 검수 요청 (1~3 영업일 소요)
============================================
```
