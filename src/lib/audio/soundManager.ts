import { Howl, Howler } from 'howler';

// 모바일 자동재생 정책: 첫 사용자 인터랙션 후 한 번 호출해주세요.
export function unlockAudio() {
  if (Howler.ctx?.state === 'suspended') {
    void Howler.ctx.resume();
  }
}

const sounds: Record<string, Howl> = {};

function load(key: string, src: string) {
  if (sounds[key]) return sounds[key];
  sounds[key] = new Howl({ src: [src], html5: false, preload: true });
  return sounds[key];
}

export const SFX = {
  tap: () => load('tap', '/sounds/tile-tap.mp3').play(),
  match: () => load('match', '/sounds/match.mp3').play(),
  combo: () => load('combo', '/sounds/combo.mp3').play(),
  fail: () => load('fail', '/sounds/fail.mp3').play(),
  gacha: () => load('gacha', '/sounds/gacha.mp3').play(),
};

// 햅틱 — Capacitor 환경에서만 동작. 웹에서는 try/catch 후 무시.
export async function haptic(kind: 'light' | 'success' | 'heavy' | 'error') {
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import(
      '@capacitor/haptics'
    );
    if (kind === 'light') return Haptics.impact({ style: ImpactStyle.Light });
    if (kind === 'heavy') return Haptics.impact({ style: ImpactStyle.Heavy });
    if (kind === 'success')
      return Haptics.notification({ type: NotificationType.Success });
    if (kind === 'error')
      return Haptics.notification({ type: NotificationType.Error });
  } catch {
    /* no-op on web */
  }
}
