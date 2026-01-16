import { PEASANT_1_VARIANT } from "./peasant/level_1/variant_1.js";
import { MOUNTAIN_RIDGE_1_VARIANT } from "./mountain_ridge/level_1/variant_1.js";
import { CITY_URCHIN_1_VARIANT } from "./city_urchin/level_1/variant_1.js";
import { FOREST_HERMIT_1_VARIANT } from "./forest_hermit/level_1/variant_1.js";
import { TEMPLE_ACOLYTE_1_VARIANT } from "./temple_acolyte/level_1/variant_1.js";
import { BORDER_NOMAD_1_VARIANT } from "./border_nomad/level_1/variant_1.js";
import { buildStatDetails } from "../stats/index.js";

export const ORIGIN_VARIANTS = [
  PEASANT_1_VARIANT,
  MOUNTAIN_RIDGE_1_VARIANT,
  CITY_URCHIN_1_VARIANT,
  FOREST_HERMIT_1_VARIANT,
  TEMPLE_ACOLYTE_1_VARIANT,
  BORDER_NOMAD_1_VARIANT
];

const VARIANTS_BY_NAME_AND_LEVEL = Object.fromEntries(
  ORIGIN_VARIANTS.map((variant) => [
    `${variant.name.toLowerCase()}:${variant.level}`,
    variant
  ])
);

export function getOriginByName(name, level = 1) {
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

export function getOriginStats(name, level = 1) {
  const variant = getOriginByName(name, level);
  if (!variant) {
    return null;
  }
  return buildStatDetails(variant.stats);
}

export const ORIGINS = ORIGIN_VARIANTS;
