import type { ResolveResult } from './engine';

/** 시간 보너스: 클리어 시 남은 초당 +50. */
export function timeBonus(timeLeftSec: number): number {
  return Math.max(0, Math.floor(timeLeftSec * 50));
}

/** 골 임계값과 점수로 별점(0~3) 계산. */
export function starsFromScore(
  score: number,
  thresholds: { star1: number; star2: number; star3: number },
): number {
  if (score >= thresholds.star3) return 3;
  if (score >= thresholds.star2) return 2;
  if (score >= thresholds.star1) return 1;
  return 0;
}

/** ResolveResult를 사람이 읽기 좋은 요약으로 변환. */
export function describeResolve(result: ResolveResult): string {
  if (result.combos === 0) return 'no match';
  return `${result.combos}-chain, +${result.scoreDelta}`;
}
