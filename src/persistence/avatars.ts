import { safeJsonParse } from "./json";
import { STORAGE_KEYS } from "./storageKeys";

const normalizeAvatarIds = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const next = value.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (next.length === 0) return [];
  return Array.from(new Set(next));
};

export function loadAvatarIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.avatarIds);
    if (!raw) return null;
    return normalizeAvatarIds(safeJsonParse(raw));
  } catch {
    return null;
  }
}

export function saveAvatarIds(avatarIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.avatarIds, JSON.stringify(Array.from(new Set(avatarIds))));
  } catch {
    // ignore storage failures
  }
}

export function clearAvatarIds(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.avatarIds);
  } catch {
    // ignore storage failures
  }
}

