import type { ResourceDefinition } from "./calculateFinalResources";

export type PerkDefinition = {
  id: string;
  unlockResources?: string[];
};

export type ResourceState = Record<string, number>;

export function getUnlockedResourceIds(
  playerPerkIds: string[],
  perks: PerkDefinition[]
): Set<string> {
  const unlocked = new Set<string>();
  const perkById = new Map(perks.map((perk) => [perk.id, perk]));
  for (const perkId of playerPerkIds) {
    const perk = perkById.get(perkId);
    if (!perk?.unlockResources?.length) continue;
    for (const resId of perk.unlockResources) {
      unlocked.add(resId);
    }
  }
  return unlocked;
}

export function getActiveResourceDefinitions(
  resourceDefinitions: ResourceDefinition[],
  unlockedResourceIds: Set<string>
): ResourceDefinition[] {
  return resourceDefinitions.filter((def) => unlockedResourceIds.has(def.id));
}

export function getResourceMaxValue(
  id: string,
  resourceDefinitions: ResourceDefinition[],
  calculatedMaxValues: Record<string, number> = {}
): number {
  const override = calculatedMaxValues[id];
  if (override !== undefined) return Number(override) || 0;
  const def = resourceDefinitions.find((d) => d.id === id);
  return def?.base ?? 0;
}

export function initResourceState(params: {
  activeDefs: ResourceDefinition[];
  allDefs: ResourceDefinition[];
  calculatedMaxValues?: Record<string, number>;
  initialStates?: Record<string, unknown> | null;
}): ResourceState {
  const { activeDefs, allDefs, calculatedMaxValues = {}, initialStates } = params;
  const safeInitialStates = initialStates && typeof initialStates === "object" ? initialStates : {};

  const next: ResourceState = {};
  for (const def of activeDefs) {
    const id = def.id;
    const max = getResourceMaxValue(id, allDefs, calculatedMaxValues);
    const raw = (safeInitialStates as Record<string, unknown>)[id];
    const initial = raw !== undefined ? Number(raw) : max;
    const clamped = Math.min(max, Math.max(0, Number.isFinite(initial) ? initial : max));
    next[id] = clamped;
  }
  return next;
}

export function reconcileResourceState(params: {
  prev: ResourceState;
  activeDefs: ResourceDefinition[];
  allDefs: ResourceDefinition[];
  calculatedMaxValues?: Record<string, number>;
}): ResourceState {
  const { prev, activeDefs, allDefs, calculatedMaxValues = {} } = params;
  const activeIds = new Set(activeDefs.map((d) => d.id));

  let changed = false;
  const next: ResourceState = { ...prev };

  for (const def of activeDefs) {
    const id = def.id;
    const max = getResourceMaxValue(id, allDefs, calculatedMaxValues);
    if (next[id] === undefined) {
      next[id] = max;
      changed = true;
      continue;
    }
    if (next[id] > max) {
      next[id] = max;
      changed = true;
    }
  }

  for (const id of Object.keys(next)) {
    if (!activeIds.has(id)) {
      delete next[id];
      changed = true;
    }
  }

  return changed ? next : prev;
}

export function consumeResource(
  state: ResourceState,
  id: string | null | undefined,
  amount: number
): { ok: boolean; next: ResourceState } {
  if (!id) return { ok: true, next: state };
  const current = state[id];
  if (current === undefined || current < amount) return { ok: false, next: state };
  return {
    ok: true,
    next: {
      ...state,
      [id]: Math.max(0, current - amount)
    }
  };
}

export function addResource(
  state: ResourceState,
  id: string,
  amount: number,
  max: number
): ResourceState {
  if (!id) return state;
  const current = state[id] ?? 0;
  return {
    ...state,
    [id]: Math.min(max, current + amount)
  };
}

export function applyRegenStep(params: {
  state: ResourceState;
  id: string;
  max: number;
  amount?: number;
}): ResourceState {
  const { state, id, max, amount = 1 } = params;
  const current = state[id];
  if (current === undefined || current >= max) return state;
  return {
    ...state,
    [id]: Math.min(max, current + amount)
  };
}

