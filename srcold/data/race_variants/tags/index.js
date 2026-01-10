import { ELEMENTAL_TAG } from "./elemental.js";
import { HUMANOID_TAG } from "./humanoid.js";

export const RACE_TAGS = [ELEMENTAL_TAG, HUMANOID_TAG];

const TAG_BY_ID = Object.fromEntries(
  RACE_TAGS.map((tag) => [tag.id, tag])
);

export function getRaceTagById(id) {
  if (!id) {
    return null;
  }
  return TAG_BY_ID[id] ?? null;
}
