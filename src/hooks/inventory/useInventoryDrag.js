import { useCallback } from "react";
import {
  applyStackDrop,
  buildSlotSetter,
  performBagEquipSwap
} from "./inventoryDragUtils.js";
import { getBagIdFromInstance } from "./inventoryUtils.js";
import {
  useInventoryDragCallbacks,
  useInventoryDragState
} from "./useInventoryDragState.js";

const hasAnyItems = (slots) =>
  Array.isArray(slots) && slots.some((slot) => slot && slot.count > 0);

const hasNestedBagWithItems = ({ containerId, bagSlotsByIdRef, bags }) => {
  if (!containerId || !bagSlotsByIdRef?.current || !bags) {
    return false;
  }
  const containerSlots = bagSlotsByIdRef.current[containerId];
  if (!containerSlots) {
    return false;
  }

  return containerSlots.some((slot) => {
    if (!slot || !bags[slot.id] || !slot.instanceId) {
      return false;
    }
    const nestedSlots = bagSlotsByIdRef.current[slot.instanceId];
    return hasAnyItems(nestedSlots);
  });
};

function useInventoryEquippedDrop({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  bags,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  dragItemId,
  dragItemInstanceId,
  bagSlotsByIdRef,
  setEquippedBagId,
  resetDrag
}) {
  return useCallback(
    (index) => {
      const draggedId = dragItemId;
      if (!draggedId || !bags[draggedId]) {
        return;
      }

      if (
        index < baseSlotCount &&
        hasNestedBagWithItems({
          containerId: dragItemInstanceId,
          bagSlotsByIdRef,
          bags
        })
      ) {
        notifyBagNested(draggedId);
        resetDrag();
        return;
      }

      if (index >= baseSlotCount) {
        notifyBagInside(draggedId);
        resetDrag();
        return;
      }

      if (baseSlots[index]) {
        if (baseSlots[index].id === draggedId) {
          const maxStack = getMaxStack(draggedId);
          if (baseSlots[index].count >= maxStack) {
            resetDrag();
            return;
          }
          setBaseSlots((prev) => {
            const next = [...prev];
            const slot = next[index];
            if (!slot) {
              return prev;
            }
            next[index] = { ...slot, count: slot.count + 1 };
            return next;
          });
          setEquippedBagId(null);
          resetDrag();
        }
        return;
      }

      setBaseSlots((prev) => {
        const next = [...prev];
        next[index] = {
          id: draggedId,
          count: 1,
          instanceId: dragItemInstanceId ?? null
        };
        return next;
      });
      setEquippedBagId(null);
      resetDrag();
    },
    [
      dragItemId,
      dragItemInstanceId,
      bags,
      bagSlotsByIdRef,
      baseSlotCount,
      baseSlots,
      getMaxStack,
      notifyBagInside,
      notifyBagNested,
      resetDrag,
      setBaseSlots,
      setEquippedBagId
    ]
  );
}

function useInventoryBagInsideGuard({
  dragItemId,
  dragItemInstanceId,
  bags,
  baseSlotCount,
  equippedBagId,
  notifyBagInside,
  resetDrag
}) {
  return useCallback(
    (index) => {
      if (!dragItemId || !bags[dragItemId] || index < baseSlotCount) {
        return false;
      }

      if (dragItemInstanceId && equippedBagId && dragItemInstanceId === equippedBagId) {
        notifyBagInside(dragItemId);
        resetDrag();
        return true;
      }

      return false;
    },
    [
      dragItemId,
      dragItemInstanceId,
      bags,
      baseSlotCount,
      equippedBagId,
      notifyBagInside,
      resetDrag
    ]
  );
}

function useInventoryStackDrop({
  baseSlotCount,
  baseSlots,
  activeBagSlots,
  visibleBagSlots,
  equippedBagId,
  setBaseSlots,
  setBagSlotsById,
  getMaxStack,
  dragIndex,
  resetDrag
}) {
  return useCallback(
    (index) => {
      if (dragIndex === null || dragIndex === index) {
        resetDrag();
        return;
      }

      const sourceSlot = visibleBagSlots[dragIndex];
      if (!sourceSlot) {
        resetDrag();
        return;
      }

      const nextBase = [...baseSlots];
      const nextBag = [...activeBagSlots];
      const setSlotValue = buildSlotSetter({
        baseSlotCount,
        nextBase,
        nextBag,
        equippedBagId
      });

      const targetValue = visibleBagSlots[index] ?? null;
      const result = applyStackDrop({
        sourceSlot,
        targetSlot: targetValue,
        getMaxStack
      });
      if (!result.changed) {
        resetDrag();
        return;
      }
      setSlotValue(index, result.target);
      setSlotValue(dragIndex, result.source);

      setBaseSlots(nextBase);
      if (equippedBagId) {
        setBagSlotsById((prev) => ({
          ...prev,
          [equippedBagId]: nextBag
        }));
      }

      resetDrag();
    },
    [
      dragIndex,
      baseSlotCount,
      baseSlots,
      activeBagSlots,
      visibleBagSlots,
      equippedBagId,
      getMaxStack,
      resetDrag,
      setBaseSlots,
      setBagSlotsById
    ]
  );
}

