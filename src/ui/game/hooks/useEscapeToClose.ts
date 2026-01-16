import { useEffect } from "react";
import {
  closeLocation,
  closeMap,
  closeBloodline,
  closeCharacter,
  closeFame,
  closeKeybinds,
  closePerks,
  closeReputation,
  closeSettings,
  closeStats
} from "../../../state/uiSlice";

export function useEscapeToClose(args: {
  ui: {
    isLocationOpen: boolean;
    isMapOpen: boolean;
    isPerksOpen: boolean;
    isStatsOpen: boolean;
    isBloodlineOpen: boolean;
    isKeybindsOpen: boolean;
    isReputationOpen: boolean;
    isFameOpen: boolean;
    isCharacterOpen: boolean;
    isSettingsOpen: boolean;
  };
  dispatch: (action: any) => void;
  deleteDialogOpen: boolean;
  onCloseDeleteDialog: () => void;
  contextMenuOpen: boolean;
  onCloseContextMenu: () => void;
}): void {
  const { ui, dispatch, deleteDialogOpen, onCloseDeleteDialog, contextMenuOpen, onCloseContextMenu } = args;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase?.() ?? "";
      const isTypingTarget = tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;
      if (isTypingTarget) return;
      if (event.key !== "Escape") return;

      if (deleteDialogOpen) {
        onCloseDeleteDialog();
        return;
      }
      if (contextMenuOpen) {
        onCloseContextMenu();
        return;
      }

      if (ui.isLocationOpen) {
        dispatch(closeLocation());
        return;
      }
      if (ui.isMapOpen) {
        dispatch(closeMap());
        return;
      }
      if (ui.isPerksOpen) {
        dispatch(closePerks());
        return;
      }
      if (ui.isStatsOpen) {
        dispatch(closeStats());
        return;
      }
      if (ui.isBloodlineOpen) {
        dispatch(closeBloodline());
        return;
      }
      if (ui.isKeybindsOpen) {
        dispatch(closeKeybinds());
        return;
      }
      if (ui.isReputationOpen) {
        dispatch(closeReputation());
        return;
      }
      if (ui.isFameOpen) {
        dispatch(closeFame());
        return;
      }
      if (ui.isCharacterOpen) {
        dispatch(closeCharacter());
        return;
      }
      if (ui.isSettingsOpen) {
        dispatch(closeSettings());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    contextMenuOpen,
    deleteDialogOpen,
    dispatch,
    onCloseContextMenu,
    onCloseDeleteDialog,
    ui.isBloodlineOpen,
    ui.isCharacterOpen,
    ui.isFameOpen,
    ui.isKeybindsOpen,
    ui.isLocationOpen,
    ui.isMapOpen,
    ui.isPerksOpen,
    ui.isReputationOpen,
    ui.isSettingsOpen,
    ui.isStatsOpen
  ]);
}
