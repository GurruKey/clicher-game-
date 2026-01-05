import useInventoryDelete from "./useInventoryDelete.js";
import useInventoryDrag from "./useInventoryDrag.js";
import useInventoryPlacement from "./useInventoryPlacement.js";

export default function useInventoryActions({
  baseSlotCount,
  bags,
  baseSlots,
  setBaseSlots,
  activeBagSlots,
  visibleBagSlots,
  equippedBagId,
  equippedBagItemId,
  setEquippedBagId,
  setBagSlotsById,
  baseSlotsRef,
  bagSlotsByIdRef,
  equippedBagIdRef,
  createBagInstance,
  getMaxStack,
  notifyInventoryFull,
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  onClearTooltip,
  bagSlotsById
}) {
  const placeItemInVisibleSlots = useInventoryPlacement({
    getMaxStack,
    bags,
    createBagInstance,
    baseSlotsRef,
    bagSlotsByIdRef,
    equippedBagIdRef,
    setBaseSlots,
    setBagSlotsById,
    notifyInventoryFull
  });

  const {
    dragIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleBagSlotDrop,
    handleEquippedBagDragStart
  } = useInventoryDrag({
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
  });

  const {
    deleteDialog,
    deleteAvailableCount,
    openDeleteDialog,
    closeDeleteDialog,
    updateDeleteValue,
    fillDeleteAll,
    confirmDelete
  } = useInventoryDelete({
    baseSlotCount,
    baseSlots,
    bagSlotsById,
    equippedBagId,
    setBaseSlots,
    setBagSlotsById
  });

  return {
    placeItemInVisibleSlots,
    dragIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleBagSlotDrop,
    handleEquippedBagDragStart,
    deleteDialog,
    deleteAvailableCount,
    openDeleteDialog,
    closeDeleteDialog,
    updateDeleteValue,
    fillDeleteAll,
    confirmDelete
  };
}
