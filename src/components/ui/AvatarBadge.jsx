import React from "react";
import AvatarCircle from "./AvatarCircle.jsx";

export default function AvatarBadge({
  onOpen,
  staminaCurrent,
  staminaMax,
  avatarIcon,
  avatarBg,
  avatarName,
  avatarIconOffset,
  avatarIconScale,
  avatarBgOffset,
  avatarBgScale
}) {
  const fillRatio =
    staminaMax > 0 ? Math.min(1, staminaCurrent / staminaMax) : 0;

  return (
    <>
      <div className="avatar-panel">
        <AvatarCircle
          as="button"
          className="avatar-circle--hud"
          size={74}
          onClick={onOpen}
          icon={avatarIcon}
          bg={avatarBg}
          name={avatarName}
          iconOffset={avatarIconOffset}
          iconScale={avatarIconScale}
          bgOffset={avatarBgOffset}
          bgScale={avatarBgScale}
        />
      </div>
      {staminaMax > 0 ? (
        <div className="stamina-panel">
          <div
            className="stamina-bar"
            aria-label={`Stamina ${staminaCurrent} of ${staminaMax}`}
          >
            <div
              className="stamina-bar__fill"
              style={{ width: `${fillRatio * 100}%` }}
            />
            <span className="stamina-bar__text">
              {staminaCurrent}/{staminaMax}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
