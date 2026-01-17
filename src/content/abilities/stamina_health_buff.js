import icon from "../../assets/abilities/stamina_health_buff.png";

export const STAMINA_HEALTH_BUFF_ABILITY = {
  id: "stamina_health_buff",
  name: "Blood Surge",
  icon,
  kind: "buff",

  manaCost: 10,
  castTimeMs: 0,
  useDelayMs: 200,
  cooldownMs: 0,

  // Buff behavior
  maxStacks: 1,
  durationMs: 10 * 60 * 1000,
  
  // Custom effects
  statBonuses: {
    stamina: 50
  },
  resourceBonuses: {
    max_health: -50
  }
};
