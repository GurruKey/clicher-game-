const clamp = (value: unknown) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);

export type LootTableEntry = {
  id: string;
  chance: number;
};

export type LootTable = LootTableEntry[];

export const sumLootChance = (lootTable: LootTable) =>
  lootTable.reduce((sum, entry) => sum + clamp(entry.chance), 0);

export const pickLootByChance = (
  lootTable: LootTable | null | undefined,
  roll: number = Math.random() * 100
) => {
  if (!lootTable || lootTable.length === 0) {
    return null;
  }

  let cumulative = 0;
  for (const entry of lootTable) {
    const chance = clamp(entry.chance);
    if (chance <= 0) {
      continue;
    }
    cumulative += chance;
    if (roll < cumulative) {
      return entry.id ?? null;
    }
  }

  return null;
};

