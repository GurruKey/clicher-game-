import { useCallback, useState } from "react";
import { drinkPotion } from "../../logic/items/potions/potionLogic.js";
import { BAGS } from "../../data/bags.js";
import { STARTER_CONFIG } from "../../data/starter_packs.js";
import { CURRENCIES } from "../../data/currencies/index.js";
import bagUiIcon from "../../assets/ui/bag.png";
import { BASE_INVENTORY_SLOTS } from "../../config/inventory.js";
import useInventory from "../inventory/core/useInventory.js";
import useInventoryBadge from "../inventory/core/useInventoryBadge.js";
import useContextMenu from "../menus/useContextMenu.js";
import useTooltip from "../ui/useTooltip.js";

const useInventoryFlowState = ({
  baseSlotCount,
  bags,
  defaultBagId,
  currencies,
  bagUiIcon,
  addNotice,
  initialData,
  getMaxStack
}) => {
  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTooltip();
  const { contextMenu, menuRef, openContextMenu, closeContextMenu } =
    useContextMenu();
  const handleOpenContextMenu = useCallback(
    (event, payload) => {
      hideTooltip();
      openContextMenu(event, payload);
    },
    [hideTooltip, openContextMenu]
  );
  const inventory = useInventory({
    baseSlotCount,
    bags,
    defaultBagId,
    currencies,
    bagUiIcon,
    addNotice,
    onClearTooltip: hideTooltip,
    initialData,
    getMaxStack
  });
  const closeOverlays = () => {
    hideTooltip();
    closeContextMenu();
    inventory.closeDeleteDialog();
  };

  return {
    tooltip,
    showTooltip,
    moveTooltip,
    hideTooltip,
    contextMenu,
    menuRef,
    openContextMenu: handleOpenContextMenu,
    closeContextMenu,
    ...inventory,
    closeOverlays
  };
};

const useInventoryPanels = ({
  inventoryState,
  openMapDialog,
  isCharacterOpen,
  gearLayer,
  onToggleLayer,
  onOpenDetails,
  onOpenBloodline,
  onOpenPerks,
  currencies,
  baseSlotCount
}) => {
  const {
    closeOverlays,
    visibleBagSlots,
    dragIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleEquipmentDragStart,
    handleEquipmentDrop,
    equippedItems,
    openContextMenu,
    showTooltip,
    moveTooltip,
    hideTooltip,
    equippedBag,
    equippedBagId,
    handleBagToggle: inventoryHandleBagToggle
  } = inventoryState;

  const inventoryList = visibleBagSlots;
  const visibleSlotCount = visibleBagSlots.length;
  const bagButtonIcon = equippedBag?.icon || bagUiIcon;
  const bagButtonName = equippedBag?.name || "Inventory";

  const [isBagOpen, setIsBagOpen] = useState(false);
  const { newTypesCount, markAllSeen } = useInventoryBadge({
    inventoryList,
    isBagOpen,
    onBagClose: closeOverlays
  });

  const handleBagToggle = useCallback(() => {
    setIsBagOpen((prev) => {
      const next = !prev;
      if (next) {
        markAllSeen();
      }
      if (inventoryHandleBagToggle) {
          inventoryHandleBagToggle(equippedBagId);
      }
      return next;
    });
  }, [markAllSeen, inventoryHandleBagToggle, equippedBagId]);

  const handleMapOpen = () => {
    if (closeOverlays) {
      closeOverlays();
    }
    if (openMapDialog) {
      openMapDialog();
    }
  };

  const bagProps = {
    isBagOpen,
    onBagToggle: handleBagToggle,
    onMapOpen: handleMapOpen,
    newTypesCount,
    bagSlots: visibleBagSlots,
    dragIndex,
    currencies,
    bagIcon: bagButtonIcon,
    bagName: bagButtonName,
    bagSlotCount: visibleSlotCount,
    baseSlotCount,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onContextMenu: openContextMenu,
    onTooltipShow: showTooltip,
    onTooltipMove: moveTooltip,
    onTooltipHide: hideTooltip,
    equippedItems
  };

  const characterPanelProps = {
    isOpen: isCharacterOpen,
    gearLayer,
    onToggleLayer,
    onOpenDetails,
    onOpenBloodline,
    onOpenPerks,
    onTooltipShow: showTooltip,
    onTooltipMove: moveTooltip,
    onTooltipHide: hideTooltip,
    onContextMenu: openContextMenu,
    onEquipmentDragStart: handleEquipmentDragStart,
    onEquipmentDrop: handleEquipmentDrop,
    equippedItems: {
      ...equippedItems,
      bag: equippedBag ? { id: equippedBag.id, instanceId: equippedBagId } : null
    },
    currencies
  };

  return {
    bagProps,
    characterPanelProps,
    isBagOpen
  };
};

