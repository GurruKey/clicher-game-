import { useCallback, useMemo, useState } from "react";

const normalizeDrops = (drops) => {
  if (!drops || typeof drops !== "object") {
    return { total: 0, items: {} };
  }
  const total = Number.isFinite(Number(drops.total)) ? Number(drops.total) : 0;
  const items = {};
  if (drops.items && typeof drops.items === "object") {
    Object.entries(drops.items).forEach(([id, count]) => {
      const value = Number(count);
      if (Number.isFinite(value) && value > 0) {
        items[id] = value;
      }
    });
  }
  const sum = Object.values(items).reduce((acc, value) => acc + value, 0);
  const normalizedTotal = Math.max(total, sum);
  return { total: normalizedTotal, items };
};

const useLocationDropState = ({ initialDrops }) => {
  const [locationDrops, setLocationDrops] = useState(() =>
    normalizeDrops(initialDrops)
  );

  const recordDrop = useCallback((itemId) => {
    setLocationDrops((prev) => ({
      total: prev.total + 1,
      items: {
        ...prev.items,
        [itemId]: (prev.items[itemId] ?? 0) + 1
      }
    }));
  }, []);

  return { locationDrops, recordDrop };
};

const useLocationDropItems = ({ locationDrops, currencies }) => {
  return useMemo(() => {
    if (locationDrops.total === 0) {
      return [];
    }

    return Object.entries(locationDrops.items)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const rate = (count / locationDrops.total) * 100;
        return {
          id,
          name: currencies[id]?.name ?? id,
          rarity: currencies[id]?.rarity ?? "common",
          rate: rate.toFixed(1)
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [locationDrops, currencies]);
};

export default function useLootRewards({
  currencies,
  addNotice,
  placeItemInVisibleSlots,
  initialDrops
}) {
  const { locationDrops, recordDrop } = useLocationDropState({ initialDrops });
  const locationItems = useLocationDropItems({ locationDrops, currencies });

  const handleLoot = useCallback(
    (lootId) => {
      if (!lootId) {
        return;
      }

      if (placeItemInVisibleSlots) {
        placeItemInVisibleSlots(lootId, 1);
      }

      recordDrop(lootId);

      const loot = currencies[lootId];
      if (addNotice) {
        addNotice({
          id: Date.now(),
          name: loot?.name ?? lootId,
          icon: loot?.icon,
          rarity: loot?.rarity ?? "common",
          visible: true
        });
      }
    },
    [addNotice, currencies, placeItemInVisibleSlots, recordDrop]
  );

  return { locationItems, handleLoot, locationDrops };
}
