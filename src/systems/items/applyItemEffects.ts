export type RestoreResourceEffect = {
  type: "restore_resource";
  resourceId: string;
  value: number;
};

export type UnlockSkillsEffect = {
  type: "unlock_skills";
  learnAbilityIds?: string[];
  learnAllAbilities?: boolean;
};

export type ItemEffect = RestoreResourceEffect | { type: string; [key: string]: unknown };

export type ItemData = {
  id: string;
  effects?: unknown;
};

export type ResourcesDelta = Record<string, number>;

export function getResourcesDeltaFromItem(item: ItemData): ResourcesDelta {
  const effects = item.effects;
  if (!Array.isArray(effects) || effects.length === 0) {
    return {};
  }

  const delta: ResourcesDelta = {};

  for (const effect of effects as ItemEffect[]) {
    if (!effect || typeof effect !== "object") continue;
    if (effect.type !== "restore_resource") continue;
    const resourceId = (effect as RestoreResourceEffect).resourceId;
    const value = Number((effect as RestoreResourceEffect).value);
    if (typeof resourceId !== "string" || !resourceId) continue;
    if (!Number.isFinite(value) || value === 0) continue;
    delta[resourceId] = (delta[resourceId] ?? 0) + value;
  }

  return delta;
}

export type ItemUseResult = {
  resourcesDelta: ResourcesDelta;
  unlockSkills: boolean;
  learnAllAbilities: boolean;
  learnAbilityIds: string[];
};

export function applyItemEffects(item: ItemData): ItemUseResult {
  const effects = item.effects;
  const resourcesDelta = getResourcesDeltaFromItem(item);

  if (!Array.isArray(effects) || effects.length === 0) {
    return { resourcesDelta, unlockSkills: false, learnAllAbilities: false, learnAbilityIds: [] };
  }

  let unlockSkills = false;
  let learnAllAbilities = false;
  const learnAbilityIds: string[] = [];

  for (const effect of effects as ItemEffect[]) {
    if (!effect || typeof effect !== "object") continue;
    if ((effect as any).type !== "unlock_skills") continue;
    unlockSkills = true;
    if (Boolean((effect as UnlockSkillsEffect).learnAllAbilities)) learnAllAbilities = true;
    const list = (effect as UnlockSkillsEffect).learnAbilityIds;
    if (Array.isArray(list)) {
      for (const id of list) {
        if (typeof id === "string" && id.length > 0) learnAbilityIds.push(id);
      }
    }
  }

  return { resourcesDelta, unlockSkills, learnAllAbilities, learnAbilityIds };
}
