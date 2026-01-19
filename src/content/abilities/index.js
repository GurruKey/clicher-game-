import { COLLECTING_ABILITY } from "./collecting.js";
import { AUTO_COLLECTING_ABILITY } from "./auto_collecting.js";
import { FROST_BITE_ABILITY } from "./frost_bite.js";
import { STONE_SKIN_ABILITY } from "./stone_skin.js";
import { HEALING_TOUCH_ABILITY } from "./healing_touch.js";
import { SHADOW_STEP_ABILITY } from "./shadow_step.js";
import { STAMINA_RESTORE_ABILITY } from "./stamina_restore.js";
import { STAMINA_AURA_ABILITY } from "./stamina_aura.js";
import { MANA_REGEN_BUFF_ABILITY } from "./mana_regen_buff.js";
import { STAMINA_HEALTH_BUFF_ABILITY, STAMINA_BUFF_EFFECT, HEALTH_DEBUFF_EFFECT } from "./stamina_health_buff.js";

export const ABILITIES = [
  COLLECTING_ABILITY,
  AUTO_COLLECTING_ABILITY,
  FROST_BITE_ABILITY,
  STONE_SKIN_ABILITY,
  HEALING_TOUCH_ABILITY,
  SHADOW_STEP_ABILITY,
  STAMINA_RESTORE_ABILITY,
  STAMINA_AURA_ABILITY,
  MANA_REGEN_BUFF_ABILITY,
  STAMINA_HEALTH_BUFF_ABILITY,
  STAMINA_BUFF_EFFECT,
  HEALTH_DEBUFF_EFFECT
];

export const getAbilityById = (id) => {
  if (typeof id !== "string" || id.length === 0) return null;
  return ABILITIES.find((a) => a.id === id) ?? null;
};

export { MANA_REGEN_BUFF_ABILITY };
