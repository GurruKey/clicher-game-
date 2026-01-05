import { PEASANT_ORIGIN } from "./peasant.js";
import { MOUNTAIN_RIDGE_ORIGIN } from "./mountain_ridge.js";
import { buildStatDetails } from "../stats/index.js";

export const ORIGINS = [PEASANT_ORIGIN, MOUNTAIN_RIDGE_ORIGIN];

const ORIGIN_BY_NAME = Object.fromEntries(
  ORIGINS.map((origin) => [origin.name.toLowerCase(), origin])
);

export function getOriginByName(name) {
  if (!name) {
    return null;
  }
  return ORIGIN_BY_NAME[name.toLowerCase()] ?? null;
}

export function getOriginStats(name) {
  const origin = getOriginByName(name);
  if (!origin) {
    return null;
  }
  return buildStatDetails(origin.stats);
}
