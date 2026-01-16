import { HUMAN_1_VARIANT } from "./human/level_1/variant_1.js";
import { ORC_1_VARIANT } from "./orc/level_1/variant_1.js";
import { buildStatDetails } from "../stats/index.js";

export const RACE_VARIANTS = [HUMAN_1_VARIANT, ORC_1_VARIANT];

const VARIANT_BY_ID = Object.fromEntries(
  RACE_VARIANTS.map((variant) => [variant.id, variant])
);

export function getRaceVariantById(id) {
  if (!id) {
    return null;
  }
  return VARIANT_BY_ID[id] ?? null;
}

export function getRaceVariantStats(id) {
  const variant = getRaceVariantById(id);
  if (!variant) {
    return null;
  }
  return buildStatDetails(variant.stats);
}
