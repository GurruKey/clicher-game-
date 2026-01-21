import type { RefObject } from "react";
import { createPortal } from "react-dom";
import BloodlineDialog from "../BloodlineDialog";
import CharacterPanel from "../CharacterPanel";
import ContextMenu, { type InventoryContextMenuPayload } from "../ContextMenu";
import DeleteDialog, { type DeleteDialogState } from "../DeleteDialog";
import FameDialog from "../FameDialog";
import KeybindsDialog from "../KeybindsDialog";
import LocationDialog from "../LocationDialog";
import LootToasts from "../LootToasts";
import MapDialog from "../MapDialog";
import PerksDialog from "../PerksDialog";
import ReputationDialog from "../ReputationDialog";
import SettingsDialog from "../SettingsDialog";
import StatsDialog from "../StatsDialog";
import Tooltip from "../Tooltip";
import type { TooltipState } from "../../hooks/ui/useTooltip";
import type { DragCursor, DragHotspot, DragState, StartDragFn } from "./types";

export default function GameOverlays(props: {
  ui: {
    isSettingsOpen: boolean;
    isKeybindsOpen: boolean;
    isStatsOpen: boolean;
    isBloodlineOpen: boolean;
    isPerksOpen: boolean;
    isReputationOpen: boolean;
    isFameOpen: boolean;
    isLocationOpen: boolean;
    isMapOpen: boolean;
    isCharacterOpen: boolean;
    isSpellsOpen?: boolean;
  };
  drag: DragState;
  dragCursor: DragCursor | null;
  dragIconSrc: string | null;
  dragHotspot: DragHotspot | null;
  onStartDrag: StartDragFn;
  tooltip: TooltipState;
  onTooltipShow: (event: { clientX: number; clientY: number }, text: string, rarity?: string) => void;
  onTooltipMove: (event: { clientX: number; clientY: number }) => void;
  onTooltipHide: () => void;
  onOpenContextMenu: (
    event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
    payload: any
  ) => void;
  contextMenu: InventoryContextMenuPayload | null;
  menuRef: RefObject<HTMLDivElement>;
  onCloseContextMenu: () => void;
  onContextMenuAction: (payload: InventoryContextMenuPayload & { action: any }) => void;
  deleteDialog: DeleteDialogState | null;
  availableDeleteCount: number;
  onDeleteDialogChange: (value: string) => void;
  onDeleteAll: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const overlayRoot = typeof document === "undefined" ? null : document.body;

  return (
    <>
      {props.ui.isCharacterOpen ? (
        <CharacterPanel
          drag={props.drag as any}
          onStartDrag={props.onStartDrag as any}
          onTooltipShow={props.onTooltipShow}
          onTooltipMove={props.onTooltipMove}
          onTooltipHide={props.onTooltipHide}
          onOpenContextMenu={props.onOpenContextMenu as any}
        />
      ) : null}

      {props.ui.isSettingsOpen ? <SettingsDialog /> : null}
      {props.ui.isKeybindsOpen ? <KeybindsDialog /> : null}
      {props.ui.isStatsOpen ? <StatsDialog /> : null}
      {props.ui.isBloodlineOpen ? <BloodlineDialog /> : null}
      {props.ui.isPerksOpen ? <PerksDialog /> : null}
      {props.ui.isReputationOpen ? <ReputationDialog /> : null}
      {props.ui.isFameOpen ? <FameDialog /> : null}
      {props.ui.isLocationOpen ? <LocationDialog /> : null}
      {props.ui.isMapOpen ? <MapDialog /> : null}

      <LootToasts />
      <DeleteDialog
        deleteDialog={props.deleteDialog}
        availableCount={props.availableDeleteCount}
        onChange={props.onDeleteDialogChange}
        onAll={props.onDeleteAll}
        onCancel={props.onDeleteCancel}
        onConfirm={props.onDeleteConfirm}
      />
      {overlayRoot
        ? createPortal(
            <>
              {props.drag && props.dragIconSrc && props.dragCursor && props.dragHotspot ? (
                <div
                  className="drag-preview"
                  style={{
                    left: props.dragCursor.x - props.dragHotspot.x,
                    top: props.dragCursor.y - props.dragHotspot.y
                  }}
                >
                  <img src={props.dragIconSrc} alt="" draggable={false} />
                </div>
              ) : null}
              <ContextMenu
                contextMenu={props.contextMenu}
                menuRef={props.menuRef}
                onClose={props.onCloseContextMenu}
                onAction={props.onContextMenuAction as any}
              />
              <Tooltip tooltip={props.tooltip} />
            </>,
            overlayRoot
          )
        : null}
    </>
  );
}
