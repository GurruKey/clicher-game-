import React from "react";
import CharacterPanel from "../panels/CharacterPanel.jsx";
import {
  DeleteDialog,
  KeybindsDialog,
  SettingsDialog
} from "../dialogs/BasicDialogs.jsx";
import LocationDialog from "../dialogs/LocationDialog.jsx";
import MapDialog from "../dialogs/MapDialog.jsx";
import StatsDialog from "../dialogs/StatsDialog.jsx";
import BloodlineDialog from "../dialogs/BloodlineDialog.jsx";
import PerksDialog from "../dialogs/PerksDialog.jsx";
import ContextMenu from "../menus/ContextMenu.jsx";

export default function GameDialogs({
  contextMenuProps,
  deleteDialogProps,
  locationDialogProps,
  mapDialogProps,
  settingsDialogProps,
  keybindsDialogProps,
  statsDialogProps,
  bloodlineDialogProps,
  perksDialogProps,
  characterPanelProps
}) {
  return (
    <>
      <ContextMenu {...contextMenuProps} />
      <DeleteDialog {...deleteDialogProps} />
      <LocationDialog {...locationDialogProps} />
      <MapDialog {...mapDialogProps} />
      <SettingsDialog {...settingsDialogProps} />
      <KeybindsDialog {...keybindsDialogProps} />
      <StatsDialog {...statsDialogProps} />
      <BloodlineDialog {...bloodlineDialogProps} />
      <PerksDialog {...perksDialogProps} />
      <CharacterPanel {...characterPanelProps} />
    </>
  );
}
