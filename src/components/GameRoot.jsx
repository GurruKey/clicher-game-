import React from "react";
import GameLayout from "./layout/GameLayout.jsx";
import useGameController from "../hooks/game/useGameController.js";

export default function GameRoot({
  avatarIcon,
  avatarBg,
  avatarName,
  avatarMeta,
  onResetProgress,
  staminaBonus,
  staminaEnabled
}) {
  const {
    resources,
    calculatedMaxResources, // Now using dedicated resource maximums
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
    lootNotices
  } = useGameController({
    onResetProgress,
    staminaBonus,
    staminaEnabled,
    avatarPerks: avatarMeta?.perks || []
  });

  return (
    <>
      <GameLayout
        avatarIcon={avatarIcon}
        avatarBg={avatarBg}
        avatarName={avatarName}
        avatarMeta={avatarMeta}
        resources={resources}
        resourceMaxValues={calculatedMaxResources} // Passing correct data
        onToggleCharacter={onToggleCharacter}
        clickAreaProps={clickAreaProps}
        bagProps={bagProps}
        contextMenuProps={contextMenuProps}
        deleteDialogProps={deleteDialogProps}
        locationDialogProps={locationDialogProps}
        mapDialogProps={mapDialogProps}
        settingsDialogProps={settingsDialogProps}
        keybindsDialogProps={keybindsDialogProps}
        statsDialogProps={statsDialogProps}
        bloodlineDialogProps={bloodlineDialogProps}
        perksDialogProps={perksDialogProps}
        onResetProgress={onResetProgress}
        characterPanelProps={{
            ...characterPanelProps,
            resources
        }}
        tooltip={tooltip}
        lootNotices={lootNotices}
      />
    </>
  );
}
