import React from "react";
import AvatarBadge from "../ui/AvatarBadge.jsx";
import BottomBar from "../ui/BottomBar.jsx";
import ClickArea from "../ui/ClickArea.jsx";
import LootToasts from "../ui/LootToasts.jsx";
import { SettingsButton } from "../ui/UiButtons.jsx";
import Tooltip from "../ui/Tooltip.jsx";

export function GameHud({
  staminaCurrent,
  staminaMax,
  onToggleCharacter,
  onOpenSettings,
  clickAreaProps,
  bagProps,
  avatarIcon,
  avatarBg,
  avatarName,
  avatarIconOffset,
  avatarIconScale,
  avatarBgOffset,
  avatarBgScale
}) {
  return (
    <>
      <SettingsButton onClick={onOpenSettings} />
      <AvatarBadge
        onOpen={onToggleCharacter}
        staminaCurrent={staminaCurrent}
        staminaMax={staminaMax}
        avatarIcon={avatarIcon}
        avatarBg={avatarBg}
        avatarName={avatarName}
        avatarIconOffset={avatarIconOffset}
        avatarIconScale={avatarIconScale}
        avatarBgOffset={avatarBgOffset}
        avatarBgScale={avatarBgScale}
      />
      <ClickArea {...clickAreaProps} />
      <BottomBar {...bagProps} />
    </>
  );
}

export function GameOverlays({ tooltip, lootNotices }) {
  return (
    <>
      <Tooltip tooltip={tooltip} />
      <LootToasts lootNotices={lootNotices} />
    </>
  );
}
