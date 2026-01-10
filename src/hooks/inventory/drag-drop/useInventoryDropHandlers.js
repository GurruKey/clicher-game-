import { useCallback } from "react";
import { canEquipInSlot } from "../../../logic/items/wear/equip/equipLogic.js";
import useInventoryBagEquip from "./useInventoryBagEquip.js";
import useInventoryEquipmentDrag from "./useInventoryEquipmentDrag.js";
import useInventoryEquippedDrop from "./useInventoryEquippedDrop.js";
import useInventoryStackDrop from "./useInventoryStackDrop.js";
import { useInventoryBagInsideGuard } from "../utils/useInventoryDragHelpers.js";

function useInventoryBagSlotDrop({
  equipBagFromSlot,
  dragSource,
  dragItemId,
  currencies
}) {
  return useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (dragSource !== "inventory") {
        return;
      }

      // Validation
      const itemData = currencies?.[dragItemId];
      const isCompatible = canEquipInSlot(itemData, "bag");

      if (!isCompatible) {
        return;
      }

      equipBagFromSlot();
    },
    [dragSource, equipBagFromSlot, dragItemId, currencies]
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
  notifyInventoryFull,
  dragSource,
  dragIndex,
  dragItemId,
  dragItemInstanceId,
  dragSlotId,
  bagSlotsByIdRef,
  resetDrag,
  setEquippedItems,
  placeItemInVisibleSlots,
  currencies
}) {
  const handleEquippedDrop = useInventoryEquippedDrop({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    setBagSlotsById,
    bags,
    getMaxStack,
    notifyBagInside,
    notifyBagNested,
    dragItemId,
    dragItemInstanceId,
    dragSlotId,
    bagSlotsByIdRef,
    setEquippedBagId,
    setEquippedItems,
    equippedBagId,
    notifyInventoryFull,
    resetDrag,
    placeItemInVisibleSlots,
    currencies
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

export default function useInventoryDropHandlers({
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
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  notifyInventoryFull,
  dragSource,
  dragIndex,
  dragItemId,
  dragItemInstanceId,
  dragSlotId,
  resetDrag,
  equippedItems,
  setEquippedItems,
  placeItemInVisibleSlots,
  currencies
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
    notifyInventoryFull,
    dragSource,
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSlotId,
    bagSlotsByIdRef,
    resetDrag,
    setEquippedItems,
    placeItemInVisibleSlots,
    currencies
  });
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

  const handleBagSlotDrop = useInventoryBagSlotDrop({
    equipBagFromSlot,
    dragSource,
    dragItemId,
    currencies
  });

  const handleEquipmentDropOriginal = useInventoryEquipmentDrag({
    dragSource,
    dragIndex,
    dragItemId,
    resetDrag,
    baseSlotCount,
    baseSlots,
    activeBagSlots,
    equippedBagId,
    setEquippedItems,
    setBaseSlots,
    setBagSlotsById,
    placeItemInVisibleSlots,
    notifyInventoryFull,
    equippedItems,
    currencies
  });

  const handleEquipmentDrop = useCallback(
    (slotId) => {
      // Validation
      const itemData = currencies?.[dragItemId];
      const isCompatible = canEquipInSlot(itemData, slotId, currencies);

      if (!isCompatible) {
        return;
      }

      if (slotId === "bag") {
        equipBagFromSlot();
        return;
      }
      handleEquipmentDropOriginal(slotId);
    },
    [equipBagFromSlot, handleEquipmentDropOriginal, dragItemId, currencies]
  );

  return { handleDrop, handleBagSlotDrop, handleEquipmentDrop };
}
