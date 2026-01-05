import React from "react";
import GameLayout from "./layout/GameLayout.jsx";
import useGameController from "../hooks/game/useGameController.js";

export default function GameRoot({
  avatarIcon,
  avatarBg,
  avatarName,
  avatarMeta,
  staminaBonus,
  staminaEnabled,
  onResetProgress
}) {
  const layoutProps = useGameController({
    onResetProgress,
    staminaBonus,
    staminaEnabled
  });

  return (
    <GameLayout
      {...layoutProps}
      avatarIcon={avatarIcon}
      avatarBg={avatarBg}
      avatarName={avatarName}
      avatarMeta={avatarMeta}
      onResetProgress={onResetProgress}
    />
  );
}