function useInventoryBagEquip({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  createBagInstance,
  setEquippedBagId,
  setBagSlotsById,
  bagSlotsByIdRef,
  getMaxStack,
  notifyBagNested,
  notifyNoSpaceUnequip,
  dragIndex,
  resetDrag
}) {
  return useCallback(
    () => {
      if (
        hasNestedBagWithItems({
          containerId: equippedBagId,
          bagSlotsByIdRef,
          bags
        })
      ) {
        const bagItemId = getBagIdFromInstance(equippedBagId) ?? null;
        notifyBagNested(bagItemId);
        resetDrag();
        return;
      }

      const result = performBagEquipSwap({
        dragIndex,
        visibleBagSlots,
        bags,
        equippedBagId,
        createBagInstance,
        baseSlotCount,
        baseSlots,
        activeBagSlots,
        getMaxStack
      });
      if (!result.ok) {
        if (result.reason === "no-space-old-bag" && result.previousBagId) {
          notifyNoSpaceUnequip(result.previousBagId);
        }
        resetDrag();
        return;
      }

      setBaseSlots(result.nextBase);
      if (result.previousBagId && !result.sourceIsBase) {
        setBagSlotsById((prev) => ({
          ...prev,
          [result.previousBagId]: result.nextBag
        }));
      }
      setEquippedBagId(result.draggedId);
      resetDrag();
    },
    [
      dragIndex,
      baseSlotCount,
      baseSlots,
      activeBagSlots,
      visibleBagSlots,
      bags,
      equippedBagId,
      bagSlotsByIdRef,
      createBagInstance,
      getMaxStack,
      notifyBagNested,
      notifyNoSpaceUnequip,
      resetDrag,
      setBaseSlots,
      setBagSlotsById,
      setEquippedBagId
    ]
  );
}

function useInventoryBagSlotDrop({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  createBagInstance,
  setEquippedBagId,
  setBagSlotsById,
  bagSlotsByIdRef,
  getMaxStack,
  notifyBagNested,
  notifyNoSpaceUnequip,
  dragSource,
  dragIndex,
  resetDrag
}) {
  const equipBagFromSlot = useInventoryBagEquip({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    bags,
    equippedBagId,
    createBagInstance,
    setEquippedBagId,
    setBagSlotsById,
    bagSlotsByIdRef,
    getMaxStack,
    notifyBagNested,
    notifyNoSpaceUnequip,
    dragIndex,
    resetDrag
  });

  return useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (dragSource !== "inventory") {
        return;
      }
      equipBagFromSlot();
    },
    [dragSource, equipBagFromSlot]
  );
}

function useInventorySlotDrop({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  setEquippedBagId,
  setBagSlotsById,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  dragSource,
  dragIndex,
  dragItemId,
  dragItemInstanceId,
  bagSlotsByIdRef,
  resetDrag
}) {
  const handleEquippedDrop = useInventoryEquippedDrop({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    bags,
    getMaxStack,
    notifyBagInside,
    notifyBagNested,
    dragItemId,
    dragItemInstanceId,
    bagSlotsByIdRef,
    setEquippedBagId,
    resetDrag
  });
  const blockBagInside = useInventoryBagInsideGuard({
    dragItemId,
    dragItemInstanceId,
    bags,
    baseSlotCount,
    equippedBagId,
    notifyBagInside,
    resetDrag
  });
  const handleStackDrop = useInventoryStackDrop({
    baseSlotCount,
    baseSlots,
    activeBagSlots,
    visibleBagSlots,
    equippedBagId,
    setBaseSlots,
    setBagSlotsById,
    getMaxStack,
    dragIndex,
    resetDrag
  });

  return useCallback(
    (event, index) => {
      event.preventDefault();
      event.stopPropagation();

      if (dragSource === "equipped") {
        handleEquippedDrop(index);
        return;
      }

      if (blockBagInside(index)) {
        return;
      }

      handleStackDrop(index);
    },
    [dragSource, handleEquippedDrop, blockBagInside, handleStackDrop]
  );
}

function useInventoryDropHandlers({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  createBagInstance,
  setEquippedBagId,
  setBagSlotsById,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  dragSource,
  dragIndex,
  dragItemId,
  dragItemInstanceId,
  bagSlotsByIdRef,
  resetDrag
}) {
  const handleDrop = useInventorySlotDrop({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    bags,
    equippedBagId,
    setEquippedBagId,
    setBagSlotsById,
    getMaxStack,
    notifyBagInside,
    notifyBagNested,
    dragSource,
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    bagSlotsByIdRef,
    resetDrag
  });
  const handleBagSlotDrop = useInventoryBagSlotDrop({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    bags,
    equippedBagId,
    createBagInstance,
    setEquippedBagId,
    setBagSlotsById,
    bagSlotsByIdRef,
    getMaxStack,
    notifyBagNested,
    notifyNoSpaceUnequip,
    dragSource,
    dragIndex,
    resetDrag
  });

  return { handleDrop, handleBagSlotDrop };
}

export default function useInventoryDrag({
  baseSlotCount,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  bags,
  equippedBagId,
  equippedBagItemId,
  createBagInstance,
  setEquippedBagId,
  setBagSlotsById,
  bagSlotsByIdRef,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  onClearTooltip
}) {
  const {
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSource,
    resetDrag,
    handleInventoryDragStart,
    handleEquippedDragStart,
    handleDragOver
  } = useInventoryDragState({ onClearTooltip });
  const { handleDrop, handleBagSlotDrop } = useInventoryDropHandlers({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    bags,
    equippedBagId,
    createBagInstance,
    setEquippedBagId,
    setBagSlotsById,
    getMaxStack,
    notifyBagInside,
    notifyBagNested,
    notifyNoSpaceUnequip,
    dragSource,
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    bagSlotsByIdRef,
    resetDrag
  });
  const {
    handleDragStart,
    handleDragEnd,
    handleEquippedBagDragStart
  } = useInventoryDragCallbacks({
    visibleBagSlots,
    equippedBagId,
    equippedBagItemId,
    handleInventoryDragStart,
    handleEquippedDragStart,
    resetDrag
  });

  return {
    dragIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleBagSlotDrop,
    handleEquippedBagDragStart
  };
}
