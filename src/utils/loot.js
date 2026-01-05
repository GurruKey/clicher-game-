const clamp = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0);

export const sumLootChance = (lootTable) =>
  lootTable.reduce((sum, entry) => sum + clamp(entry.chance), 0);

export const pickLootByChance = (lootTable, roll = Math.random() * 100) => {
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
