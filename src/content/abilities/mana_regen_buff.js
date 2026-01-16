import manaRegenBuffIcon from "../../assets/abilities/mana_regen_buff.png";

export const MANA_REGEN_BUFF_ABILITY = {
  id: "mana_regen_buff",
  name: "Mana Regeneration",
  icon: manaRegenBuffIcon,
  kind: "buff",

  manaCost: 10,
  castTimeMs: 2000,
  useDelayMs: 200,
  cooldownMs: 0,

  // Buff behavior
  maxStacks: 3,
  durationMs: 10 * 60 * 1000,
  manaRegenPerStack: 1
};

