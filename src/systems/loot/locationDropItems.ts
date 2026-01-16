import type { LocationDrops } from "./drops";

export type CurrencyMeta = {
  name?: string;
  rarity?: string;
  icon?: string;
};

export type LocationDropItem = {
  id: string;
  name: string;
  rarity: string;
  rate: string;
};

/**
 * Mirrors `srcold/hooks/loot/useLootRewards.js` (derived drop-rate list).
 */
export function buildLocationDropItems(params: {
  locationDrops: LocationDrops;
  currenciesById: Record<string, CurrencyMeta | undefined>;
}): LocationDropItem[] {
  const { locationDrops, currenciesById } = params;
  if (!locationDrops || locationDrops.total <= 0) return [];

  return Object.entries(locationDrops.items)
    .filter(([, count]) => Number(count) > 0)
    .map(([id, count]) => {
      const rate = (Number(count) / locationDrops.total) * 100;
      const meta = currenciesById[id];
      return {
        id,
        name: meta?.name ?? id,
        rarity: meta?.rarity ?? "common",
        rate: rate.toFixed(1)
      };
    })
    .sort((a, b) => Number(b.rate) - Number(a.rate));
}

