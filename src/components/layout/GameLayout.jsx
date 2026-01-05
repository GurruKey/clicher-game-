import React from "react";
import GameDialogs from "./GameDialogs.jsx";
import { GameHud, GameOverlays } from "./GameLayoutParts.jsx";

export default function GameLayout({
  staminaCurrent,
  staminaMax,
  onToggleCharacter,
  clickAreaProps,
  bagProps,
  contextMenuProps,
  deleteDialogProps,
  locationDialogProps,
  mapDialogProps,
  settingsDialogProps,
  keybindsDialogProps,
  statsDialogProps,
  bloodlineDialogProps,
  perksDialogProps,
  characterPanelProps,
  tooltip,
  lootNotices,
  avatarIcon,
  avatarBg,
  avatarName,
  avatarMeta,
  onResetProgress
}) {
  const avatarFocus = {
    iconOffset: avatarMeta?.iconOffset,
    iconScale: avatarMeta?.iconScale ?? 1,
    bgOffset: avatarMeta?.bgOffset,
    bgScale: avatarMeta?.bgScale ?? 1
  };
  const mapDialogWithAvatar = {
    ...mapDialogProps,
    avatarIcon,
    avatarBg,
    avatarName,
    avatarIconOffset: avatarFocus.iconOffset,
    avatarIconScale: avatarFocus.iconScale,
    avatarBgOffset: avatarFocus.bgOffset,
    avatarBgScale: avatarFocus.bgScale
  };
  const settingsDialogWithReset = {
    ...settingsDialogProps,
    onResetProgress
  };
  const statsDialogWithAvatar = {
    ...statsDialogProps,
    avatarMeta
  };
  const bloodlineDialogWithAvatar = {
    ...bloodlineDialogProps,
    avatarMeta
  };
  const perksDialogWithAvatar = {
    ...perksDialogProps,
    perks: avatarMeta?.perks ?? []
  };

  return (
    <main className="main">
      <GameHud
        staminaCurrent={staminaCurrent}
        staminaMax={staminaMax}
        onToggleCharacter={onToggleCharacter}
        onOpenSettings={settingsDialogProps.onOpen}
        clickAreaProps={clickAreaProps}
        bagProps={bagProps}
        avatarIcon={avatarIcon}
        avatarBg={avatarBg}
        avatarName={avatarName}
        avatarIconOffset={avatarFocus.iconOffset}
        avatarIconScale={avatarFocus.iconScale}
        avatarBgOffset={avatarFocus.bgOffset}
        avatarBgScale={avatarFocus.bgScale}
      />
      <GameDialogs
        contextMenuProps={contextMenuProps}
        deleteDialogProps={deleteDialogProps}
        locationDialogProps={locationDialogProps}
        mapDialogProps={mapDialogWithAvatar}
        settingsDialogProps={settingsDialogWithReset}
        keybindsDialogProps={keybindsDialogProps}
        statsDialogProps={statsDialogWithAvatar}
        bloodlineDialogProps={bloodlineDialogWithAvatar}
        perksDialogProps={perksDialogWithAvatar}
        characterPanelProps={characterPanelProps}
      />
      <GameOverlays tooltip={tooltip} lootNotices={lootNotices} />
    </main>
  );
}
