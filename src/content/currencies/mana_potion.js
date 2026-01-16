import balashkaIcon from "../../assets/items/balashka.png";

export const MANA_POTION = {
  id: "mana_potion",
  categoryId: "potions",
  name: "Mana Potion",
  type: "potion",
  maxStack: 10,
  rarity: "uncommon",
  accent: "#2515e6",
  icon: balashkaIcon,
  effects: [
    {
      type: "restore_resource",
      resourceId: "max_mana",
      value: 50
    }
  ]
};
