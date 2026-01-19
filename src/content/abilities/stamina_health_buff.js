import icon from "../../assets/abilities/stamina_health_buff.png";

export const STAMINA_BUFF_EFFECT = {
  id: "stamina_buff_effect",
  name: "Blood Surge (Stamina)",
  icon,
  kind: "buff",
  resourceBonuses: {
    max_stamina: 50
  },
  durationMs: 10 * 60 * 1000,
  maxStacks: 1
};

export const HEALTH_DEBUFF_EFFECT = {
  id: "health_debuff_effect",
  name: "Blood Surge (Health)",
  icon,
  kind: "debuff",
  resourceBonuses: {
    max_health: -50
  },
  durationMs: 10 * 60 * 1000,
  maxStacks: 1
};

export const STAMINA_HEALTH_BUFF_ABILITY = {
  id: "stamina_health_buff",
  name: "Blood Surge",
  icon,
  kind: "effect_caster",

  manaCost: 10,
  castTimeMs: 0,
  useDelayMs: 200,
  cooldownMs: 0,

  effects: ["stamina_buff_effect", "health_debuff_effect"]
};