const useGameInventoryFlow = ({
  baseSlotCount,
  bags,
  defaultBagId,
  currencies,
  bagUiIcon,
  addNotice,
  openMapDialog,
  isCharacterOpen,
  gearLayer,
  onToggleLayer,
  onOpenDetails,
  onOpenBloodline,
  onOpenPerks,
  initialInventory,
  addResource,
  getMaxStack
}) => {
  // Pre-generate starter inventory if none exists
  const effectiveInitialInventory = initialInventory || (() => {
    const slots = Array(baseSlotCount).fill(null);
    if (STARTER_CONFIG.initialItems) {
      STARTER_CONFIG.initialItems.forEach((item, index) => {
        if (index < baseSlotCount) {
          slots[index] = { id: item.id, count: item.count };
        }
      });
    }
    return {
      baseSlots: slots,
      bagSlotsById: {},
      equippedBagId: null
    };
  })();

  const inventoryState = useInventoryFlowState({
    baseSlotCount,
    bags,
    defaultBagId,
    currencies,
    bagUiIcon,
    addNotice,
    initialData: effectiveInitialInventory,
    getMaxStack
  });

  const { bagProps, characterPanelProps, isBagOpen } = useInventoryPanels({
    inventoryState,
    openMapDialog,
    isCharacterOpen,
    gearLayer,
    onToggleLayer,
    onOpenDetails,
    onOpenBloodline,
    onOpenPerks,
    currencies,
    baseSlotCount
  });

  const {
    contextMenu,
    menuRef,
    openDeleteDialog,
    closeContextMenu,
    deleteDialog,
    deleteAvailableCount,
    closeDeleteDialog,
    updateDeleteValue,
    fillDeleteAll,
    confirmDelete,
    setEquippedItems,
    setEquippedBagId,
    handleEquipFromBag,
    handleUseItem
  } = inventoryState;

  const handleDeleteBag = () => {
    setEquippedBagId(null);
  };

  const handleDeleteEquipped = (slotId) => {
    if (slotId === "bag") {
      handleDeleteBag();
      return;
    }
    setEquippedItems((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleUnequip = (slotId, itemId, instanceId) => {
    const success = inventoryState.placeItemInVisibleSlots(itemId, 1, { instanceId });
    
    if (success) {
      if (slotId === "bag") {
        setEquippedBagId(null);
      } else {
        setEquippedItems((prev) => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      }
    }
  };

  const contextMenuProps = {
    contextMenu,
    menuRef,
    onDelete: (payload) => {
      if (payload.action === "unequip") {
        handleUnequip(payload.slotId, payload.id, payload.instanceId);
        closeContextMenu();
        return;
      }
      if (payload.action === "equip") {
        handleEquipFromBag(payload.index, payload.id);
        closeContextMenu();
        return;
      }
      if (payload.action === "use") {
        handleUseItem(payload.index, (itemData) => {
           return drinkPotion(itemData, { addResource });
        });
        closeContextMenu();
        return;
      }
      openDeleteDialog(payload);
      closeContextMenu();
    }
  };

  const deleteDialogProps = {
    deleteDialog,
    availableCount: deleteAvailableCount,
    onChange: updateDeleteValue,
    onAll: fillDeleteAll,
    onCancel: closeDeleteDialog,
    onConfirm: () => confirmDelete(handleDeleteEquipped, handleDeleteBag)
  };

  return {
    bagProps,
    characterPanelProps,
    contextMenuProps,
    deleteDialogProps,
    tooltip: inventoryState.tooltip,
    isBagOpen,
    closeOverlays: inventoryState.closeOverlays,
    placeItemInVisibleSlots: inventoryState.placeItemInVisibleSlots,
    equippedBag: inventoryState.equippedBag,
    inventorySnapshot: inventoryState.inventorySnapshot
  };
};

export default function useGameInventorySetup({
  dialogs,
  addNotice,
  initialInventory,
  onOpenDetails,
  onOpenBloodline,
  addResource
}) {
  const getMaxStack = useCallback((itemId) => {
    return CURRENCIES[itemId]?.maxStack || 1;
  }, []);

  return useGameInventoryFlow({
    baseSlotCount: BASE_INVENTORY_SLOTS,
    bags: BAGS,
    defaultBagId: STARTER_CONFIG.defaultBagId,
    currencies: CURRENCIES,
    bagUiIcon,
    addNotice,
    openMapDialog: dialogs.mapDialog.open,
    isCharacterOpen: dialogs.characterDialog.isOpen,
    gearLayer: dialogs.characterDialog.gearLayer,
    onToggleLayer: dialogs.characterDialog.toggleLayer,
    onOpenDetails,
    onOpenBloodline,
    onOpenPerks: dialogs.perksDialog.open,
    initialInventory,
    addResource,
    getMaxStack
  });
}
