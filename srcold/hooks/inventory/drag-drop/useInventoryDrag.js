import {
  useInventoryDragCallbacks,
  useInventoryDragState
} from "./useInventoryDragState.js";
import useInventoryDropHandlers from "./useInventoryDropHandlers.js";

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
  notifyInventoryFull,
  onClearTooltip,
  equippedItems,
  setEquippedItems,
  placeItemInVisibleSlots,
  currencies
}) {
  const {
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSource,
    dragSlotId,
    resetDrag,
    handleInventoryDragStart,
    handleEquippedDragStart,
    handleDragOver
  } = useInventoryDragState({ onClearTooltip });

  const { handleDrop, handleBagSlotDrop, handleEquipmentDrop } = useInventoryDropHandlers({
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
  });

  const {
    handleDragStart,
    handleDragEnd,
    handleEquippedBagDragStart,
    handleEquipmentDragStart
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
    handleEquippedBagDragStart,
    handleEquipmentDragStart,
    handleEquipmentDrop
  };
}
