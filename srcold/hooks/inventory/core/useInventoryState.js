import { createBagInstanceId, getBagIdFromInstance } from "../utils/inventoryUtils.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useInventoryState({
  baseSlotCount,
  onBagOpen,
  onBagClose,
  initialData,
  bags
}) {
  const [baseSlots, setBaseSlots] = useState(
    () => initialData?.baseSlots || Array(baseSlotCount).fill(null)
  );
  const [bagSlotsById, setBagSlotsById] = useState(() => initialData?.bagSlotsById || {});
  const [equippedBagId, setEquippedBagId] = useState(() => initialData?.equippedBagId || null);
  const [equippedItems, setEquippedItems] = useState(() => initialData?.equippedItems || {});
  const [activeBagId, setActiveBagId] = useState(() => initialData?.equippedBagId || null);

  const baseSlotsRef = useRef(baseSlots);
  const bagSlotsByIdRef = useRef(bagSlotsById);
  const equippedBagIdRef = useRef(equippedBagId);

  useEffect(() => {
    baseSlotsRef.current = baseSlots;
  }, [baseSlots]);

  useEffect(() => {
    bagSlotsByIdRef.current = bagSlotsById;
  }, [bagSlotsById]);

  useEffect(() => {
    equippedBagIdRef.current = equippedBagId;
  }, [equippedBagId]);

  useEffect(() => {
    if (equippedBagId) {
      setActiveBagId(equippedBagId);
    } else {
      setActiveBagId(null);
    }
  }, [equippedBagId]);

  const activeBagSlots = useMemo(() => {
    if (!activeBagId) return [];
    return bagSlotsById[activeBagId] || [];
  }, [bagSlotsById, activeBagId]);

  const visibleBagSlots = useMemo(() => {
    return [...baseSlots, ...activeBagSlots];
  }, [baseSlots, activeBagSlots]);

  const createBagInstance = useCallback((bagId) => {
    const instanceId = createBagInstanceId(bagId);
    const capacity = bags?.[bagId]?.capacity || 0;
    
    setBagSlotsById((prev) => ({
      ...prev,
      [instanceId]: Array(capacity).fill(null)
    }));
    return instanceId;
  }, [bags]);

  const equippedBagItemId = useMemo(() => {
    if (!equippedBagId) return null;
    return getBagIdFromInstance(equippedBagId) || equippedBagId;
  }, [equippedBagId]);

  const handleBagClose = useCallback(() => {
    setActiveBagId(null);
    if (onBagClose) onBagClose();
  }, [onBagClose]);

  const handleBagToggle = useCallback(
    (instanceId) => {
      const targetId = instanceId || equippedBagId;
      if (!targetId) return;

      if (activeBagId === targetId) {
        handleBagClose();
      } else {
        setActiveBagId(targetId);
        if (onBagOpen) onBagOpen();
      }
    },
    [activeBagId, equippedBagId, handleBagClose, onBagOpen]
  );

  const inventorySnapshot = useMemo(
    () => ({
      baseSlots,
      bagSlotsById,
      equippedBagId,
      equippedItems
    }),
    [baseSlots, bagSlotsById, equippedBagId, equippedItems]
  );

  return {
    baseSlots,
    setBaseSlots,
    bagSlotsById,
    setBagSlotsById,
    baseSlotsRef,
    bagSlotsByIdRef,
    equippedBagIdRef,
    equippedBagId,
    setEquippedBagId,
    equippedItems,
    setEquippedItems,
    activeBagSlots,
    visibleBagSlots,
    createBagInstance,
    equippedBagItemId,
    handleBagToggle,
    handleBagClose,
    inventorySnapshot
  };
}
