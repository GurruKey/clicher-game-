import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBagInstanceId, getBagIdFromInstance } from "./inventoryUtils.js";

const normalizeSlot = (slot) => {
  const count = Number(slot?.count ?? 0);
  if (!slot || !slot.id || count <= 0) {
    return null;
  }
  return {
    id: slot.id,
    count: Number.isFinite(count) ? count : 1,
    instanceId: slot.instanceId ?? null
  };
};

const normalizeSlots = (slots, size) => {
  const next = Array(size).fill(null);
  if (!Array.isArray(slots)) {
    return next;
  }
  const limit = Math.min(size, slots.length);
  for (let i = 0; i < limit; i += 1) {
    next[i] = normalizeSlot(slots[i]);
  }
  return next;
};

export default function useInventoryState({
  baseSlotCount,
  bags,
  defaultBagId,
  bagUiIcon,
  currencies,
  addNotice,
  initialState
}) {
  const [baseSlots, setBaseSlots] = useState(() =>
    normalizeSlots(initialState?.baseSlots, baseSlotCount)
  );
  const baseSlotsRef = useRef(baseSlots);

  useEffect(() => {
    baseSlotsRef.current = baseSlots;
  }, [baseSlots]);

  const [defaultBagInstanceId] = useState(() =>
    defaultBagId ? createBagInstanceId(defaultBagId) : null
  );
  const [bagSlotsById, setBagSlotsById] = useState(() => {
    const next = {};
    if (initialState?.bagSlotsById && typeof initialState.bagSlotsById === "object") {
      Object.entries(initialState.bagSlotsById).forEach(([instanceId, slots]) => {
        const bagId = getBagIdFromInstance(instanceId) ?? instanceId;
        const capacity = bags[bagId]?.capacity ?? (Array.isArray(slots) ? slots.length : 0);
        next[instanceId] = normalizeSlots(slots, capacity);
      });
    }

    if (defaultBagInstanceId && bags[defaultBagId] && !next[defaultBagInstanceId]) {
      next[defaultBagInstanceId] = Array(bags[defaultBagId].capacity).fill(null);
    }

    return next;
  });
  const bagSlotsByIdRef = useRef(bagSlotsById);

  useEffect(() => {
    bagSlotsByIdRef.current = bagSlotsById;
  }, [bagSlotsById]);

  useEffect(() => {
    setBagSlotsById((prev) => {
      let changed = false;
      const next = {};

      Object.entries(prev).forEach(([instanceId, current]) => {
        const bagId = getBagIdFromInstance(instanceId) ?? instanceId;
        const capacity = bags[bagId]?.capacity ?? current.length;
        if (current && current.length === capacity) {
          next[instanceId] = current;
          return;
        }

        const resized = (current ?? []).slice(0, capacity);
        while (resized.length < capacity) {
          resized.push(null);
        }
        next[instanceId] = resized;
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [bags]);

  const createBagInstance = useCallback(
    (bagId) => {
      if (!bagId || !bags[bagId]) {
        return null;
      }
      const instanceId = createBagInstanceId(bagId);
      const capacity = bags[bagId].capacity ?? 0;
      setBagSlotsById((prev) => ({
        ...prev,
        [instanceId]: Array(capacity).fill(null)
      }));
      return instanceId;
    },
    [bags]
  );

  const ensureBagSlots = useCallback(
    (instanceId, bagId) => {
      if (!instanceId || !bagId || !bags[bagId]) {
        return;
      }
      setBagSlotsById((prev) => {
        if (prev[instanceId]) {
          return prev;
        }
        const capacity = bags[bagId].capacity ?? 0;
        return {
          ...prev,
          [instanceId]: Array(capacity).fill(null)
        };
      });
    },
    [bags]
  );

  const [equippedBagId, setEquippedBagId] = useState(
    initialState?.equippedBagId ?? defaultBagInstanceId ?? null
  );
  const equippedBagIdRef = useRef(equippedBagId);

  useEffect(() => {
    equippedBagIdRef.current = equippedBagId;
  }, [equippedBagId]);

  const equippedBagTypeId = getBagIdFromInstance(equippedBagId);
  const equippedBag = equippedBagTypeId ? bags[equippedBagTypeId] : null;
  const equippedBagCapacity = equippedBag?.capacity ?? 0;

  useEffect(() => {
    if (!equippedBagId) {
      return;
    }
    setBagSlotsById((prev) => {
      if (prev[equippedBagId]) {
        return prev;
      }
      const bagId = getBagIdFromInstance(equippedBagId) ?? equippedBagId;
      const capacity = bags[bagId]?.capacity ?? 0;
      return {
        ...prev,
        [equippedBagId]: Array(capacity).fill(null)
      };
    });
  }, [equippedBagId, bags]);

  const activeBagSlots = useMemo(() => {
    if (!equippedBagId) {
      return [];
    }
    return bagSlotsById[equippedBagId] ?? Array(equippedBagCapacity).fill(null);
  }, [bagSlotsById, equippedBagId, equippedBagCapacity]);

  const visibleSlotCount =
    baseSlotCount + (equippedBagId ? equippedBagCapacity : 0);
  const visibleBagSlots = useMemo(
    () => [...baseSlots, ...activeBagSlots],
    [baseSlots, activeBagSlots]
  );

  const bagButtonIcon = equippedBag?.icon ?? bagUiIcon;
  const bagButtonName = equippedBag?.name ?? "Bag";

  const inventoryList = useMemo(() => {
    const totals = {};
    const addSlot = (slot) => {
      if (!slot || slot.count <= 0) {
        return;
      }
      totals[slot.id] = (totals[slot.id] ?? 0) + slot.count;
    };

    baseSlots.forEach(addSlot);
    Object.values(bagSlotsById).forEach((slots) => slots.forEach(addSlot));

    return Object.entries(totals)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({
        id,
        count,
        name: currencies[id]?.name ?? id
      }));
  }, [baseSlots, bagSlotsById, currencies]);

  const getMaxStack = useCallback(
    (itemId) => {
      const raw = currencies[itemId]?.maxStack;
      const max = Number(raw);
      if (!Number.isFinite(max) || max <= 0) {
        return 1;
      }
      return max;
    },
    [currencies]
  );

  const pushNotice = addNotice ?? (() => {});

  const notifyInventoryFull = useCallback(() => {
    pushNotice({
      id: Date.now(),
      name: "Inventory full",
      label: "Notice",
      visible: true
    });
  }, [pushNotice]);

  const notifyBagInside = useCallback(
    (itemId) => {
      const warningIcon = currencies[itemId]?.icon ?? bagUiIcon;
      pushNotice({
        id: Date.now(),
        name: "I can't climb inside myself.",
        icon: warningIcon,
        label: "Notice",
        visible: true
      });
    },
    [currencies, bagUiIcon, pushNotice]
  );

  const notifyBagNested = useCallback(
    (itemId) => {
      const warningIcon = currencies[itemId]?.icon ?? bagUiIcon;
      pushNotice({
        id: Date.now(),
        name: "I'm not a nesting doll.",
        icon: warningIcon,
        label: "Notice",
        visible: true
      });
    },
    [currencies, bagUiIcon, pushNotice]
  );

  const notifyNoSpaceUnequip = useCallback(
    (bagId) => {
      const resolvedId = getBagIdFromInstance(bagId) ?? bagId;
      const warningIcon = currencies[resolvedId]?.icon ?? bagUiIcon;
      pushNotice({
        id: Date.now(),
        name: "No space to unequip bag",
        icon: warningIcon,
        label: "Notice",
        visible: true
      });
    },
    [currencies, bagUiIcon, pushNotice]
  );

  return {
    equippedBagId,
    setEquippedBagId,
    equippedBagIdRef,
    equippedBagTypeId,
    equippedBag,
    equippedBagCapacity,
    baseSlots,
    setBaseSlots,
    baseSlotsRef,
    bagSlotsById,
    setBagSlotsById,
    bagSlotsByIdRef,
    activeBagSlots,
    visibleBagSlots,
    visibleSlotCount,
    createBagInstance,
    ensureBagSlots,
    bagButtonIcon,
    bagButtonName,
    inventoryList,
    getMaxStack,
    notifyInventoryFull,
    notifyBagInside,
    notifyBagNested,
    notifyNoSpaceUnequip,
    inventorySnapshot: useMemo(
      () => ({
        baseSlots,
        bagSlotsById,
        equippedBagId
      }),
      [baseSlots, bagSlotsById, equippedBagId]
    )
  };
}
