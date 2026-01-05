import { COMMON } from "./common.js";
import { UNCOMMON } from "./uncommon.js";
import { RARE } from "./rare.js";
import { EPIC } from "./epic.js";
import { LEGENDARY } from "./legendary.js";

export const RARITIES = {
  [COMMON.id]: COMMON,
  [UNCOMMON.id]: UNCOMMON,
  [RARE.id]: RARE,
  [EPIC.id]: EPIC,
  [LEGENDARY.id]: LEGENDARY
};

export const RARITY_ORDER = [
  COMMON.id,
  UNCOMMON.id,
  RARE.id,
  EPIC.id,
  LEGENDARY.id
];

export { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY };
