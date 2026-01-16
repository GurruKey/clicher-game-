import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { markItemsSeen, selectInventorySnapshot } from "../../state/inventorySlice";

type ItemLike = { id: string } | null;

/**
 * UI-only: tracks "new item types" count until inventory is opened.
 * Now persists seen items in Redux inventory state.
 */
export default function useInventoryBadge(params: {
  inventoryList: ItemLike[];
  isInventoryOpen: boolean;
}) {
  const { inventoryList, isInventoryOpen } = params;
  const dispatch = useAppDispatch();
  const inventory = useAppSelector(selectInventorySnapshot);
  const seenItemIdsSet = useMemo(() => new Set(inventory.seenItemIds ?? []), [inventory.seenItemIds]);

  const newTypesCount = useMemo(() => {
    if (!Array.isArray(inventoryList)) return 0;
    return inventoryList.reduce((count, item) => (item && !seenItemIdsSet.has(item.id) ? count + 1 : count), 0);
  }, [inventoryList, seenItemIdsSet]);

  const markAllSeen = useCallback(() => {
    if (!Array.isArray(inventoryList)) return;
    const ids = inventoryList
      .filter((i): i is { id: string } => Boolean(i))
      .map((item) => item.id);
    if (ids.length > 0) {
      dispatch(markItemsSeen(ids));
    }
  }, [inventoryList, dispatch]);

  useEffect(() => {
    if (!isInventoryOpen) return;
    if (newTypesCount === 0 || !Array.isArray(inventoryList)) return;

    // Filter out items that are already seen to avoid unnecessary dispatches
    const unseenIds = inventoryList
      .filter((i): i is { id: string } => {
        if (!i) return false;
        return !seenItemIdsSet.has(i.id);
      })
      .map((i) => i.id);

    if (unseenIds.length > 0) {
      dispatch(markItemsSeen(unseenIds));
    }
  }, [inventoryList, isInventoryOpen, newTypesCount, seenItemIdsSet, dispatch]);

  return { newTypesCount, markAllSeen };
}
