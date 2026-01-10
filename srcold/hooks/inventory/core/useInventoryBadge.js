import { useCallback, useEffect, useMemo, useState } from "react";

export default function useInventoryBadge({ inventoryList, isBagOpen, onBagClose }) {
  const [seenTypes, setSeenTypes] = useState(() => new Set());

  const newTypesCount = useMemo(() => {
    if (!Array.isArray(inventoryList)) return 0;
    return inventoryList.reduce(
      (count, item) => (item && !seenTypes.has(item.id) ? count + 1 : count),
      0
    );
  }, [inventoryList, seenTypes]);

  const markAllSeen = useCallback(() => {
    if (!Array.isArray(inventoryList)) return;
    setSeenTypes(new Set(inventoryList.filter(Boolean).map((item) => item.id)));
  }, [inventoryList]);

  useEffect(() => {
    if (!isBagOpen) {
      return;
    }

    if (newTypesCount === 0 || !Array.isArray(inventoryList)) {
      return;
    }

    setSeenTypes((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const item of inventoryList) {
        if (item && !next.has(item.id)) {
          next.add(item.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [inventoryList, isBagOpen, newTypesCount]);

  return { newTypesCount, markAllSeen };
}
