import { useMemo, useState } from "react";
import { AVATARS, DEFAULT_AVATAR_ID } from "../content/avatars/index.js";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import AvatarCircle from "./AvatarCircle";
import { selectProfileId, selectProfileIds, addProfileId } from "../state/playerSlice";
import { selectAvatarProfile } from "../state/gameThunks";
import { enterGame } from "../state/uiSlice";
import { createProfileId, getBaseAvatarIdFromProfileId } from "../systems/player/profileId";

export default function EntryScreen() {
  const dispatch = useAppDispatch();
  const storedProfileId = useAppSelector(selectProfileId);
  const profileIds = useAppSelector(selectProfileIds);

  const hasProfiles = profileIds.length > 0;
  const [mode, setMode] = useState<"profiles" | "create">(
    hasProfiles ? "profiles" : "create"
  );
  const [selectedExistingAvatarId, setSelectedExistingAvatarId] = useState<string | null>(null);
  const [selectedNewAvatarId, setSelectedNewAvatarId] = useState<string>(
    (storedProfileId ? getBaseAvatarIdFromProfileId(storedProfileId) : null) ?? DEFAULT_AVATAR_ID
  );

  const label = mode === "create" ? "New Avatar" : "Avatar Synchronization";

  const availableAvatars = AVATARS;

  const handleEnter = () => {
    const nextProfileId =
      mode === "create"
        ? createProfileId(selectedNewAvatarId, Date.now(), Math.random().toString(16).slice(2, 8))
        : selectedExistingAvatarId;
    if (!nextProfileId) return;
    
    if (mode === "create") {
      dispatch(addProfileId(nextProfileId));
    }
    
    const avatarId = getBaseAvatarIdFromProfileId(nextProfileId) ?? nextProfileId;
    dispatch(selectAvatarProfile({ profileId: nextProfileId, avatarId, isNew: mode === "create" }));
    dispatch(enterGame());
  };

  const profiles = useMemo(() => {
    const byId = new Map(AVATARS.map((a) => [a.id, a]));
    return profileIds
      .map((profileId) => {
        const baseId = getBaseAvatarIdFromProfileId(profileId) ?? profileId;
        const avatar = byId.get(baseId);
        return avatar ? { profileId, avatar } : null;
      })
      .filter(Boolean) as Array<{ profileId: string; avatar: (typeof AVATARS)[number] }>;
  }, [profileIds]);

  return (
    <div className="entry-screen">
      <div className="entry-screen__panel">
        <div className="entry-screen__picker" aria-label="Avatar picker">
          {mode === "create" ? (
            <div className="entry-screen__avatars">
              {availableAvatars.map((avatar) => {
                const isSelected = avatar.id === selectedNewAvatarId;
                return (
                  <AvatarCircle
                    key={avatar.id}
                    as="button"
                    className={isSelected ? "avatar-circle--selected" : ""}
                    onClick={() => setSelectedNewAvatarId(avatar.id)}
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
          ) : (
            <div className="entry-screen__avatars entry-screen__avatars--placeholder" aria-hidden="true" />
          )}
        </div>

        <button
          className="entry-screen__button"
          type="button"
          onClick={handleEnter}
          disabled={mode === "create" ? availableAvatars.length === 0 : !selectedExistingAvatarId}
        >
          {label}
        </button>

        {hasProfiles ? (
          <div className="entry-screen__profiles" aria-label="Avatars">
            {profiles.map(({ profileId, avatar }) => {
              const isSelected = selectedExistingAvatarId === profileId;
              return (
                <AvatarCircle
                  key={profileId}
                  as="button"
                  className={[
                    "entry-screen__profile-square",
                    isSelected ? "avatar-circle--selected" : ""
                  ].join(" ")}
                  onClick={() => {
                    setMode("profiles");
                    setSelectedExistingAvatarId(profileId);
                  }}
                  aria-pressed={isSelected}
                  name={avatar.name}
                  icon={avatar.icon}
                  bg={avatar.bg}
                  iconOffset={avatar.iconOffset}
                  iconScale={avatar.iconScale}
                  bgOffset={avatar.bgOffset}
                  bgScale={avatar.bgScale}
                  size={74}
                />
              );
            })}

            <button
              type="button"
              className="entry-screen__profile-square entry-screen__profile-square--add"
              onClick={() => {
                setMode("create");
                setSelectedNewAvatarId(availableAvatars[0]?.id ?? DEFAULT_AVATAR_ID);
              }}
              title="New Avatar"
              aria-label="New Avatar"
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
