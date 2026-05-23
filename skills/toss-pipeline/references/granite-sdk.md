# Granite SDK 운영 원칙 (앱인토스 미니앱)

앱인토스 미니앱이 토스 네이티브와 상호작용할 때 쓰는 Granite SDK 의 **원칙·정책·함정**을 정리합니다.

> **시그니처는 이 문서에 박아두지 않습니다.** SDK 메서드명·파라미터·반환 타입은 자주 바뀌므로 다음으로 항상 최신 확인:
> - `ax search docs --query "<주제>"` 로 공식 문서 ID 찾기
> - `ax get doc --id <ID>` 로 본문 가져오기
> - 또는 앱인토스 MCP 가 등록된 환경이면 MCP 호출

이 문서는 **무엇을 / 왜 / 어떤 함정을 피해야 하는지** 만 다룹니다.

---

## 1. 백버튼 — 가장 자주 틀리는 부분

### 원칙

미니앱의 백버튼은 **반드시 Granite SDK 의 백 이벤트 API 를 통해 처리**합니다.

- ✓ Granite 가 제공하는 백 이벤트 hook/listener 사용 (RN: `useBackEvent()` 류, WebView: `tdsEvent` 또는 `partner` 류 — 실제 시그니처는 `ax` 로 확인)
- ✗ `history.pushState` / `popstate` 로 가로채기 금지
- ✗ `window.onbeforeunload` 우회 금지
- ✗ `window.close()` / `history.back()` 직접 호출 금지

### 왜 그런가

토스 네이티브 셸이 자체 내비게이션 스택을 관리합니다. 웹 표준 `pushState/popstate` 로 가짜 히스토리를 쌓으면 네이티브 스택과 어긋나면서 다음 증상이 발생합니다:

- 백버튼을 눌러도 미니앱이 닫히지 않거나, 한 번 더 눌러야 닫힘
- 모달을 닫는 백버튼이 미니앱 전체를 닫아버림
- iOS 와 Android 동작 불일치
- 검수 단계에서 "히스토리 백 및 종료 동작 미구현" 으로 반려

### 백버튼 단일화 + 루트 화면 종료 (검수 필수)

검수 반려 단골 사유: **공통 내비게이션 바의 뒤로가기와 자체 헤더의 뒤로가기가 동시에 노출**. 백버튼은 화면 안에서도, 공통 내비에서도 **하나만** 보여야 합니다.

원칙:
- 공통 내비게이션 바의 뒤로가기에 의존한다 (Granite 설정의 `withBackButton: true`)
- 자체 헤더에 별도 뒤로가기 버튼을 그리지 않는다
- 백 핸들러는 다음 순서로 책임진다:
  1. 모달/시트/드로어가 열려 있으면 그것을 닫는다 (이벤트 소비)
  2. 내부 라우터 스택에 이전 화면이 있으면 거기로 돌아간다 (이벤트 소비)
  3. **루트 화면이면 네이티브가 미니앱을 종료하도록 풀어준다** (이벤트 소비 X)

루트 화면에서 백버튼이 무반응이면 사용자는 "닫히지 않는 앱"으로 인식하고, 검수에서는 종료 동작 미구현으로 반려됩니다.

### "종료 을 찾을 수 없습니다. [2005]" 에러 회피

증상: 루트 화면에서 백버튼을 눌렀을 때 토스가 미니앱을 종료하려다 `종료 을 찾을 수 없습니다. [2005]` 토스트를 띄움.

원인:
- 백 핸들러가 모든 케이스에서 이벤트를 소비해 네이티브 종료 경로가 호출되지 못함
- `pushState` 로 가짜 히스토리가 쌓여 네이티브 스택이 비어 있는 것으로 인식됨
- "닫기" 버튼 탭 흐름에서 임의로 `window.close()` / `history.back()` 호출

해결:
- 루트 화면 진입 시 백 핸들러를 *제거* 하거나, 핸들러 안에서 "기본 동작 허용" 으로 풀어준다 (RN 의 `removeEventListener`, WebView 도 동등 API)
- 명시적으로 미니앱을 종료할 일이 있으면 Granite SDK 의 종료 API 를 직접 호출 (`ax search docs --query "미니앱 종료"` 로 메서드명 확인). `window.close()` 우회 금지.
- `pushState` 를 백버튼 인터셉트 용도로 쓰지 않는다 (위 원칙)

---

## 2. 공통 내비게이션 바

토스가 자동 제공하는 내비게이션 바를 **기본 설정만 하면** 다음이 자동 표시됩니다:

