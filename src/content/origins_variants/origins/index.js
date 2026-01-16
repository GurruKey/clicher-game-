import { PEASANT_ORIGIN } from "./peasant.js";
import { MOUNTAIN_RIDGE_ORIGIN } from "./mountain_ridge.js";
import { CITY_URCHIN_ORIGIN } from "./city_urchin.js";
import { FOREST_HERMIT_ORIGIN } from "./forest_hermit.js";
import { TEMPLE_ACOLYTE_ORIGIN } from "./temple_acolyte.js";
import { BORDER_NOMAD_ORIGIN } from "./border_nomad.js";

export const ORIGINS = [
  PEASANT_ORIGIN,
  MOUNTAIN_RIDGE_ORIGIN,
  CITY_URCHIN_ORIGIN,
  FOREST_HERMIT_ORIGIN,
  TEMPLE_ACOLYTE_ORIGIN,
  BORDER_NOMAD_ORIGIN
];

const ORIGIN_BY_ID = Object.fromEntries(ORIGINS.map((origin) => [origin.id, origin]));

export function getOriginById(id) {
  if (!id) {
    return null;
  }
  return ORIGIN_BY_ID[id] ?? null;
}
