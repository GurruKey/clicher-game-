import cheatBookIcon from "../../../assets/items/special/cheat_book.png";

export const CHEAT_BOOK = {
  id: "cheat_book",
  name: "Cheat Book",
  icon: cheatBookIcon,
  maxStack: 1,
  rarity: "common",
  deletable: false,
  effects: [
    {
      type: "unlock_skills",
      learnAllAbilities: true
    }
  ]
};
