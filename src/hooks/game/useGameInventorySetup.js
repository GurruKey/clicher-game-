import { useCallback, useState } from "react";
import { BAGS, DEFAULT_BAG_ID } from "../../data/bags.js";
import { CURRENCIES } from "../../data/currencies/index.js";
import bagUiIcon from "../../assets/ui/bag.png";
import { BASE_INVENTORY_SLOTS } from "../../config/inventory.js";
import useInventory from "../inventory/useInventory.js";
import useInventoryBadge from "../inventory/useInventoryBadge.js";
import useContextMenu from "../menus/useContextMenu.js";
import useTooltip from "../ui/useTooltip.js";

const useInventoryFlowState = ({
  baseSlotCount,
  bags,
  defaultBagId,
  currencies,
  bagUiIcon,
  addNotice,
  initialInventory
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
    initialInventory
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
    inventoryList,
    closeOverlays,
    visibleBagSlots,
    visibleSlotCount,
    bagButtonIcon,
    bagButtonName,
    dragIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleBagSlotDrop,
    handleEquippedBagDragStart,
    openContextMenu,
    showTooltip,
    moveTooltip,
    hideTooltip,
    equippedBag
  } = inventoryState;

  const [isBagOpen, setIsBagOpen] = useState(false);
  const { newTypesCount, markAllSeen } = useInventoryBadge({
    inventoryList,
    isBagOpen,
    onBagClose: closeOverlays
  });

  const handleBagToggle = () => {
    setIsBagOpen((prev) => {
      const next = !prev;
      if (next) {
        markAllSeen();
      }
      return next;
    });
  };

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
    onTooltipHide: hideTooltip
  };

  const bagRarity = equippedBag ? currencies[equippedBag.id]?.rarity : undefined;
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
    bagRarity,
    bagIcon: equippedBag?.icon,
    bagName: equippedBag?.name ?? "Bag Slot",
    hasBag: Boolean(equippedBag),
    onBagDrop: handleBagSlotDrop,
    onBagDragOver: handleDragOver,
    onBagDragStart: handleEquippedBagDragStart
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
  initialInventory
}) => {
  const inventoryState = useInventoryFlowState({
    baseSlotCount,
    bags,
    defaultBagId,
    currencies,
    bagUiIcon,
    addNotice,
    initialInventory
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
    confirmDelete
  } = inventoryState;

  const contextMenuProps = {
    contextMenu,
    menuRef,
    onDelete: (payload) => {
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
    onConfirm: confirmDelete
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
  onOpenBloodline
}) {
  return useGameInventoryFlow({
    baseSlotCount: BASE_INVENTORY_SLOTS,
    bags: BAGS,
    defaultBagId: DEFAULT_BAG_ID,
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
    initialInventory
  });
}
