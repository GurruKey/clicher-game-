import React from "react";
import AvatarCircle from "../ui/AvatarCircle.jsx";

export default function EntryScreen({
  hasAvatar,
  avatars,
  selectedAvatarId,
  onSelectAvatar,
  onEnter
}) {
  const label = hasAvatar ? "Avatar Synchronization" : "Create Avatar";

  return (
    <div className="entry-screen">
      <div className="entry-screen__panel">
        {!hasAvatar ? (
          <div className="entry-screen__avatars">
            {avatars.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <AvatarCircle
                  key={avatar.id}
                  as="button"
                  className={isSelected ? "avatar-circle--selected" : ""}
                  onClick={() => onSelectAvatar(avatar.id)}
                  aria-pressed={isSelected}
                  name={avatar.name}
                  icon={avatar.icon}
                  bg={avatar.bg}
                  iconOffset={avatar.iconOffset}
                  iconScale={avatar.iconScale}
                  bgOffset={avatar.bgOffset}
                  bgScale={avatar.bgScale}
                  size={78}
                />
              );
            })}
          </div>
        ) : null}
        <button className="entry-screen__button" type="button" onClick={onEnter}>
          {label}
        </button>
      </div>
    </div>
  );
}
