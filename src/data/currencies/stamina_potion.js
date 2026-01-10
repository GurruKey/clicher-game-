import balashkaIcon from "../../assets/items/balashka.png";

export const STAMINA_POTION = {
  id: "stamina_potion",
  categoryId: "potions",
  name: "Зелье выносливости",
  type: "potion",
  maxStack: 10,
  rarity: "uncommon",
  accent: "#e6b025",
  icon: balashkaIcon,
  effects: [
    {
      type: "restore_resource",
      resourceId: "max_stamina",
      value: 50
    }
  ]
};
