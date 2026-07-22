import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny persistence layer. All getters resolve to `null` on any failure so
 * callers can fall back to defaults without try/catch noise.
 */

const KEYS = {
  lastSoundId: 'jewelrain.lastSoundId',
  volume: 'jewelrain.volume',
  hasSeenWelcome: 'jewelrain.hasSeenWelcome',
} as const;

export async function getLastSoundId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.lastSoundId);
  } catch {
    return null;
  }
}

export function setLastSoundId(id: string): void {
  AsyncStorage.setItem(KEYS.lastSoundId, id).catch(() => {});
}

export async function getVolume(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.volume);
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;
  } catch {
    return null;
  }
}

export function setVolume(value: number): void {
  AsyncStorage.setItem(KEYS.volume, String(value)).catch(() => {});
}

export async function getHasSeenWelcome(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYS.hasSeenWelcome)) === '1';
  } catch {
    return false;
  }
}

export function setHasSeenWelcome(): void {
  AsyncStorage.setItem(KEYS.hasSeenWelcome, '1').catch(() => {});
}
