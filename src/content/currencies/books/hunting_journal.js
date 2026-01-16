import hunterJournalIcon from "../../../assets/items/books/hunter_journal.png";

export const HUNTING_JOURNAL = {
  id: "hunting_journal",
  name: "Hunting Journal",
  icon: hunterJournalIcon,
  maxStack: 1,
  rarity: "common",
  deletable: false,
  effects: [
    {
      type: "unlock_skills",
      learnAbilityIds: ["collecting"]
    }
  ]
};
