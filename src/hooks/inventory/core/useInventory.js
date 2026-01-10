import { useMemo } from "react";
import useInventoryActions from "./useInventoryActions.js";
import useInventoryState from "./useInventoryState.js";

export default function useInventory({
  baseSlotCount,
  onBagOpen,
  onBagClose,
  initialData,
  bags,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  notifyInventoryFull,
  onClearTooltip,
  currencies
}) {
  const state = useInventoryState({
    baseSlotCount,
    onBagOpen,
    onBagClose,
    initialData,
    bags
  });

  const actions = useInventoryActions({
    baseSlotCount,
    baseSlots: state.baseSlots,
    setBaseSlots: state.setBaseSlots,
    activeBagSlots: state.activeBagSlots,
    visibleBagSlots: state.visibleBagSlots,
    bags,
    equippedBagId: state.equippedBagId,
    handleBagToggle: state.handleBagToggle,
    createBagInstance: state.createBagInstance,
    setEquippedBagId: state.setEquippedBagId,
    setBagSlotsById: state.setBagSlotsById,
    baseSlotsRef: state.baseSlotsRef,
    bagSlotsByIdRef: state.bagSlotsByIdRef,
    equippedBagIdRef: state.equippedBagIdRef,
    getMaxStack,
    notifyBagInside,
    notifyBagNested,
    notifyNoSpaceUnequip,
    notifyInventoryFull,
    onClearTooltip,
    equippedItems: state.equippedItems,
    setEquippedItems: state.setEquippedItems,
    currencies
  });

  const equippedBag = useMemo(() => {
    if (!state.equippedBagItemId || !currencies) return null;
    const itemData = currencies[state.equippedBagItemId];
    if (!itemData) return null;
    return {
      id: state.equippedBagItemId,
      icon: itemData.icon,
      name: itemData.name
    };
  }, [state.equippedBagItemId, currencies]);

  return {
    ...state,
    ...actions,
    equippedBag
  };
}
