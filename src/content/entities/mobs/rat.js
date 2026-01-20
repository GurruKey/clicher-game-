import ratIcon from "../../../assets/mobs/rat.png";
import combatBg from "../../../assets/locations/combat_bg.png";

export const RAT_MOB = {
  id: "rat",
  name: "Rat",
  icon: ratIcon,
  bg: combatBg,
  maxHealth: 20,
  abilities: ["rat_attack"],
  drops: [
    { id: "rat_tail", chance: 100, amount: 1 },
    { id: "rat_ear", chance: 95, amount: 1 }
  ]
};
