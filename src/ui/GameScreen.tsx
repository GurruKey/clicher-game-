import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAvatarMetaFromRoot } from "../state/avatarSelectors";
import { selectKeybinds } from "../state/settingsSlice";
import { selectKnownAbilityIds, selectSkillsUnlocked } from "../state/playerSlice";
import ClickArea from "./ClickArea";
import {
  closeCharacter,
  openCharacter,
  openSettings,
  selectUi,
  toggleInventory,
  toggleMap,
  toggleSpells
} from "../state/uiSlice";
import type { InventoryContextMenuPayload } from "./ContextMenu";
import useContextMenu from "../hooks/menus/useContextMenu";
import { useItemFromVisibleIndex } from "../state/inventoryThunks";
import { BASE_INVENTORY_SLOTS } from "../config/inventory";
import {
  deleteEquippedSlot,
  deleteFromCurrentContainer,
  equipBagFromVisibleIndex,
  equipFromVisibleIndex,
  unequipEquippedSlotToInventory
} from "../state/inventorySlice";
import useTooltip from "../hooks/ui/useTooltip";
import type { DeleteDialogState } from "./DeleteDialog";
import { selectInventorySnapshot } from "../state/inventorySlice";
import useInventoryBadge from "../hooks/ui/useInventoryBadge";
import useAbilitiesBadge from "../hooks/ui/useAbilitiesBadge";
import SkillsBar from "./SkillsBar";
import { selectSkillSlots, selectSkillSlots2 } from "../state/playerSlice";
import { useGameDragAndDrop } from "./game/hooks/useGameDragAndDrop";
import { useEscapeToClose } from "./game/hooks/useEscapeToClose";
import { useGameplayKeybinds } from "./game/hooks/useGameplayKeybinds";
import GameTopHud from "./game/GameTopHud";
import GameBottomBar from "./game/GameBottomBar";
import GameOverlays from "./game/GameOverlays";
import { getBagIdFromInstance } from "../systems/inventory/bagInstance";
import { CURRENCIES } from "../content/currencies/index.js";

