import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { markAbilitiesSeen, selectSeenAbilityIds } from "../../state/playerSlice";

/**
 * UI-only: tracks "new abilities" count until abilities panel is opened.
 * Persists seen abilities in Redux player state.
 */
export default function useAbilitiesBadge(params: {
  knownAbilityIds: string[];
  isAbilitiesOpen: boolean;
}) {
  const { knownAbilityIds, isAbilitiesOpen } = params;
  const dispatch = useAppDispatch();
  const seenAbilityIds = useAppSelector(selectSeenAbilityIds);
  const seenAbilityIdsSet = useMemo(() => new Set(seenAbilityIds ?? []), [seenAbilityIds]);

  const newAbilitiesCount = useMemo(() => {
    if (!Array.isArray(knownAbilityIds)) return 0;
    return knownAbilityIds.reduce((count, id) => (id && !seenAbilityIdsSet.has(id) ? count + 1 : count), 0);
  }, [knownAbilityIds, seenAbilityIdsSet]);

  const markAllSeen = useCallback(() => {
    if (!Array.isArray(knownAbilityIds)) return;
    const ids = knownAbilityIds.filter((id) => typeof id === "string" && id.length > 0);
    if (ids.length > 0) {
      dispatch(markAbilitiesSeen(ids));
    }
  }, [knownAbilityIds, dispatch]);

  useEffect(() => {
    if (!isAbilitiesOpen) return;
    if (newAbilitiesCount === 0 || !Array.isArray(knownAbilityIds)) return;

    // Filter out items that are already seen to avoid unnecessary dispatches
    const unseenIds = knownAbilityIds.filter((id) => {
      if (typeof id !== "string" || id.length === 0) return false;
      return !seenAbilityIdsSet.has(id);
    });

    if (unseenIds.length > 0) {
      dispatch(markAbilitiesSeen(unseenIds));
    }
  }, [knownAbilityIds, isAbilitiesOpen, newAbilitiesCount, seenAbilityIdsSet, dispatch]);

  return { newAbilitiesCount, markAllSeen };
}
