export type LocationDrops = {
  total: number;
  items: Record<string, number>;
};

/**
 * Данные об открытиях по всем локациям.
 * Ключ - ID локации, значение - статистика выпадений.
 */
export type Discoveries = Record<string, LocationDrops>;

export function normalizeLocationDrops(drops: unknown): LocationDrops {
  if (!drops || typeof drops !== "object") {
    return { total: 0, items: {} };
  }

  const rawTotal = Number((drops as { total?: unknown }).total);
  const total = Number.isFinite(rawTotal) ? rawTotal : 0;

  const rawItems = (drops as { items?: unknown }).items;
  const items: Record<string, number> = {};
  if (rawItems && typeof rawItems === "object" && !Array.isArray(rawItems)) {
    for (const [id, count] of Object.entries(rawItems as Record<string, unknown>)) {
      const value = Number(count);
      if (Number.isFinite(value) && value > 0) {
        items[id] = value;
      }
    }
  }

  const sum = Object.values(items).reduce((acc, value) => acc + value, 0);
  const normalizedTotal = Math.max(total, sum);
  return { total: normalizedTotal, items };
}

export function normalizeDiscoveries(raw: unknown): Discoveries {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  // Если это старый формат (объект с total и items напрямую)
  if ("total" in raw && "items" in raw) {
    // Мы не знаем ID локации для старого формата, но можем попробовать положить это в дефолтную локацию 
    // или просто проигнорировать, если это не критично.
    // Для безопасности вернём пустой объект или попробуем сопоставить с какой-то локацией.
    // Но лучше просто начать заново, если формат сменился радикально.
    // Однако, чтобы не ломать совсем, можно попытаться угадать или оставить пустым.
    return {}; 
  }

  const result: Discoveries = {};
  for (const [locId, drops] of Object.entries(raw as Record<string, unknown>)) {
    result[locId] = normalizeLocationDrops(drops);
  }
  return result;
}

export function recordDropInDiscovery(
  prev: Discoveries,
  locationId: string,
  itemId: string
): Discoveries {
  if (!locationId || !itemId) return prev;
  
  const current = prev[locationId] ?? { total: 0, items: {} };
  return {
    ...prev,
    [locationId]: {
      total: current.total + 1,
      items: {
        ...current.items,
        [itemId]: (current.items[itemId] ?? 0) + 1
      }
    }
  };
}
