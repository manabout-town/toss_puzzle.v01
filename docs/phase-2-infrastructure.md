# Phase 2 — 인프라 및 보안 강화 (Supabase)

Phase 1에서 만든 데이터 모델 위에 **인증·권한·서버 검증**을 얹는 단계입니다.
"클라이언트는 신뢰하지 않는다"가 핵심 원칙입니다.

---

## 1. Auth 연동

### 1-1. 지원 로그인 방식
| 방식 | 사용처 | 비고 |
| --- | --- | --- |
| Google OAuth | 일반 로그인 | Supabase 대시보드에서 클라이언트 ID/Secret 등록 |
| Kakao OAuth | 한국 사용자 | OIDC 연동, redirect URL은 미니앱 도메인 포함 |
| Apple Sign In | iOS 필수 | Phase 5에서 인증서/도메인 인증 추가 |
| Anonymous (게스트) | 첫 진입 사용자 | `supabase.auth.signInAnonymously()` |

### 1-2. 게스트 → 정식 회원 마이그레이션
- 게스트 user가 소셜 로그인하면 동일 `auth.uid()`로 이어지도록 **link identity** 사용.
- 진행도(`user_progress`, `inventory`)는 `user_id`를 그대로 두면 자동으로 따라옴.

### 1-3. 클라이언트 셋업
- `src/lib/supabase/client.ts`: 브라우저용 SSR-safe Supabase 클라이언트.
- `src/lib/supabase/server.ts`: 서버 컴포넌트/라우트에서 사용. 쿠키 기반.
- `src/lib/supabase/middleware.ts`: 세션 갱신 미들웨어.

---

## 2. RLS 정책 설정

> Row Level Security를 켜지 않으면 anon key만으로 모든 행에 접근 가능합니다.
> 새 테이블 추가 시 즉시 RLS를 활성화하세요.

### 2-1. 정책 매트릭스

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | 본인 + 공개 닉네임 | 트리거(자동) | 본인 | ❌ |
| `stages` | 모두(공개) | service_role | service_role | service_role |
| `user_progress` | 본인 | 본인 | 본인 | ❌ |
| `inventory` | 본인 | service_role(서버) | service_role | ❌ |
| `gacha_history` | 본인 | service_role | ❌ | ❌ |
| `reports` | 관리자 | 본인 | 관리자 | ❌ |

### 2-2. 점검 체크리스트
- [ ] 모든 테이블에 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] anon key로 직접 INSERT/UPDATE 시도해 실패하는지 자동 테스트
- [ ] `service_role` 키는 **서버 환경(Edge Function, Next.js route)에서만** 사용
- [ ] RLS 우회 INSERT가 필요한 곳은 Edge Function 또는 서버 라우트로만 처리

전체 SQL: `supabase/migrations/0002_rls_policies.sql`.

---

## 3. 서버 액션 정리

### 3-1. 정답/점수 검증
- 라우트 핸들러: `src/app/api/score/route.ts` — 클라이언트가 점수 제출 시 호출.
- 내부에서 Edge Function `validate-answer`로 위임 → 서버에서 보드/액션 재시뮬레이션.
- 결과 점수만 `user_progress`에 갱신.

### 3-2. 에러 핸들링 표준
모든 서버 응답은 다음 형태로 통일합니다.

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

- 에러 코드는 `INVALID_INPUT`, `NOT_AUTHENTICATED`, `RATE_LIMITED`, `SERVER_ERROR` 등 enum 화.
- 클라이언트에서는 `code`로 분기, `message`는 토스트로 표시.

### 3-3. 토스트 알림 통합
- 글로벌 토스트는 `src/lib/stores/toastStore.ts`로 단일화.
- 서버 응답 실패 시 자동으로 toast queue에 push 하는 헬퍼 (`src/lib/utils.ts`의 `notifyError`)를 사용.

---

## 4. 자동 저장 트리거

### 4-1. 회원가입 시 프로필 자동 생성
`auth.users`에 row가 추가되면 `public.profiles`에 1:1 row를 만드는 트리거.

```sql
create function public.handle_new_user() returns trigger ...
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

전문은 `supabase/migrations/0003_triggers.sql`.

### 4-2. 본인인증 상태 동기화
- 한국 결제/성인 콘텐츠 대응을 위해 본인인증 결과를 `profiles.is_verified` 컬럼에 반영.
- PG/PASS 외부 인증 결과 webhook → Edge Function `verify-identity` → `update profiles set is_verified=true`.
- 이 트리거는 본 가이드 단계에서 인터페이스만 정의하고, 실제 PG 연동은 별도 작업으로 분리합니다.

### 4-3. updated_at 트리거
모든 가변 테이블에 `updated_at timestamptz` + `set_updated_at()` 트리거를 적용해
"마지막 변경 시각"을 자동 관리합니다.
