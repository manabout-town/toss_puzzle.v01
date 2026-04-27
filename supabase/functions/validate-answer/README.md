# validate-answer

스테이지 종료 시 클라이언트가 시드와 액션 시퀀스를 보내면, 서버에서 보드를 재시뮬레이션해 점수를 검증합니다.

## 배포

```bash
supabase functions deploy validate-answer --project-ref <PROJECT_REF>
```

## 환경 변수

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 호출

`/api/score` (Next.js Route Handler)에서 인증 후 위임됩니다.
