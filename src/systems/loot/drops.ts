export type DropStats = {
  total: number;
  items: Record<string, number>;
};

export type LocationDiscoveries = {
  location: DropStats;
  mobs: DropStats; // LEGACY: kept for backward compatibility if needed, but we should prefer mobDrops
  mobDrops: Record<string, DropStats>; // mobId -> DropStats (isolated per mob)
  encounters: Record<string, number>; // mobId -> count
  totalAttempts: number; // total times loot/work performed in location
};

/**
 * Данные об открытиях по всем локациям.
 * Ключ - ID локации, значение - статистика.
 */
export type Discoveries = Record<string, LocationDiscoveries>;

export function createEmptyStats(): DropStats {
  return { total: 0, items: {} };
}

export function createEmptyLocationDiscoveries(): LocationDiscoveries {
  return {
    location: createEmptyStats(),
    mobs: createEmptyStats(),
    mobDrops: {},
    encounters: {},
    totalAttempts: 0
  };
}

export function normalizeDropStats(raw: any): DropStats {
  if (!raw || typeof raw !== "object") return createEmptyStats();
  const total = Number(raw.total) || 0;
  const items: Record<string, number> = {};
  if (raw.items && typeof raw.items === "object") {
    for (const [id, count] of Object.entries(raw.items)) {
      items[id] = Number(count) || 0;
    }
  }
  return { total, items };
}

export function normalizeLocationDiscoveries(raw: any): LocationDiscoveries {
  if (!raw || typeof raw !== "object") return createEmptyLocationDiscoveries();
  
  // Backward compatibility for old format
  if ("items" in raw && !("location" in raw)) {
    const stats = normalizeDropStats(raw);
    return {
      location: stats,
      mobs: createEmptyStats(),
      mobDrops: {},
      encounters: {},
      totalAttempts: stats.total
    };
  }

  const mobDrops: Record<string, DropStats> = {};
  if (raw.mobDrops && typeof raw.mobDrops === "object") {
    for (const [mobId, stats] of Object.entries(raw.mobDrops)) {
      mobDrops[mobId] = normalizeDropStats(stats);
    }
  }

  return {
    location: normalizeDropStats(raw.location),
    mobs: normalizeDropStats(raw.mobs),
    mobDrops,
    encounters: raw.encounters && typeof raw.encounters === "object" ? raw.encounters : {},
    totalAttempts: Number(raw.totalAttempts) || 0
  };
}

export function normalizeDiscoveries(raw: unknown): Discoveries {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const result: Discoveries = {};
  for (const [locId, data] of Object.entries(raw as Record<string, unknown>)) {
    result[locId] = normalizeLocationDiscoveries(data);
  }
  return result;
}

export function recordAttempt(prev: Discoveries, locationId: string): Discoveries {
  const current = prev[locationId] ?? createEmptyLocationDiscoveries();
  return {
    ...prev,
    [locationId]: {
      ...current,
      totalAttempts: current.totalAttempts + 1
    }
  };
}

export function recordEncounter(prev: Discoveries, locationId: string, mobId: string): Discoveries {
  const current = prev[locationId] ?? createEmptyLocationDiscoveries();
  const encounters = { ...current.encounters };
  encounters[mobId] = (encounters[mobId] ?? 0) + 1;
  
  return {
    ...prev,
    [locationId]: {
      ...current,
      encounters
    }
  };
}

/**
 * Records a drop.
 * If source is "mobs", you MUST provide mobId to record it correctly in mobDrops.
 * For backward compatibility, it also records in the legacy 'mobs' aggregate stats if source is 'mobs'.
 */
export function recordDrop(
  prev: Discoveries,
  locationId: string,
  itemId: string,
  source: "location" | "mobs",
  mobId?: string
): Discoveries {
  if (!locationId || !itemId) return prev;
  
  const current = prev[locationId] ?? createEmptyLocationDiscoveries();
  
  // 1. Update the specific target stats
  let newLocation = current.location;
  let newMobs = current.mobs;
  let newMobDrops = { ...current.mobDrops };

  if (source === "location") {
    newLocation = {
      total: current.location.total + 1,
      items: {
        ...current.location.items,
        [itemId]: (current.location.items[itemId] ?? 0) + 1
      }
    };
  } else if (source === "mobs") {
    // Legacy aggregate
    newMobs = {
      total: current.mobs.total + 1,
      items: {
        ...current.mobs.items,
        [itemId]: (current.mobs.items[itemId] ?? 0) + 1
      }
    };

    // Specific mob stats
    if (mobId) {
      const mobStats = newMobDrops[mobId] ?? createEmptyStats();
      newMobDrops[mobId] = {
        total: mobStats.total + 1, // Note: total here tracks total ITEMS dropped from this mob, not kills
        items: {
          ...mobStats.items,
          [itemId]: (mobStats.items[itemId] ?? 0) + 1
        }
      };
    }
  }
  
  return {
    ...prev,
    [locationId]: {
      ...current,
      location: newLocation,
      mobs: newMobs,
      mobDrops: newMobDrops
    }
  };
}
