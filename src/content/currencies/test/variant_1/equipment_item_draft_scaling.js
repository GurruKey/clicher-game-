import exampleIcon from "../../../../assets/items/New/01.png";

export const EQUIPMENT_ITEM_DRAFT_V1_SCALING = {
  id: "sigil_ring_of_trials",
  name: "Sigil Ring of Trials",
  description:
    "A plain ring engraved with five empty slots. Each oath you carry fills one slot — and the metal grows warmer.",

  icon: exampleIcon,
  categoryId: "equipment",

  equipment: {
    slotId: "ringLeft",
    tags: ["ring"]
  },

  rarity: "rare",
  rankId: "C",

  maxStack: 1,
  accent: "#FFFFFF",

  activation: {
    context: {
      statsSource: "base_no_perks",
      perksSource: "effective_all",
      excludeSelfGrantedPerks: true,

      // For race-dependent behavior we assume the runtime context can provide:
      // - subject.raceId (e.g. "human", "orc")
      // - subject.raceVariantId (e.g. "human_1", "orc_2")
      // When both exist, raceVariant rules should override race rules.
      subjectSource: "avatar"
    },

    // Limit how many perk-bonuses can be active at once, per race.
    // If more perks are eligible than allowed, select by `priority` (higher wins).
    limits: {
      maxActiveBonusByPerk: {
        // Example: humans can reach full power, orcs are capped lower.
        human: 5,
        orc: 3,
        default: 0
      }
    },

    // Perk-driven growth:
    // - Item can be equipped always, but only becomes stronger with more matching perks.
    // - Each perk can unlock its own bonus.
    bonusByPerk: [
      // Allowed for orc/human
      { perkId: "oath_1", priority: 10, grants: { stats: { strength: 1 } }, eligibility: { raceAny: ["orc", "human"] } },
      // Not allowed for orc
      { perkId: "oath_2", priority: 1, grants: { stats: { stamina: 1 } }, eligibility: { raceNot: ["orc"] } },
      // Allowed for orc/human
      { perkId: "oath_3", priority: 9, grants: { stats: { agility: 1 } }, eligibility: { raceAny: ["orc", "human"] } },
      // Allowed for orc/human
      { perkId: "oath_4", priority: 8, grants: { stats: { intellect: 1 } }, eligibility: { raceAny: ["orc", "human"] } },
      // Not allowed for orc
      { perkId: "oath_5", priority: 2, grants: { perks: ["life"], abilities: ["trial_oath"] }, eligibility: { raceNot: ["orc"] } }
    ],

    groups: [
      {
        id: "tier_1",
        when: { perksCountAtLeast: { perkIds: ["oath_1", "oath_2", "oath_3", "oath_4", "oath_5"], count: 1 } },
        grants: { stats: { armor: 1 } }
      },
      {
        id: "tier_3",
        when: { perksCountAtLeast: { perkIds: ["oath_1", "oath_2", "oath_3", "oath_4", "oath_5"], count: 3 } },
        grants: { stats: { armor: 2 } }
      },
      {
        id: "tier_5",
        when: { perksCountAtLeast: { perkIds: ["oath_1", "oath_2", "oath_3", "oath_4", "oath_5"], count: 5 } },
        grants: { multipliers: { stats: 2 } }
      }
    ]
  }
};
