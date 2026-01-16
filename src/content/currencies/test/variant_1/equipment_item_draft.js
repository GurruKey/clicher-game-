import exampleIcon from "../../../../assets/items/New/01.png";

export const EQUIPMENT_ITEM_DRAFT_V1 = {
  // Identity
  id: "ancient_vodolaz_helm",
  name: "Ancient Vodolaz Helm",
  description:
    "A heavy diving helm, sealed with forgotten runes. It smells of salt and old magic — as if it has waited beneath the sea for a thousand years.",

  // Presentation
  icon: exampleIcon,

  // Classification (for future sorting/filtering in UI)
  categoryId: "equipment",

  // Equipment-specific properties
  equipment: {
    slotId: "head",

    // Tags/keywords for rules and UI filtering.
    // Prefer this over `type`/`types` in new drafts (see README).
    tags: ["helmet"]
  },

  // Activation rules (future; not wired into systems yet)
  // The item can be equipped even if no activation rules match (then it is "dead": 0 active effects).
  activation: {
    context: {
      // Stat requirements are evaluated against "base stats" only:
      // bloodline + origin + faction (NO perks).
      statsSource: "base_no_perks",

      // Perk requirements are evaluated against "effective perks":
      // player perks + perks granted by equipped items/sets/etc.
      perksSource: "effective_all",

      // Avoid self-requirement loops: do NOT count perks granted by this same item
      // when evaluating requirements for this item.
      excludeSelfGrantedPerks: true
    },

    // Each group can unlock a subset of the item power.
    // If no groups match, the item provides no effects ("dead").
    groups: [
      {
        id: "stats_gate",
        when: { statsMin: { strength: 5, stamina: 3 } },
        grants: { stats: { armor: 3, stamina: 2 } }
      },
      {
        id: "perk_gate",
        when: { perksAny: ["life"] },
        grants: { perks: ["life"] }
      },
      {
        id: "synergy",
        when: {
          all: [
            { statsMin: { strength: 5, stamina: 3 } },
            { perksAny: ["life"] }
          ]
        },
        // Example: double stat effects when both gates are satisfied.
        grants: { multipliers: { stats: 2 } }
      }
    ]
  },

  // Progression / rarity-like dimensions
  rarity: "epic",
  // Rank is a visual/loot-table dimension (for now).
  // Suggested ordering: F < E < D < C < B < A < S < SS < SSS
  rankId: "A",

  // Upgrade state (kept as data for future; not wired into systems yet)
  upgrade: {
    level: 0,
    maxLevel: 10
  },

  // Stat bonuses (future; not wired into systems yet)
  // Intentionally uses stat ids as keys for easy merging with calc engine later.
  // Can be negative (rank F-ish cursed items, etc.).
  stats: {
    strength: 1,
    stamina: 2,
    armor: 3,
    agility: -1,
    intellect: 0
  },

  // Perks granted by item (future; not wired into systems yet)
  // These should refer to perk ids from `src/content/perks/*`.
  grants: {
    perks: ["life"],

    // Abilities/spells granted by the item (future; not wired into systems yet).
    // These should refer to ability ids from a future `src/content/abilities/*` registry.
    abilities: ["abyssal_breath"]
  },

  // Set membership (future; not wired into systems yet)
  set: {
    setId: "vodolaz_set",
    pieceId: "helm"
  },

  // Inventory rules
  maxStack: 1,

  // Per-item accent color (metadata; not used by UI in current src/)
  accent: "#FFFFFF"
};
