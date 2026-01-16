import { NEUTRAL_1_VARIANT } from "./neutral/level_1/variant_1.js";
import { buildStatDetails } from "../stats/index.js";

export const FACTION_VARIANTS = [NEUTRAL_1_VARIANT];

const VARIANTS_BY_NAME_AND_LEVEL = Object.fromEntries(
  FACTION_VARIANTS.map((variant) => [
    `${variant.name.toLowerCase()}:${variant.level}`,
    variant
  ])
);

export function getFactionByName(name, level = 1) {
  if (!name) {
    return null;
  }
  const normalizedLevel = Number.isFinite(Number(level)) ? Number(level) : 1;
  const lowerName = name.toLowerCase();
  return (
    VARIANTS_BY_NAME_AND_LEVEL[`${lowerName}:${normalizedLevel}`] ??
    (normalizedLevel === 1 ? null : VARIANTS_BY_NAME_AND_LEVEL[`${lowerName}:1`] ?? null)
  );
}

export function getFactionStats(name, level = 1) {
  const variant = getFactionByName(name, level);
  if (!variant) {
    return null;
  }
  return buildStatDetails(variant.stats);
}

export const FACTIONS = FACTION_VARIANTS;