export default function GameScreen() {
  const dispatch = useAppDispatch();
  const avatarMeta = useAppSelector(selectAvatarMetaFromRoot);
  const ui = useAppSelector(selectUi);
  const keybinds = useAppSelector(selectKeybinds);
  const skillSlots = useAppSelector(selectSkillSlots);
  const skillSlots2 = useAppSelector(selectSkillSlots2);
  const skillsUnlocked = useAppSelector(selectSkillsUnlocked);
  const knownAbilityIds = useAppSelector(selectKnownAbilityIds);
  const { contextMenu, menuRef, openContextMenu, closeContextMenu } =
    useContextMenu<InventoryContextMenuPayload>();
  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTooltip();
  const inventory = useAppSelector(selectInventorySnapshot);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);

  const activeBagSlots = inventory.equippedBagId ? inventory.bagSlotsById[inventory.equippedBagId] ?? [] : [];
  const visibleSlots = useMemo(
    () => [...inventory.baseSlots, ...activeBagSlots],
    [activeBagSlots, inventory.baseSlots]
  );
  const itemIndexById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < visibleSlots.length; i++) {
      const slot = visibleSlots[i];
      if (!slot) continue;
      if (!map.has(slot.id)) map.set(slot.id, i);
    }
    return map;
  }, [visibleSlots]);
  const inventoryList = useMemo(
    () => [...inventory.baseSlots, ...activeBagSlots].filter(Boolean).map((s) => ({ id: s!.id })),
    [activeBagSlots, inventory.baseSlots]
  );

  const equippedBagUi = useMemo(() => {
    if (!inventory.equippedBagId) return { iconSrc: null as string | null, label: null as string | null };
    const bagItemId = getBagIdFromInstance(inventory.equippedBagId) ?? String(inventory.equippedBagId).split(":")[0];
    const bag = (CURRENCIES as Record<string, any>)[bagItemId] ?? null;
    return {
      iconSrc: bag?.icon ? String(bag.icon) : null,
      label: bag?.name ? String(bag.name) : "Inventory"
    };
  }, [inventory.equippedBagId]);
  const { newTypesCount, markAllSeen } = useInventoryBadge({
    inventoryList,
    isInventoryOpen: ui.isInventoryOpen
  });
  const { newAbilitiesCount, markAllSeen: markAllAbilitiesSeen } = useAbilitiesBadge({
    knownAbilityIds,
    isAbilitiesOpen: ui.isSpellsOpen
  });

  const { drag, dragCursor, dragIconSrc, dragHotspot, startDrag, resetDrag } = useGameDragAndDrop({
    visibleSlots,
    inventory: inventory as any,
    skillSlots,
    skillSlots2,
    beforeStartDrag: () => {
      hideTooltip();
      closeContextMenu();
      setDeleteDialog(null);
    },
    dispatch
  });
  const prevInventoryOpenRef = useRef(ui.isInventoryOpen);
  const prevAbilitiesOpenRef = useRef(ui.isSpellsOpen);

  const closeOverlays = useCallback(() => {
    hideTooltip();
    closeContextMenu();
    setDeleteDialog(null);
    resetDrag();
  }, [closeContextMenu, hideTooltip, resetDrag]);

  const handleOpenContextMenu = useCallback(
    (
      event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
      payload: Record<string, unknown>
    ) => {
      hideTooltip();
      openContextMenu(event, payload);
    },
    [hideTooltip, openContextMenu]
  );

  const openDeleteDialog = useCallback(
    (payload: InventoryContextMenuPayload) => {
      hideTooltip();
      if (!payload) return;

      if (payload.source === "character") {
        setDeleteDialog({ container: "character", slotId: payload.slotId, value: "1" });
        return;
      }

      if (payload.source !== "bag") return;

      const slotIndex = payload.index;
      if (!Number.isInteger(slotIndex) || slotIndex < 0) return;

      const isBase = slotIndex < BASE_INVENTORY_SLOTS;
      const localIndex = isBase ? slotIndex : slotIndex - BASE_INVENTORY_SLOTS;

      setDeleteDialog({
        container: isBase ? "base" : "bag",
        slotIndex: localIndex,
        value: ""
      });
    },
    [hideTooltip]
  );

  const availableDeleteCount = useMemo(() => {
    if (!deleteDialog) return 0;
    if (deleteDialog.container === "character") return 1;
    if (deleteDialog.container === "base") {
      return inventory.baseSlots[deleteDialog.slotIndex]?.count ?? 0;
    }
    const bagId = inventory.equippedBagId;
    if (!bagId) return 0;
    const bagSlots = inventory.bagSlotsById[bagId] ?? [];
    return bagSlots[deleteDialog.slotIndex]?.count ?? 0;
  }, [deleteDialog, inventory.baseSlots, inventory.bagSlotsById, inventory.equippedBagId]);

  const fillDeleteAll = useCallback(() => {
    setDeleteDialog((prev) => (prev ? { ...prev, value: String(availableDeleteCount) } : prev));
  }, [availableDeleteCount]);

  const closeDeleteDialog = useCallback(() => setDeleteDialog(null), []);

  const confirmDelete = useCallback(() => {
    if (!deleteDialog) return;
    const max = availableDeleteCount;
    const amount = Math.floor(Number(deleteDialog.value));
    if (!Number.isFinite(amount) || amount <= 0 || max <= 0) return;
    const clamped = Math.min(amount, max);

    if (deleteDialog.container === "character") {
      dispatch(deleteEquippedSlot({ slotId: deleteDialog.slotId }));
      setDeleteDialog(null);
      return;
    }

    dispatch(
      deleteFromCurrentContainer({
        container: deleteDialog.container,
        slotIndex: deleteDialog.slotIndex,
        amount: clamped
      })
    );
    setDeleteDialog(null);
  }, [availableDeleteCount, deleteDialog, dispatch]);

  useEffect(() => {
    // Close transient overlays only for modal dialogs (not for Character panel).
    if (
      ui.isSettingsOpen ||
      ui.isKeybindsOpen ||
      ui.isStatsOpen ||
      ui.isPerksOpen ||
      ui.isBloodlineOpen ||
      ui.isReputationOpen ||
      ui.isFameOpen ||
      ui.isMapOpen ||
      ui.isLocationOpen
    ) {
      closeOverlays();
    }
  }, [
    closeOverlays,
    ui.isBloodlineOpen,
    ui.isFameOpen,
    ui.isKeybindsOpen,
    ui.isLocationOpen,
    ui.isMapOpen,
    ui.isPerksOpen,
    ui.isReputationOpen,
    ui.isSettingsOpen,
    ui.isStatsOpen
  ]);

  useEffect(() => {
    const prev = prevInventoryOpenRef.current;
    const next = ui.isInventoryOpen;
    if (prev !== next) {
      // Mirrors srcold bag open/close overlay behavior (closeOverlays + markAllSeen on open).
      hideTooltip();
      closeContextMenu();
      setDeleteDialog(null);
      resetDrag();

      if (next) {
        markAllSeen();
      }

      prevInventoryOpenRef.current = next;
    }
  }, [closeContextMenu, hideTooltip, markAllSeen, ui.isInventoryOpen]);

  useEffect(() => {
    const prev = prevAbilitiesOpenRef.current;
    const next = ui.isSpellsOpen;
    if (prev !== next) {
      if (next) {
        markAllAbilitiesSeen();
      }
      prevAbilitiesOpenRef.current = next;
    }
  }, [markAllAbilitiesSeen, ui.isSpellsOpen]);

  useEscapeToClose({
    ui,
    dispatch,
    deleteDialogOpen: Boolean(deleteDialog),
    onCloseDeleteDialog: closeDeleteDialog,
    contextMenuOpen: Boolean(contextMenu),
    onCloseContextMenu: closeContextMenu
  });

  useGameplayKeybinds({
    ui,
    keybinds: keybinds as any,
    skillSlots,
    skillSlots2,
    itemIndexById,
    dispatch
  });

  return (
    <>
      <GameTopHud
        avatarMeta={avatarMeta as any}
        isCharacterOpen={ui.isCharacterOpen}
        onToggleCharacter={() => dispatch(ui.isCharacterOpen ? closeCharacter() : openCharacter())}
        onOpenSettings={() => dispatch(openSettings())}
      />

      <ClickArea />

      <SkillsBar barId={2} drag={drag?.source === "skillSlot" ? drag : null} onStartDrag={startDrag} />
      <SkillsBar barId={1} drag={drag?.source === "skillSlot" ? drag : null} onStartDrag={startDrag} />

      <GameBottomBar
        isSpellsOpen={ui.isSpellsOpen}
        isInventoryOpen={ui.isInventoryOpen}
        showAbilitiesButton={skillsUnlocked || knownAbilityIds.length > 0}
        knownAbilityIds={knownAbilityIds}
        newTypesCount={newTypesCount}
        newAbilitiesCount={newAbilitiesCount}
        equippedBagIconSrc={equippedBagUi.iconSrc}
        equippedBagLabel={equippedBagUi.label}
        drag={drag}
        tooltip={tooltip}
        onStartDrag={startDrag}
        onTooltipShow={showTooltip}
        onTooltipMove={moveTooltip}
        onTooltipHide={hideTooltip}
        onOpenContextMenu={handleOpenContextMenu}
        onToggleMap={() => dispatch(toggleMap())}
        onToggleSpells={() => dispatch(toggleSpells())}
        onToggleInventory={() => dispatch(toggleInventory())}
      />

      <GameOverlays
        ui={ui}
        drag={drag}
        dragCursor={dragCursor}
        dragIconSrc={dragIconSrc}
        dragHotspot={dragHotspot}
        onStartDrag={startDrag}
        tooltip={tooltip}
        onTooltipShow={showTooltip}
        onTooltipMove={moveTooltip}
        onTooltipHide={hideTooltip}
        onOpenContextMenu={handleOpenContextMenu}
        contextMenu={contextMenu}
        menuRef={menuRef}
        onCloseContextMenu={closeContextMenu}
        onContextMenuAction={(payload) => {
          if (payload.source === "bag") {
            if (payload.action === "equip") {
              if ((payload as any).equippableSlotId === "bag") {
                dispatch(equipBagFromVisibleIndex({ dragIndex: (payload as any).index, baseSlotCount: BASE_INVENTORY_SLOTS }));
              } else {
                dispatch(equipFromVisibleIndex({ dragIndex: (payload as any).index, baseSlotCount: BASE_INVENTORY_SLOTS }));
              }
              return;
            }

            if (payload.action === "use") {
              dispatch(useItemFromVisibleIndex({ slotIndex: (payload as any).index, baseSlotCount: BASE_INVENTORY_SLOTS }));
              return;
            }

            if (payload.action === "delete") {
              openDeleteDialog(payload as any);
              return;
            }

            return;
          }

          if (payload.source === "character") {
            if (payload.action === "unequip") {
              dispatch(unequipEquippedSlotToInventory({ slotId: (payload as any).slotId }));
              return;
            }
            if (payload.action === "delete") {
              openDeleteDialog(payload as any);
              return;
            }
          }
        }}
        deleteDialog={deleteDialog}
        availableDeleteCount={availableDeleteCount}
        onDeleteDialogChange={(value) => setDeleteDialog((prev) => (prev ? { ...prev, value } : prev))}
        onDeleteAll={fillDeleteAll}
        onDeleteCancel={closeDeleteDialog}
        onDeleteConfirm={confirmDelete}
      />
    </>
  );
}
