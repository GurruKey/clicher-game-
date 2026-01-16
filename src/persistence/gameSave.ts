import { isRecord, safeJsonParse } from "./json";
import { STORAGE_KEYS } from "./storageKeys";

export const CURRENT_GAME_SAVE_VERSION = 1 as const;
const GAME_SAVE_PREFIX = `${STORAGE_KEYS.gameSave}:`;

export type GameSaveData = {
  inventory: unknown | null;
  resources: Record<string, number> | null;
  loot: unknown | null;
  perks: string[] | null;
  locationId?: string | null;
  skillSlots?: Array<string | null> | null;
  skillSlots2?: Array<string | null> | null;
  skillsUnlocked?: boolean | null;
  knownAbilityIds?: string[] | null;
  seenAbilityIds?: string[] | null;
  abilityToggledById?: Record<string, boolean> | null;
  abilityBuffsById?: Record<string, { stacks: number; expiresAtMs: number }> | null;
};

type GameSaveEnvelopeV1 = {
  version: typeof CURRENT_GAME_SAVE_VERSION;
  data: GameSaveData;
};

const isEnvelopeV1 = (value: unknown): value is GameSaveEnvelopeV1 => {
  if (!isRecord(value)) return false;
  if (value.version !== CURRENT_GAME_SAVE_VERSION) return false;
  return isRecord(value.data);
};

const normalizeResources = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) return null;
  const next: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const num = Number(raw);
    if (Number.isFinite(num)) {
      next[key] = num;
    }
  }
  return Object.keys(next).length ? next : {};
};

const normalizePerks = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const next = value.filter((p) => typeof p === "string");
  return next.length ? next : [];
};

const normalizeLocationId = (value: unknown): string | null => {
  return typeof value === "string" && value.length > 0 ? value : null;
};

const normalizeSkillSlots = (value: unknown): Array<string | null> | null => {
  if (!Array.isArray(value)) return null;
  const next: Array<string | null> = [];
  for (const entry of value.slice(0, 10)) {
    if (typeof entry === "string" && entry.length > 0) {
      next.push(entry);
    }
    else next.push(null);
  }
  return next.length ? next : Array(10).fill(null);
};

const normalizeStringList = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const next = value.filter((v) => typeof v === "string" && v.length > 0);
  return next.length ? next : [];
};

const normalizeBooleanRecord = (value: unknown): Record<string, boolean> | null => {
  if (!isRecord(value)) return null;
  const next: Record<string, boolean> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (typeof raw !== "boolean") continue;
    next[key] = raw;
  }
  return next;
};

const normalizeBuffRecord = (value: unknown): Record<string, { stacks: number; expiresAtMs: number }> | null => {
  if (!isRecord(value)) return null;
  const next: Record<string, { stacks: number; expiresAtMs: number }> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (!isRecord(raw)) continue;
    const stacks = Math.max(0, Math.floor(Number(raw.stacks ?? 0)));
    const expiresAtMs = Number(raw.expiresAtMs ?? 0);
    if (stacks <= 0) continue;
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) continue;
    next[key] = { stacks, expiresAtMs };
  }
  return next;
};

const normalizeData = (value: unknown): GameSaveData | null => {
  if (!isRecord(value)) return null;
  return {
    inventory: isRecord(value.inventory) || Array.isArray(value.inventory) ? value.inventory : null,
    resources: normalizeResources(value.resources),
    loot: isRecord(value.loot) || Array.isArray(value.loot) ? value.loot : null,
    perks: normalizePerks(value.perks),
    locationId: normalizeLocationId(value.locationId),
    skillSlots: normalizeSkillSlots(value.skillSlots),
    skillSlots2: normalizeSkillSlots(value.skillSlots2),
    skillsUnlocked: typeof value.skillsUnlocked === "boolean" ? value.skillsUnlocked : null,
    knownAbilityIds: normalizeStringList(value.knownAbilityIds),
    seenAbilityIds: normalizeStringList(value.seenAbilityIds),
    abilityToggledById: normalizeBooleanRecord(value.abilityToggledById),
    abilityBuffsById: normalizeBuffRecord(value.abilityBuffsById)
  };
};

const getKey = (avatarId: string | null | undefined) => {
  if (avatarId && typeof avatarId === "string") return `${GAME_SAVE_PREFIX}${avatarId}`;
  return STORAGE_KEYS.gameSave;
};

export function loadGameSaveData(avatarId?: string | null): GameSaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getKey(avatarId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = safeJsonParse(raw);
    if (isEnvelopeV1(parsed)) {
      const normalized = normalizeData(parsed.data);
      return normalized;
    }

    const legacy = normalizeData(parsed);
    return legacy;
  } catch {
    return null;
  }
}

export function saveGameSaveData(avatarId: string | null | undefined, data: GameSaveData): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: GameSaveEnvelopeV1 = {
      version: CURRENT_GAME_SAVE_VERSION,
      data
    };
    window.localStorage.setItem(getKey(avatarId), JSON.stringify(envelope));
  } catch {
    // ignore storage failures
  }
}

export function clearGameSave(avatarId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (avatarId && typeof avatarId === "string") {
      window.localStorage.removeItem(getKey(avatarId));
      return;
    }

    // Clear legacy key + all per-avatar keys.
    window.localStorage.removeItem(STORAGE_KEYS.gameSave);
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(GAME_SAVE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore storage failures
  }
}
