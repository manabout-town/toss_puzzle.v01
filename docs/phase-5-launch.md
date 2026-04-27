# Phase 5 — 앱스토어 심사 및 출시 준비

심사 거절 사유 1순위는 **계정/UGC/약관**입니다.
이 단계에서 그 4가지를 모두 갖추고, 앱인토스 플랫폼 가이드라인까지 만족시킵니다.
실제 제출 직전 체크리스트는 [app-store-checklist.md](app-store-checklist.md) 참고.

---

## 1. 회원 탈퇴 기능

### 1-1. 즉시 탈퇴
- 위치: `/my/account/delete` (마이페이지에서 1탭 이내 도달).
- 절차:
  1. 비밀번호 또는 소셜 재인증 (보안).
  2. "데이터 영구 삭제" 안내 후 사용자 확인.
  3. Edge Function `delete-account`에서:
     - `auth.users` 삭제 (Supabase admin API)
     - 관련 `user_progress`, `inventory`, `gacha_history`는 ON DELETE CASCADE
     - 닉네임은 익명화하여 `reports.target_id` 무결성 유지
- 완료 후 자동 로그아웃 → 시작 화면.

### 1-2. 데이터 파기 정책
- 즉시 파기: 식별자(이메일, 닉네임), 진행도, 인벤토리, 가챠 기록.
- 30일 보관 후 파기: 결제 영수증/환불 분쟁 대응 자료(법령상 보관 의무 항목).
- 정책 문서: `/legal/privacy`(개인정보처리방침)에 보관 기간 명시.

---

## 2. UGC 정책 준수

> 닉네임도 UGC입니다. 신고/차단이 없으면 거절될 가능성이 높습니다.

### 2-1. 신고 기능
- `reports` 테이블 사용.
- 진입점:
  - 랭킹의 다른 사용자 닉네임 길게 누르기 → "신고/차단" 시트.
  - 마이페이지 → "신고 내역".
- 사유 enum: `inappropriate_name`, `cheating`, `harassment`, `other`.

### 2-2. 차단(Block)
- `user_blocks` 테이블 (`blocker_id`, `blocked_id`, `created_at`).
- 차단된 사용자는 랭킹/소셜 영역에서 표시 제외.
- 차단 해제 가능.

### 2-3. 자동 필터
- 닉네임 변경 시 금칙어 사전(서버측) 체크 → 즉시 거부.
- 신고 누적 N건 도달 시 운영자 알림 + 임시 노출 제한.

---

## 3. 법적 문서 연결

### 3-1. 페이지
- `/legal/terms` — 이용약관
- `/legal/privacy` — 개인정보처리방침
- `/legal/gacha-rates` — 가챠 확률 공시 (한국 규정 대응)

### 3-2. 노출
- 가입 화면: "가입 시 이용약관과 개인정보처리방침에 동의합니다" + 링크.
- 앱스토어 메타데이터: 두 페이지의 URL을 등록(필수).
- 마이페이지 하단에 항상 노출.

### 3-3. 변경 이력 관리
- 약관 버전 컬럼 + 사용자 동의 시점 저장(`user_consents` 테이블).
- 약관이 바뀌면 다음 로그인 때 재동의 모달.

---

## 4. Apple 로그인 (iOS 필수)

> "다른 소셜 로그인을 제공한다면 Apple 로그인도 동등한 위치에 제공해야 한다."는 Apple 정책 4.8 — iOS 출시의 차단 사유.

### 4-1. 구현
- Supabase 대시보드에서 Apple provider 활성화.
- Apple Developer 콘솔에서:
  - App ID에 "Sign In with Apple" capability 추가
  - Service ID 생성 + Return URL 등록
  - Private Key(.p8) 발급 → Supabase에 입력
- 클라이언트:
  ```ts
  await supabase.auth.signInWithOAuth({ provider: 'apple' });
  ```
- iOS 네이티브 시트 사용을 원하면 `@capacitor-community/apple-sign-in` 추가.

### 4-2. 이메일 마스킹 대응
- Apple은 임의 릴레이 이메일을 제공할 수 있음.
- `profiles`의 이메일 컬럼은 식별 용도로만 사용하고, 닉네임을 메인 키로 노출.

---

## 5. 출시 직전 종합 체크
[app-store-checklist.md](app-store-checklist.md)로 분리되어 있습니다. 요약:

- [ ] 회원 탈퇴 ≤ 2탭으로 도달
- [ ] 신고/차단 동작 + 24시간 내 응대 명시
- [ ] 약관/개인정보처리방침/가챠 확률 페이지 모두 라이브
- [ ] iOS: Apple 로그인 동작
- [ ] iOS: 미사용 권한 plist에 없음
- [ ] Android: targetSdk 최신, 권한 사용 사유 명시
- [ ] 앱인토스: 미니앱 메타(아이콘, 이름, 카테고리) 등록
