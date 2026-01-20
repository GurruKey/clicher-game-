import { RAT_MOB } from "./mobs/rat.js";

export const MOBS = {
  [RAT_MOB.id]: RAT_MOB
};

export const getMobById = (id) => {
  if (typeof id !== "string" || id.length === 0) return null;
  return MOBS[id] ?? null;
};
