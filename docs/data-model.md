# 데이터 모델 (Supabase / Postgres)

Phase 1의 "데이터 모델링" 항목을 SQL 수준으로 풀어둔 문서입니다.
실제 마이그레이션은 `supabase/migrations/0001_initial_schema.sql`에 있습니다.

---

## ERD 개요

```
auth.users (Supabase 관리)
   │
   │ 1:1
   ▼
profiles ────┐
   │         │ 1:N
   │         ▼
   │      reports (target_id로 다양한 대상 참조)
   │
   │ 1:N
   ▼
user_progress ──N:1── stages
   │
   │ 1:N (user_id 기준 묶임)
   ▼
inventory
   │
   │ 1:N
   ▼
gacha_history
```

---

## 테이블 명세

### profiles
유저 1:1 — `auth.users.id`를 PK로 공유.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `uuid` PK | `auth.users.id` 참조 |
| `nickname` | `text` UNIQUE | 표시명. 금칙어 필터 통과 |
| `avatar_url` | `text` | nullable |
| `is_verified` | `bool` default false | 본인인증 완료 여부 |
| `is_blocked` | `bool` default false | 운영자 차단 |
| `role` | `text` default `'user'` | `'user' | 'admin'` |
| `created_at` | `timestamptz` default now() |  |
| `updated_at` | `timestamptz` default now() | 트리거로 갱신 |

### stages
스테이지 메타. 클라이언트가 보드를 구성할 때 필요한 모든 정보를 담음.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `bigint` PK |  |
| `chapter` | `int` | 챕터 번호 |
| `order_in_chapter` | `int` | 같은 챕터 내 순서 |
| `title` | `text` |  |
| `goal` | `jsonb` | 예: `{"type": "clear_color", "color": "red", "count": 30}` |
| `board_config` | `jsonb` | 예: `{"cols": 6, "rows": 6, "tiles": ["red","blue",...]}` |
| `time_limit_sec` | `int` |  |
| `published` | `bool` default true | soft publish |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

UNIQUE(`chapter`, `order_in_chapter`).

### user_progress
유저별 스테이지 클리어 상태.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `user_id` | `uuid` FK profiles |  |
| `stage_id` | `bigint` FK stages |  |
| `best_score` | `int` default 0 |  |
| `stars` | `int` default 0 | 0~3 |
| `cleared_at` | `timestamptz` nullable |  |
| `attempts` | `int` default 0 |  |
| `updated_at` | `timestamptz` |  |

PK(`user_id`, `stage_id`).

### inventory
유저가 보유한 아이템 수량.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `user_id` | `uuid` FK profiles |  |
| `item_code` | `text` | 코드(예: `booster_bomb`, `coin`, `skin_red`) |
| `quantity` | `int` default 0 | 0 이상 체크 제약 |
| `updated_at` | `timestamptz` |  |

PK(`user_id`, `item_code`).

### gacha_history
가챠 결과 영구 기록.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `bigserial` PK |  |
| `user_id` | `uuid` FK profiles |  |
| `pool` | `text` | `'standard' | 'premium'` |
| `result_item_code` | `text` |  |
| `rarity` | `text` | `common | rare | epic | legendary` |
| `cost_item_code` | `text` |  |
| `cost_amount` | `int` |  |
| `created_at` | `timestamptz` default now() |  |

INDEX(`user_id`, `created_at desc`).

### reports
UGC 신고.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `bigserial` PK |  |
| `reporter_id` | `uuid` FK profiles |  |
| `target_type` | `text` | `'profile' | 'comment' | ...` |
| `target_id` | `text` |  |
| `reason` | `text` | enum값 |
| `note` | `text` nullable |  |
| `status` | `text` default `'open'` | `'open' | 'resolved' | 'rejected'` |
| `created_at` | `timestamptz` default now() |  |
| `resolved_at` | `timestamptz` nullable |  |
| `resolver_id` | `uuid` nullable |  |

### user_blocks
사용자 간 차단 관계.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `blocker_id` | `uuid` FK profiles |  |
| `blocked_id` | `uuid` FK profiles |  |
| `created_at` | `timestamptz` default now() |  |

PK(`blocker_id`, `blocked_id`).

### admin_audit_log
관리자 액션 감사 로그.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `bigserial` PK |  |
| `admin_id` | `uuid` FK profiles |  |
| `action` | `text` |  |
| `target_table` | `text` |  |
| `target_id` | `text` |  |
| `payload` | `jsonb` | 변경 전/후 스냅샷 |
| `created_at` | `timestamptz` default now() |  |

---

## 주요 인덱스

- `user_progress (user_id, best_score desc)` — 마이페이지 진행도 화면.
- `user_progress (stage_id, best_score desc)` — 스테이지별 랭킹.
- `gacha_history (user_id, created_at desc)` — 마이페이지 가챠 기록.
- `reports (status, created_at)` — 어드민 큐.

---

## 타입 자동 생성

```bash
pnpm supabase:types
# → src/types/database.ts 생성
```

생성된 타입은 클라이언트/서버 양쪽에서 동일하게 사용합니다.
