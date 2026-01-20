import icon from "../../../assets/abilities/rat_attack.png";

export const RAT_ATTACK = {
  id: "rat_attack",
  name: "Rat Bite",
  icon: icon,
  kind: "combat_attack",
  isCombat: true,
  cooldownMs: 2000,
  description: "A nasty bite. Deals 2-4 damage.",
  damageMin: 2,
  damageMax: 4
};
