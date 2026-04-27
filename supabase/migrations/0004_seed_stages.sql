-- ─────────────────────────────────────────────────────────────────
-- 0004_seed_stages.sql
-- 초기 스테이지 시드. 운영 환경에서는 어드민 화면으로 추가/수정합니다.
-- ─────────────────────────────────────────────────────────────────

insert into public.stages (chapter, order_in_chapter, title, goal, board_config, time_limit_sec)
values
  (1, 1, '튜토리얼: 첫 매칭',
   '{"type":"reach_score","count":500,"thresholds":{"star1":500,"star2":1500,"star3":3000}}'::jsonb,
   '{"cols":6,"rows":6,"tiles":["red","blue","green","yellow"]}'::jsonb,
   60),
  (1, 2, '컬러 타격',
   '{"type":"clear_color","color":"red","count":20,"thresholds":{"star1":1000,"star2":2500,"star3":5000}}'::jsonb,
   '{"cols":6,"rows":6,"tiles":["red","blue","green","yellow","purple"]}'::jsonb,
   60),
  (1, 3, '시간 압박',
   '{"type":"reach_score","count":3000,"thresholds":{"star1":3000,"star2":6000,"star3":10000}}'::jsonb,
   '{"cols":7,"rows":7,"tiles":["red","blue","green","yellow","purple"]}'::jsonb,
   45)
on conflict (chapter, order_in_chapter) do nothing;
