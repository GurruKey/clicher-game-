import { NEUTRAL_FACTION } from "./neutral.js";
import { buildStatDetails } from "../stats/index.js";

export const FACTIONS = [NEUTRAL_FACTION];

const FACTION_BY_NAME = Object.fromEntries(
  FACTIONS.map((faction) => [faction.name.toLowerCase(), faction])
);

export function getFactionByName(name) {
  if (!name) {
    return null;
  }
  return FACTION_BY_NAME[name.toLowerCase()] ?? null;
}

export function getFactionStats(name) {
  const faction = getFactionByName(name);
  if (!faction) {
    return null;
  }
  return buildStatDetails(faction.stats);
}
