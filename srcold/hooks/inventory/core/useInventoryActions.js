import { useCallback } from "react";
import useItemDelete from "../../game/useItemDelete.js";
import useInventoryDrag from "../drag-drop/useInventoryDrag.js";
import useInventoryPlacement from "./useInventoryPlacement.js";
import { resolveTargetSlot } from "../../../logic/items/wear/equip/equipLogic.js";
import { performBagEquipSwap, getBagDragContext, removeOneFromSlot } from "../utils/inventoryDragUtils.js";
import { getBagIdFromInstance } from "../utils/inventoryUtils.js";
import { hasNestedBagWithItems } from "../utils/useInventoryDragHelpers.js";

export default function useInventoryActions({
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
  baseSlotsRef,
  bagSlotsByIdRef,
  equippedBagIdRef,
  getMaxStack,
  notifyBagInside,
  notifyBagNested,
  notifyNoSpaceUnequip,
  notifyInventoryFull,
    onClearTooltip,
    equippedItems,
    setEquippedItems,
    currencies,
    handleBagToggle
}) {
  const itemDelete = useItemDelete({
    baseSlotCount,
    baseSlots,
    bagSlotsById: bagSlotsByIdRef.current,
    setBagSlotsById,
    bagSlotsByIdRef,
    equippedBagId,
    activeBagSlots,
    equippedItems,
    setEquippedItems,
    setBaseSlots,
    setBagSlotsById,
    setEquippedBagId
  });

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

  const drag = useInventoryDrag({
    baseSlotCount,
    baseSlots,
    setBaseSlots,
    activeBagSlots,
    visibleBagSlots,
    bags,
    equippedBagId,
    equippedBagItemId: equippedBagId ? bags[equippedBagId]?.id : null,
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
  });

  const handleEquipFromBag = useCallback((index, itemId) => {
    const itemData = currencies[itemId];
    if (!itemData) return;

    const targetSlotId = resolveTargetSlot(itemData, equippedItems);
    if (!targetSlotId) return;

    if (targetSlotId === "bag") {
       if (hasNestedBagWithItems({ containerId: equippedBagId, bagSlotsByIdRef, bags })) {
          const bagItemId = getBagIdFromInstance(equippedBagId) ?? null;
          if (notifyBagNested) notifyBagNested(bagItemId);
          return;
       }

       const result = performBagEquipSwap({
         dragIndex: index,
         visibleBagSlots,
         bags,
         equippedBagId,
         createBagInstance,
         baseSlotCount,
         baseSlots,
         activeBagSlots,
         getMaxStack
       });

       if (result.ok) {
         setBaseSlots(result.nextBase);
         if (result.previousBagId && !result.sourceIsBase) {
           setBagSlotsById(prev => ({ ...prev, [result.previousBagId]: result.nextBag }));
         }
         setEquippedBagId(result.draggedId);
       } else if (result.reason === "no-space-old-bag" && result.previousBagId) {
         if (notifyNoSpaceUnequip) notifyNoSpaceUnequip(result.previousBagId);
       }
       return;
    }

    // Normal equipment
    const { sourceIsBase, sourceIndex, nextBase, nextBag, sourceSlots, sourceSlot } = getBagDragContext({
      dragIndex: index,
      baseSlotCount,
      baseSlots,
      activeBagSlots
    });

    if (!sourceSlot) return;

    const oldItem = equippedItems?.[targetSlotId];
    if (oldItem) {
      if (sourceSlot.count > 1) {
        // Try to place old item in inventory first
        const success = placeItemInVisibleSlots(oldItem.id, 1, { instanceId: oldItem.instanceId });
        if (!success) {
          if (notifyInventoryFull) notifyInventoryFull();
          return;
        }
        
        // Equip new item and reduce source stack
        setEquippedItems(prev => ({ ...prev, [targetSlotId]: { id: itemId, instanceId: sourceSlot.instanceId } }));
        const { updatedSlot } = removeOneFromSlot(sourceSlot);
        sourceSlots[sourceIndex] = updatedSlot;
      } else {
        // Simple swap
        setEquippedItems(prev => ({ ...prev, [targetSlotId]: { id: itemId, instanceId: sourceSlot.instanceId } }));
        sourceSlots[sourceIndex] = { ...oldItem, count: 1 };
      }
    } else {
      // Normal equip
      setEquippedItems(prev => ({ ...prev, [targetSlotId]: { id: itemId, instanceId: sourceSlot.instanceId } }));
      const { updatedSlot } = removeOneFromSlot(sourceSlot);
      sourceSlots[sourceIndex] = updatedSlot;
    }

    setBaseSlots(nextBase);
    if (equippedBagId) {
      setBagSlotsById(prev => ({ ...prev, [equippedBagId]: nextBag }));
    }
  }, [
    currencies, equippedItems, equippedBagId, bagSlotsByIdRef, bags, 
    notifyBagNested, visibleBagSlots, createBagInstance, baseSlotCount, 
    baseSlots, activeBagSlots, getMaxStack, setBaseSlots, setBagSlotsById, 
    setEquippedBagId, notifyNoSpaceUnequip, notifyInventoryFull, setEquippedItems
  ]);

  const handleUseItem = useCallback((index, onUse) => {
    const sourceIsBase = index < baseSlotCount;
    const sourceIndex = sourceIsBase ? index : index - baseSlotCount;
    
    const nextBase = [...baseSlots];
    const nextBag = [...activeBagSlots];
    const sourceSlots = sourceIsBase ? nextBase : nextBag;
    const sourceSlot = sourceSlots[sourceIndex];

    if (!sourceSlot || !onUse) return;

    const itemData = currencies[sourceSlot.id];
    if (!itemData) return;

    const success = onUse(itemData);
    if (success) {
      const { updatedSlot } = removeOneFromSlot(sourceSlot);
      sourceSlots[sourceIndex] = updatedSlot;
      
      setBaseSlots(nextBase);
      if (equippedBagId) {
        setBagSlotsById(prev => ({ ...prev, [equippedBagId]: nextBag }));
      }
    }
  }, [baseSlotCount, baseSlots, activeBagSlots, currencies, equippedBagId, setBaseSlots, setBagSlotsById]);

  return {
    ...drag,
    ...itemDelete,
    placeItemInVisibleSlots,
    handleEquipFromBag,
    handleUseItem
  };
}

