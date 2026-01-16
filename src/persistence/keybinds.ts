import { isRecord, safeJsonParse } from "./json";
import { STORAGE_KEYS } from "./storageKeys";

export const CURRENT_KEYBINDS_VERSION = 1 as const;

export type KeybindsData = Record<string, string>;

type KeybindsEnvelopeV1 = {
  version: typeof CURRENT_KEYBINDS_VERSION;
  keybinds: KeybindsData;
};

const isEnvelopeV1 = (value: unknown): value is KeybindsEnvelopeV1 => {
  if (!isRecord(value)) return false;
  if (value.version !== CURRENT_KEYBINDS_VERSION) return false;
  return isRecord(value.keybinds);
};

const normalizeKeybinds = (value: unknown): KeybindsData | null => {
  if (!isRecord(value)) return null;
  const next: KeybindsData = {};
  for (const [actionId, raw] of Object.entries(value)) {
    if (typeof raw === "string" && raw) {
      next[actionId] = raw;
    }
  }
  return Object.keys(next).length ? next : {};
};

export function loadKeybinds(): KeybindsData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.keybinds);
    if (!raw) return null;

    const parsed = safeJsonParse(raw);
    if (isEnvelopeV1(parsed)) {
      return normalizeKeybinds(parsed.keybinds);
    }

    return normalizeKeybinds(parsed);
  } catch {
    return null;
  }
}

export function saveKeybinds(keybinds: KeybindsData): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: KeybindsEnvelopeV1 = {
      version: CURRENT_KEYBINDS_VERSION,
      keybinds
    };
    window.localStorage.setItem(STORAGE_KEYS.keybinds, JSON.stringify(envelope));
  } catch {
    // ignore storage failures
  }
}

export function clearKeybinds(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.keybinds);
  } catch {
    // ignore storage failures
  }
}
