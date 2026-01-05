import { useCallback, useEffect, useMemo, useState } from "react";

export default function useInventoryBadge({ inventoryList, isBagOpen, onBagClose }) {
  const [seenTypes, setSeenTypes] = useState(() => new Set());

  const newTypesCount = useMemo(() => {
    return inventoryList.reduce(
      (count, item) => (seenTypes.has(item.id) ? count : count + 1),
      0
    );
  }, [inventoryList, seenTypes]);

  const markAllSeen = useCallback(() => {
    setSeenTypes(new Set(inventoryList.map((item) => item.id)));
  }, [inventoryList]);

  useEffect(() => {
    if (!isBagOpen) {
      if (onBagClose) {
        onBagClose();
      }
      return;
    }

    if (newTypesCount === 0) {
      return;
    }

    setSeenTypes((prev) => {
      const next = new Set(prev);
      for (const item of inventoryList) {
        next.add(item.id);
      }
      return next;
    });
  }, [inventoryList, isBagOpen, newTypesCount, onBagClose]);

  return { newTypesCount, markAllSeen };
}
