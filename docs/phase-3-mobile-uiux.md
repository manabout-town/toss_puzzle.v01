# Phase 3 — 모바일 앱 전용 UI/UX 전환

웹 데모를 그대로 패키징하면 노치/홈 바/마우스 hover 같은 디테일이 어색해 보입니다.
이 단계에서 **앱처럼 느끼는 UX**로 전환합니다. 대상 디바이스는 iOS/Android 모바일 풀스크린.

---

## 1. 하단 탭 바 구현

### 1-1. 구조
4개 탭: **Home / Ranking / Shop / My**.

```
src/components/layout/BottomTabBar.tsx
```

- 활성 탭 인디케이터: 상단 2px 라인 + 아이콘 색상 전환.
- 모션: `framer-motion`의 `layoutId`로 인디케이터 부드럽게 이동.
- 접근성: `aria-current="page"` 적용.

### 1-2. 탭 별 라우트
| 탭 | 경로 | 비고 |
| --- | --- | --- |
| Home | `/` | 챕터/스테이지 그리드 |
| Ranking | `/ranking` | 주간/누적 |
| Shop | `/shop` | 가챠/상품 |
| My | `/my` | 진행도, 가챠 기록, 설정, 탈퇴, 약관, 문의 |

---

## 2. 세이프 에어리어 대응

### 2-1. CSS 토큰
`src/app/globals.css`에서 다음을 선언:

```css
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}
```

### 2-2. 활용
Tailwind에 매핑(이미 `tailwind.config.ts`에 등록됨).

```tsx
<header className="pt-safe-t" />     // 상단 노치 회피
<nav className="pb-safe-b" />        // 홈 인디케이터 회피
```

`src/components/layout/SafeAreaWrapper.tsx`에서 일관된 적용.

### 2-3. 메타 태그
`<meta name="viewport" content="viewport-fit=cover, ...">`이 필수 — `src/app/layout.tsx`에 포함.

---

## 3. 앱 인터랙션 최적화

### 3-1. 터치 피드백
- 모든 버튼/카드: `active:scale-95 transition-transform duration-100`.
- 보드 셀은 추가로 `pointerdown` 시 미세한 그림자 변화.

### 3-2. 햅틱
`@capacitor/haptics`로 통일된 햅틱 헬퍼 작성.

```ts
// src/lib/audio/soundManager.ts (햅틱도 함께 관리)
import { Haptics, ImpactStyle } from '@capacitor/haptics';
export const tap = () => Haptics.impact({ style: ImpactStyle.Light });
export const success = () => Haptics.notification({ type: 'SUCCESS' });
```

이벤트 매트릭스:
| 동작 | 사운드 | 햅틱 |
| --- | --- | --- |
| 타일 선택 | `tile-tap.mp3` | Light |
| 매칭 성공 | `match.mp3` | Success |
| 콤보 5+ | `combo.mp3` | Heavy |
| 실패/타임오버 | `fail.mp3` | Error |
| 가챠 등장 | `gacha.mp3` | Heavy |

### 3-3. 웹 전용 효과 제거
- `:hover`는 모바일에서 잠깐 발동 후 잔상이 남는 경우가 있음 → `@media (hover: hover)`로 가드.
- 마우스 우클릭 컨텍스트 메뉴 차단(이미지 길게 누르기 회피): `oncontextmenu="return false"`.
- 텍스트 선택 비활성: 게임 보드/탭 바에 `select-none touch-none`.

---

## 4. 로딩 최적화

### 4-1. Skeleton UI
`src/components/ui/Skeleton.tsx` — 펄스 애니메이션 + 둥근 모서리.
페이지 단위로 `loading.tsx`를 두어 라우트 전환 중 즉시 노출.

```
src/app/
├── loading.tsx              # 글로벌
├── ranking/loading.tsx
└── shop/loading.tsx
```

### 4-2. 이미지 Lazy Loading
- `next/image`의 기본 lazy loading 활용.
- LCP 후보(스테이지 썸네일 첫 화면 등)는 `priority` 지정.
- Capacitor 정적 export 환경에서는 `images.unoptimized=true` 설정 필요.

### 4-3. 폰트 / 자산
- 한글 가변 폰트(예: Pretendard Variable)를 `next/font/local`로 호스팅.
- BGM/SFX는 Howler로 사전 로드(`preload: true`)하되, 첫 사용자 인터랙션 후 재생(모바일 자동재생 정책).

---

## 5. 점검 체크리스트
- [ ] iPhone 14 Pro(노치) 시뮬레이터에서 헤더/탭 바 안전 영역 확인
- [ ] iPhone SE(노치 없음)에서도 어색하지 않게 보이는지
- [ ] Android Pixel 6 제스처 모드에서 홈 인디케이터와 겹치지 않는지
- [ ] 게임 중 화면 잠금/복귀 시 게임 상태 일관성
- [ ] 백그라운드 진입 시 BGM 일시정지
