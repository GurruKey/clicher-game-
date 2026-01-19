export type ActiveBuff = { stacks: number; expiresAtMs: number };

export function getManaRegenBonusFromBuffs(args: {
  abilities: any[];
  buffsById: Record<string, ActiveBuff>;
  nowMs: number;
}): number {
  const nowMs = Number(args.nowMs);
  if (!Number.isFinite(nowMs) || nowMs <= 0) return 0;

  let bonus = 0;
  for (const ability of args.abilities ?? []) {
    if (!ability || (ability.kind !== "buff" && ability.kind !== "debuff")) continue;
    const id = String(ability.id ?? "");
    if (!id) continue;
    const entry = args.buffsById?.[id];
    if (!entry) continue;
    const stacks = Math.max(0, Math.floor(Number(entry.stacks ?? 0)));
    const expiresAtMs = Number(entry.expiresAtMs ?? 0);
    if (stacks <= 0) continue;
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) continue;

    const perStack = Math.max(0, Number(ability.manaRegenPerStack ?? 0));
    if (perStack <= 0) continue;
    bonus += stacks * perStack;
  }
  return bonus;
}

export function getBuffBonuses(args: {
  abilities: any[];
  buffsById: Record<string, ActiveBuff>;
  enabledById?: Record<string, boolean>;
  nowMs: number;
}): { statBonuses: Record<string, number>; resourceBonuses: Record<string, number> } {
  const nowMs = Number(args.nowMs);
  const result: { statBonuses: Record<string, number>; resourceBonuses: Record<string, number> } = {
    statBonuses: {},
    resourceBonuses: {}
  };

  if (!Number.isFinite(nowMs) || nowMs <= 0) return result;

  for (const ability of args.abilities ?? []) {
    if (!ability) continue;

    let stacks = 0;

    if (ability.kind === "buff" || ability.kind === "debuff") {
      const id = String(ability.id ?? "");
      if (!id) continue;
      const entry = args.buffsById?.[id];
      if (entry) {
        const s = Math.max(0, Math.floor(Number(entry.stacks ?? 0)));
        const expiresAtMs = Number(entry.expiresAtMs ?? 0);
        if (s > 0 && Number.isFinite(expiresAtMs) && expiresAtMs > nowMs) {
          stacks = s;
        }
      }
    } else if (ability.kind === "aura") {
      const id = String(ability.id ?? "");
      if (!id) continue;
      if (args.enabledById?.[id]) {
        stacks = 1;
      }
    }

    if (stacks <= 0) continue;

    // Stat Bonuses
    if (ability.statBonuses && typeof ability.statBonuses === "object") {
      for (const [statId, value] of Object.entries(ability.statBonuses as Record<string, unknown>)) {
        const val = Number(value);
        if (Number.isFinite(val) && val !== 0) {
          result.statBonuses[statId] = (result.statBonuses[statId] ?? 0) + val * stacks;
        }
      }
    }

    // Resource Bonuses
    if (ability.resourceBonuses && typeof ability.resourceBonuses === "object") {
      for (const [resId, value] of Object.entries(ability.resourceBonuses as Record<string, unknown>)) {
        const val = Number(value);
        if (Number.isFinite(val) && val !== 0) {
          result.resourceBonuses[resId] = (result.resourceBonuses[resId] ?? 0) + val * stacks;
        }
      }
    }
  }
  return result;
}
