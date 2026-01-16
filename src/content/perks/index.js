import { STAMINA_PERK } from "./stamina.js";
import { MANA_PERK } from "./mana.js";
import { LIFE_PERK } from "./life.js";

export const PERKS = [
  STAMINA_PERK,
  MANA_PERK,
  LIFE_PERK,
];

const PERK_BY_ID = Object.fromEntries(PERKS.map((perk) => [perk.id, perk]));

export function getPerkById(id) { if (!id) return null; return PERK_BY_ID[id] ?? null; }

export { LIFE_PERK, STAMINA_PERK };
