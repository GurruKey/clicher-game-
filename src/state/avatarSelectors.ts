import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { selectAvatarId } from "./playerSlice";
import { buildAvatarMeta, getSelectedAvatarById } from "../systems/player/avatarMeta";

export const selectSelectedAvatar = createSelector([selectAvatarId], (avatarId) =>
  getSelectedAvatarById(avatarId)
);

export const selectAvatarMeta = createSelector([selectSelectedAvatar], (selectedAvatar) => {
  if (!selectedAvatar) return null;
  return buildAvatarMeta(selectedAvatar);
});

export const selectAvatarMetaFromRoot = (state: RootState) => selectAvatarMeta(state);