- 좌측: 미니앱 로고(`brand.icon` URL) + `brand.displayName`
- 우측: 더보기 메뉴(공유·신고·권한·홈 추가·용량 삭제·알림 ON/OFF) + 닫기(X)
- 옵션 (granite.config.ts `navigationBar`):
  - `withBackButton: true` — 뒤로가기 버튼 노출
  - `withHomeButton: true` — 홈(첫 화면) 이동 버튼, 비게임만
  - `initialAccessoryButton` — 더보기 왼쪽 모노톤 아이콘 1개 (id, title, icon.name)
- 동적 추가: `partner.addAccessoryButton()` (WebView) 또는 `useTopNavigation().addAccessoryButton()` (RN)
- 이벤트: `tdsEvent.addEventListener('navigationAccessoryEvent', ...)` 로 클릭 수신

### 함정

- 공통 내비 로고가 안 보이면 `brand.icon` 에 콘솔 업로드 이미지 URL 이 비어 있거나 잘못됨 — 콘솔에서 우클릭 → 링크 복사로 받아야 함
- 자체 헤더에 큰 로고를 또 그리면 중복 — 검수 반려
- 액세서리 버튼은 **1개만**, **모노톤 아이콘만**, 컬러 아이콘·커스텀 UI 불가
- 홈 버튼은 좌측 영역(서비스 이름 옆) 전용 — 우측 더보기 액세서리 영역에 같은 홈 기능 중복 추가 금지
- 자체 X 닫기 버튼 그리지 말 것 — 공통 내비가 제공

---

## 3. viewport / pinch-zoom (WebView 전용)

검수 반려 사유: **불필요한 화면 확대·축소 제스처 활성화**.

`index.html` 의 `<head>` 에 다음을 **반드시** 포함합니다 (WebView 미니앱의 경우):

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```

추가 CSS (iOS Safari 더블탭 줌·텍스트 자동 확대 차단):

```css
html, body {
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
}
```

> `create-ait-app` 으로 만든 프로젝트의 기본 템플릿은 이미 이 설정을 포함하고 있을 가능성이 높음. 그래도 부트스트랩 직후 `index.html` 을 열어 viewport meta 가 있는지 직접 확인하세요.

예외: 접근성 보조용으로 확대가 *명시적으로* 필요한 앱은 "확대 가능" 안내를 화면에 노출한 뒤 `user-scalable=yes` 사용 가능. 그 외에는 비활성화가 기본.

React Native 미니앱은 viewport meta 가 무관하지만, 동적으로 폰트 크기를 키우는 입력은 받지 않도록 컴포넌트 props 로 제어합니다.

---

## 4. 화면 전환 / 모달

내부 라우팅(SPA 라우터)은 자유롭게 써도 되지만, 다음은 Granite 를 거칩니다:

- **외부 URL 열기**: `window.open` 금지 → Granite 외부 링크 API
- **다른 앱인토스 미니앱으로 이동**: Granite 의 미니앱 이동 API
- **토스 네이티브 페이지 호출** (송금·결제·인증 등): Granite 의 해당 API
- **딥링크**: `intoss://{appName}` 형식

미니앱 내부 화면 전환은 일반 라우터(history API) OK. 단 백버튼 처리는 §1 규칙 적용.

`iframe` 사용 금지 — YouTube 영상 embed 만 예외.

---

## 5. 인증 / 사용자 정보

토스 사용자 정보가 필요하면 Granite 인증 API 로 토큰을 받아 백엔드와 교환합니다.

- ✗ 미니앱 내에서 자체 로그인 폼 만들지 않기 (토스 사용자는 이미 로그인 상태) — 검수 반려 사유
- ✓ Granite 로 토스 인증 토큰 요청 → 서버에서 검증 → 세션 발급
- 백엔드와 토큰 교환할 때는 mTLS 인증서 필수 (`ax search docs --query "mTLS"`)

구체 메서드는 `ax search docs --query "토스 인증"` / `"login"` / `"user-hash-key"` 참조.

### 권한

권한이 필요하면 `granite.config.ts` 의 `permissions: [{name, access}, ...]` 배열에 선언합니다. 예:

```ts
permissions: [
  { name: 'camera', access: 'access' },
  { name: 'photos', access: 'read' },
  { name: 'clipboard', access: 'read' },
  { name: 'clipboard', access: 'write' },
]
```

권한 이름·access 값 목록은 `ax search docs --query "권한 permission"` 으로 확인.

---

## 6. 광고

광고 API 시그니처는 자주 바뀌므로 직접 박아두지 않습니다. `ax search docs --query "광고"` 로 다음을 확인:

- **통합 광고 (전면형·보상형)**: `loadFullScreenAd` / `showFullScreenAd` (`adGroupId` 기준 자동 결정). 토스 앱 5.247+ 지원.
- **배너 광고**: `TossAds.initialize` → `TossAds.attachBanner`. 토스 앱 5.241+ 지원.
- `isSupported()` 로 지원 여부 fallback 처리 필수.

### 검수 단골 반려 항목 (review-policy.md §6 와 동일)

