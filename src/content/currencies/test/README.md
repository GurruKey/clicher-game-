# Currency draft: `vodolaz`

This folder is for drafting / discussing currency (item) definitions before wiring them into `src/content/currencies/index.js`.

## `vodolaz_draft.js` field-by-field notes

- `import vodolazIcon ...` — imports the image asset so UI can render it via `<img src={...} />`.
- `export const VODOLAZ_DRAFT = { ... }` — exports a single item definition object (not wired into the runtime registry).
- `id` — stable unique identifier used by inventory/saves/lookup (`CURRENCIES[id]` when wired).
- `categoryId` — high-level category (used for grouping/sorting in the future; currently mostly metadata in `src/`).
- `name` — display name for UI.
- `icon` — image used by inventory/equipment UI.
- `type` — primary item type (kept for compatibility with existing content formats).
- `types` — list of item types; used by equip checks (`canEquipInSlot`) and supports multi-type items.
- `slot` — explicit equip slot override (`canEquipInSlot` checks direct slot match first).
- `maxStack` — maximum stack size in one inventory slot.
- `rarity` — rarity token used by UI coloring (tooltips/toasts).
- `accent` — per-item accent color (metadata; currently not used by UI in `src/`).

