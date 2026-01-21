import { isRecord, safeJsonParse } from "./json";
import { STORAGE_KEYS } from "./storageKeys";

export const CURRENT_GRAPHICS_VERSION = 1 as const;

export type GraphicsSettingsData = {
  mode: "fixed";
  width: number;
  height: number;
};

type GraphicsEnvelopeV1 = {
  version: typeof CURRENT_GRAPHICS_VERSION;
  graphics: GraphicsSettingsData;
};

const isEnvelopeV1 = (value: unknown): value is GraphicsEnvelopeV1 => {
  if (!isRecord(value)) return false;
  if (value.version !== CURRENT_GRAPHICS_VERSION) return false;
  return isRecord(value.graphics);
};

const normalizeGraphics = (value: unknown): GraphicsSettingsData | null => {
  if (!isRecord(value)) return null;
  const mode = value.mode === "fixed" ? "fixed" : null;
  const width = Number(value.width);
  const height = Number(value.height);
  if (!mode) return null;
  if (!Number.isFinite(width) || width <= 0) return null;
  if (!Number.isFinite(height) || height <= 0) return null;
  return { mode, width, height };
};

export function loadGraphicsSettings(): GraphicsSettingsData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.graphics);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    if (isEnvelopeV1(parsed)) {
      return normalizeGraphics(parsed.graphics);
    }
    return normalizeGraphics(parsed);
  } catch {
    return null;
  }
}

export function saveGraphicsSettings(settings: GraphicsSettingsData): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: GraphicsEnvelopeV1 = {
      version: CURRENT_GRAPHICS_VERSION,
      graphics: settings
    };
    window.localStorage.setItem(STORAGE_KEYS.graphics, JSON.stringify(envelope));
  } catch {
    // ignore storage failures
  }
}

export function clearGraphicsSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.graphics);
  } catch {
    // ignore storage failures
  }
}