- **일시 화면 배너 광고 금지** — 스플래시·로딩·광고 SDK 로드 중·결과 토스트
- **목업/플레이스홀더 광고 금지** — 광고 SDK 로드 중 가짜 광고 이미지
- **광고 노출 사전 인지 UI 필수** — AD 뱃지, 광고 시청 버튼 라벨, 전면 광고 전 안내
- **예상 못한 시점 광고 금지** — 사용자 행위와 무관한 갑작스러운 전면 광고 (다크패턴, review-policy.md §3.4)

### 운영 패턴

- `load → show → (다음 load)` 순서
- `load` 이벤트 수신 후에만 `show`
- 한 `adGroupId` 기준 한 번에 1개만 로드
- iOS 는 ATT(App Tracking Transparency) 설정에 따라 로드 실패 가능 — fallback 필요

---

## 7. 결제 / 송금

자체 결제 위젯·웹뷰 결제창 금지. Granite 의 결제·송금 API 를 거쳐야 합니다. 시그니처는 `ax search docs --query "간편 결제"` / `"송금"` 참조.

---

## 8. 흔한 함정 종합

| 함정 | 증상 | 해결 |
|------|------|------|
| `pushState` 로 백버튼 가로채기 | iOS/Android 동작 불일치, 더블 백 필요 | Granite 백 이벤트 API (§1) |
| 자체 헤더에 별도 뒤로가기 버튼 노출 | 공통 내비 백버튼과 중복 → 검수 반려 | 공통 내비 백버튼 단일화 (§1) |
| 루트 화면에서 종료 동작 안 풀어줌 | `종료 을 찾을 수 없습니다. [2005]` | 루트에서 핸들러 제거 또는 기본 동작 허용 (§1) |
| `window.close()` / `history.back()` 으로 종료 | 같은 [2005] 또는 무동작 | Granite 종료 API (§1) |
| viewport meta 누락 / `user-scalable=yes` | 핀치-줌 활성화 → 반려 | `user-scalable=no` + `maximum-scale=1.0` (§3) |
| 자체 헤더에 큰 로고 그림 | 공통 내비 로고와 중복 → 반려 | `brand.icon` 설정으로 공통 내비에 등록 (§2) |
| 액세서리 버튼 2개 이상 / 컬러 아이콘 | 디자인 가이드 위반 → 반려 | 1개, 모노톤만 (§2) |
| 광고 로드 중 placeholder 광고 노출 | "목업 광고" 반려 | 로드 중 광고 영역 비움 (§6) |
| 스플래시/로딩에 배너 광고 | 일시 화면 배너 → 반려 | 상시 화면에만 배너 (§6) |
| 광고 표시 시 안내 부재 | "기만적 광고 노출" 반려 | AD 뱃지/사전 안내 UI (§6) |
| 사용자 행위와 무관한 전면 광고 | 다크패턴 → 반려 | 명시적 사용자 액션 뒤에만 (§6, review-policy §3.4) |
| `localStorage` 에 민감정보 저장 | 검수 반려 | 토큰은 메모리에만, 영속화 필요시 서버 |
| 외부 URL 을 `window.open` | 토스 앱 내 새 창 안 뜸 / 깨짐 | Granite 외부 링크 API (§4) |
| iframe 사용 (YouTube 외) | 기능 동작 안 함 + 보안 심사 반려 | iframe 제거 (§4) |
| 자체 로그인 폼 구현 | 검수 반려 | Granite 인증 토큰 → 서버 검증 (§5) |
| 권한을 문자열로만 선언 | granite.config.ts 빌드 오류 | `{name, access}` 객체 배열 (§5) |
| 풀스크린 가정한 레이아웃 | 토스 헤더와 겹침 | safe area 적용 |
| 데스크톱 마우스 이벤트만 처리 | 모바일에서 동작 안 함 | 터치/pointer 이벤트 |
| 외부 결제창으로 이동 | 검수 반려 (자사 앱/외부 링크 정책) | Granite 결제 API (§7, review-policy §4) |

---

## 9. 실제 시그니처를 확인할 때

```bash
# 주제별 문서 검색
ax search docs --query "뒤로가기"
ax search docs --query "navigation bar"
ax search docs --query "광고"
ax search docs --query "결제"
ax search docs --query "인증"
ax search docs --query "권한"

# 문서 본문 조회 (위에서 받은 id 사용)
ax get doc --id <ID>

# 예제 조회
ax list examples
ax get example --id <ID>

# TDS 컴포넌트
ax search tds-web --query "Button"
ax search tds-rn --query "Button"
```

`ax mcp start` 가 Claude Code MCP 로 등록되어 있으면 (`claude mcp add --transport stdio apps-in-toss ax mcp start`) MCP 호출로도 같은 정보를 받을 수 있습니다.
