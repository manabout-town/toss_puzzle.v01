// 결정적 PRNG (mulberry32). 동일 시드로 동일 시퀀스를 보장합니다.
// 클라이언트에서 보드를 시드로 생성한 뒤, 서버 검증에서도 같은 시드를 써서
// 보드를 재구성하면 부정행위 검증이 가능합니다.
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 문자열 시드 → 정수
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeed(): string {
  // 충분한 엔트로피 + URL 안전한 문자만 사용
  const buf = new Uint32Array(2);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 0xffffffff);
    buf[1] = Math.floor(Math.random() * 0xffffffff);
  }
  return buf[0].toString(36) + buf[1].toString(36);
}
