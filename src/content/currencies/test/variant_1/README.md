# Variant 1 draft: equipment item schema

This is a **draft-only** item definition meant for discussion. It is **not wired** into `src/content/currencies/index.js`.

## Goals for this schema

- Keep the current game working while we iterate on item data shape.
- Make room for future mechanics:
  - item-granted perks
  - stat bonuses (including negative values)
  - rarity (already exists)
  - rank (`F..SSS`, with its own color table later)
  - upgrade/enchant levels (+1/+2/+5...)
  - descriptions/lore text
  - item sets
  - partial activation based on requirements

## File: `equipment_item_draft.js`

### Fields explained

- `id` — stable unique identifier (key for inventory + saves). Should never change once shipped.
- `name` — UI display name.
- `description` — long-form lore/tooltip text.
- `icon` — imported image asset, used by UI `<img src={item.icon} />`.
- `categoryId` — high-level group for sorting/filtering (e.g. `equipment`, `bags`, `potions`).

### `equipment`

- `equipment.slotId` — canonical equip slot id (e.g. `head`, `chest`, `ringLeft`).
- `equipment.tags` — domain-specific tags for filtering/rules (replaces legacy `type`/`types`).

**Mapping to current runtime (today):**

The existing equip logic checks:
1) legacy `item.slot` direct match, then
2) legacy `item.types` / `item.type` against type→slot rules.

New drafts use `equipment.slotId` + `equipment.tags` for clarity. When we wire this schema, we can either:
- generate legacy fields at build-time, or
- migrate the equip logic to read the new shape.

### `activation`

This variant replaces “equip requirements” with a more flexible `activation` model:

- The item can be **equipped even if no activation rules match** (then it is "dead": 0 effects).
- Power is split into **activation groups**, each with its own `when` condition and `grants`.

#### `activation.context`

- `statsSource: "base_no_perks"` — compare stat requirements against base stats only:
  `bloodline + origin + faction` (**NO perks**).
- `perksSource: "effective_all"` — compare perk requirements against effective perks:
  player perks + perks from equipped items/sets/etc.
- `excludeSelfGrantedPerks: true` — avoid self-requirement loops:
  do **not** count perks granted by this same item while checking its own conditions.
- `subjectSource: "avatar"` — assumes the runtime provides subject identity for requirements:
  - `subject.raceId` (e.g. `"human"`, `"orc"`)
  - `subject.raceVariantId` (e.g. `"human_1"`, `"orc_2"`)
  When both exist, **raceVariant rules should override race rules**.

#### Condition DSL (draft)

Conditions are plain objects. A condition is considered "passed" when it evaluates to `true` in the runtime.

Basic building blocks:
- `statsMin`: `{ strength: 5, stamina: 3 }`
- `perksAny`: `["life", "mana"]`
- `perksAll`: `["life", "mana"]`
- `perksCountAtLeast`: `{ perkIds: ["p1","p2","p3"], count: 2 }` (at least N out of the list)
- `raceAny`: `["human", "orc"]`
- `raceNot`: `["orc"]`
- `raceVariantAny`: `["human_1", "orc_2"]`
- `raceVariantNot`: `["orc_0"]`

Combinators:
- `all`: `[cond, cond, ...]` (AND)
- `any`: `[cond, cond, ...]` (OR)

Examples:

1) "Requires base stats AND perk":

- `when: { all: [ { statsMin: { strength: 5, stamina: 3 } }, { perksAny: ["life"] } ] }`

2) "Works for humans OR a specific orc variant":

- `when: { any: [ { raceAny: ["human"] }, { raceVariantAny: ["orc_2"] } ] }`

3) "Allowed only for non-orcs":

- `eligibility: { raceNot: ["orc"] }`

#### `activation.groups`

Each group:
- has an `id`
- has a `when` condition (data-only DSL)
- provides a subset of power in `grants`

If multiple groups match, their `grants` stack.

Supported `when` building blocks are described in "Condition DSL (draft)" above.

#### `activation.bonusByPerk` (optional)

Maps a specific perk to a specific bonus. This supports “each perk unlocks a different bonus”.

Each entry can also be race-aware (draft):
- `eligibility` — condition that must pass for this perk-bonus to be allowed (e.g. `{ raceNot: ["orc"] }`).
- `priority` — used when we have limits and must pick a subset (higher wins).

#### `activation.limits` (optional)

Used to cap how much can activate, per subject (race/variant/etc).

- `limits.maxActiveBonusByPerk`
  - an object keyed by `raceId`, plus optional `default`.
  - example: `{ human: 5, orc: 3, default: 0 }`

Selection algorithm when more bonuses are eligible than allowed (draft, deterministic):

1) Filter `bonusByPerk` entries whose `perkId` is present in the effective perk set.
2) Filter again by `eligibility` (if present).
3) Determine the cap:
   - if `subject.raceVariantId` has an override (future extension), use it;
   - else if `subject.raceId` exists in the map, use it;
   - else use `default` if present; otherwise no cap.
4) If count > cap, pick the highest `priority` first (missing priority = 0).
5) Tie-breaker for equal priority: stable order as defined in the array (source order).

Specificity rule (draft):
- If we later add both race-level and raceVariant-level limits/eligibility, **raceVariant** rules override **race** rules.

### Progression

- `rarity` — existing rarity token (`common|uncommon|rare|epic|legendary`) used for UI coloring.
- `rankId` — new rank dimension (visual/loot-table for now): `F|E|D|C|B|A|S|SS|SSS`.
- `upgrade.level / upgrade.maxLevel` — enchant/upgrade tracking (future).

### Effects

- `stats` — numeric stat bonuses keyed by stat id. Can be negative.
- `grants.perks` — perk ids granted while equipped.
- `grants.abilities` — ability/spell ids granted while equipped (future ability system).
- `set` — set membership data (`setId`, `pieceId`).

## File: `equipment_item_draft_scaling.js`

Second example that demonstrates:
- equip always, dead by default
- gets stronger with more matching perks
- each perk unlocks a different bonus (`bonusByPerk`)
- full set of perks enables a multiplier
- race-aware perk bonuses + per-race caps (e.g. human can reach 5/5, orc is capped at 3)

## Next decisions (later)

1) Centralized rank config (like rarities): `F..SSS` + colors + ordering.
2) Whether activation grants should support more effect types beyond `stats/perks/multipliers`.
