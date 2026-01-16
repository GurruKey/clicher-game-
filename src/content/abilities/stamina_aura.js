import staminaAuraIcon from "../../assets/abilities/stamina_aura.png";

export const STAMINA_AURA_ABILITY = {
  id: "stamina_aura",
  name: "Stamina Aura",
  icon: staminaAuraIcon,
  kind: "aura",
  toggle: true,

  // Activation costs (turning ON only)
  manaCost: 10,
  castTimeMs: 500,
  useDelayMs: 400,
  cooldownMs: 0,

  // While enabled (per second)
  manaDrainPerSecond: 2,

  // Effects while enabled
  staminaCostMultiplier: 0.5,
  workDurationMultiplier: 0.9
};

