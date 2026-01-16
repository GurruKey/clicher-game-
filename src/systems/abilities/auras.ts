export type AuraModifiers = {
  staminaCostMultiplier: number;
  workDurationMultiplier: number;
};

export function combineAuraModifiers(mods: AuraModifiers[]): AuraModifiers {
  let staminaCostMultiplier = 1;
  let workDurationMultiplier = 1;

  for (const mod of mods) {
    const stamina = Number(mod?.staminaCostMultiplier);
    if (Number.isFinite(stamina) && stamina > 0) staminaCostMultiplier *= stamina;

    const duration = Number(mod?.workDurationMultiplier);
    if (Number.isFinite(duration) && duration > 0) workDurationMultiplier *= duration;
  }

  return { staminaCostMultiplier, workDurationMultiplier };
}

export function getActiveAuraModifiers(args: {
  abilities: any[];
  enabledById: Record<string, boolean>;
}): AuraModifiers {
  const mods: AuraModifiers[] = [];
  for (const ability of args.abilities) {
    if (!ability || ability.kind !== "aura") continue;
    const id = String(ability.id ?? "");
    if (!id) continue;
    if (!args.enabledById?.[id]) continue;
    mods.push({
      staminaCostMultiplier: Number(ability.staminaCostMultiplier ?? 1),
      workDurationMultiplier: Number(ability.workDurationMultiplier ?? 1)
    });
  }
  return combineAuraModifiers(mods);
}

