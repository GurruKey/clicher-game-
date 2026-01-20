import icon from "../../../assets/abilities/basic_attack.png";

export const BASIC_ATTACK = {
  id: "basic_attack",
  name: "Attack",
  icon: icon,
  kind: "combat_attack",
  isCombat: true,
  cooldownMs: 2000,
  description: "A basic attack. Deals 2-4 damage.",
  damageMin: 2,
  damageMax: 4
};
