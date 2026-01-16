import { NEUTRAL_FACTION } from "./neutral.js";

export const FACTIONS = [NEUTRAL_FACTION];

const FACTION_BY_ID = Object.fromEntries(FACTIONS.map((faction) => [faction.id, faction]));

export function getFactionById(id) {
  if (!id) {
    return null;
  }
  return FACTION_BY_ID[id] ?? null;
}

