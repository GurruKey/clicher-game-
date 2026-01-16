import { STORAGE_KEYS } from "./storageKeys";

export function loadAvatarId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.avatarId);
    return raw && typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
}

export function saveAvatarId(avatarId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.avatarId, avatarId);
  } catch {
    // ignore storage failures
  }
}

export function clearAvatarId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.avatarId);
  } catch {
    // ignore storage failures
  }
}

