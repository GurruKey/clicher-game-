import useInventoryActions from "./useInventoryActions.js";
import useInventoryState from "./useInventoryState.js";

export default function useInventory({
  baseSlotCount,
  bags,
  defaultBagId,
  currencies,
  bagUiIcon,
  addNotice,
  onClearTooltip,
  initialInventory
}) {
  const {
    equippedBagId,
    setEquippedBagId,
    equippedBag,
    equippedBagTypeId,
    baseSlots,
    setBaseSlots,
    bagSlotsById,
    setBagSlotsById,
    activeBagSlots,
    visibleBagSlots,
    visibleSlotCount,
    createBagInstance,
    bagButtonIcon,
    bagButtonName,
    baseSlotsRef,
    bagSlotsByIdRef,
    equippedBagIdRef,
    inventoryList,
    getMaxStack,
    notifyInventoryFull,
    notifyBagInside,
    notifyBagNested,
    notifyNoSpaceUnequip,
    inventorySnapshot
  } = useInventoryState({
    baseSlotCount,
    bags,
    defaultBagId,
    bagUiIcon,
    currencies,
    addNotice,
    initialState: initialInventory
  });

  const {
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
  } = useInventoryActions({
    baseSlotCount,
    bags,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    equippedBagId,
    equippedBagItemId: equippedBagTypeId,
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
  });

  return {
    inventoryList,
    placeItemInVisibleSlots,
    bagButtonIcon,
    bagButtonName,
    equippedBag,
    equippedBagId,
    visibleBagSlots,
    visibleSlotCount,
    inventorySnapshot,
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
