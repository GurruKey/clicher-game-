# Project Guide (Quick Navigation)

**Structure in one sentence:** `src/` is split into **data (`content/`)**, **pure game rules (`systems/`)**, **serializable app state (`state/` via Redux Toolkit)**, **UI (`ui/`)**, and **persistence (`persistence/`)**, with **styles (`styles/`)** layered on top.

## Where to look (fast)

- **Gameplay rules / calculations (pure, testable):** `src/systems/`
- **Redux state (single source of truth):** `src/state/`
- **UI components / layout:** `src/ui/`
- **Static game definitions (content tables):** `src/content/`
- **Saving/loading (versioned, legacy-safe):** `src/persistence/`
- **Global store wiring + subscriptions:** `src/app/store.ts`
- **CSS:** `src/styles/`
- **Unit tests (Vitest):** `tests/`

## `src/` folder map

### `src/app/`
Redux store + typed hooks.

- `src/app/store.ts` — creates the RTK store, hydrates from persistence, persists on changes, runs resource regen timers, installs global hotkeys.
- `src/app/hooks.ts` — typed `useAppDispatch` / `useAppSelector`.

### `src/content/`
Static data tables (no business logic). If you want to change definitions (labels, base values, unlock lists), it belongs here.

- `src/content/avatars/` — playable avatars (icon/bg + metadata).
- `src/content/abilities/` — abilities definitions (id/name/icon/timers/flags); `index.js` is the registry.
- `src/content/keybinds.js` — keybind defaults + formatting/normalization helpers.
- `src/content/stats/` — stat definitions + `display_config.js` (categories for UI).
- `src/content/resources/` — resource definitions (e.g. `max_stamina` base).
- `src/content/currencies/` — currency definitions.
- `src/content/factions_variants/`, `src/content/origins_variants/`, `src/content/race_variants/` — character creation options.
- `src/content/starter_packs.js` — initial equipment sets.
- `src/content/characterSlots.js` — equipment slot definitions.
- `src/content/items/`, `src/content/locations/`, `src/content/perks/`, etc — more content tables.

### `src/systems/`
Pure functions (no Redux, no React) that implement rules. Prefer adding tests when changing these.

- `src/systems/calc/` — calculation engine used by stats/resources (mirrors legacy logic).
- `src/systems/inventory/` — inventory + equipment operations (swap, equip, unequip, nested bag checks, normalization).
- `src/systems/loot/` — loot/drop logic and helpers.
- `src/systems/resources/` — resource enablement and max calculations.
- `src/systems/player/` — avatar meta helpers (default perks, sources).
- `src/systems/items/` — item effects helpers.
- `src/systems/abilities/` — pure logic for auras and buffs.

### `src/state/`
Redux Toolkit slices + selectors/thunks that coordinate systems.

- `src/state/playerSlice.ts` - profile identity (`profileId` + `profileIds`) and selected base avatar (`avatarId`); also `perkIds`, skills progression (`skillsUnlocked`, `knownAbilityIds`) and skill bars.
- `src/state/resourcesSlice.ts` — current resources + reconcile/regen tick coordination.
- `src/state/inventorySlice.ts` — inventory snapshot state.
- `src/state/lootSlice.ts` — per-location drop counters.
- `src/state/lootNoticesSlice.ts` — queue of loot notifications (toasts).
- `src/state/workSlice.ts` — current "work" progress (cast/progress bar) used by abilities like Collecting.
- `src/state/settingsSlice.ts` — keybinds and other settings.
- `src/state/uiSlice.ts` — which dialogs/panels are open.
- `src/state/*Selectors.ts` — derived view models for UI (e.g. `resourcesSelectors.ts`).
- `src/state/*Thunks.ts` — cross-slice actions (e.g. `selectAvatarProfile` in `src/state/gameThunks.ts`).
- `src/state/abilitiesThunks.ts` — executes abilities (costs, delays/cooldowns, cast time, auto-repeat wiring).

### `src/persistence/`
LocalStorage I/O only (no UI, minimal validation).

- `src/persistence/storageKeys.ts` — keys used in localStorage.
- `src/persistence/gameSave.ts` - versioned save envelope + per-profile save keys (`click-game-save:<profileId>`). No implicit legacy copy: if a key does not exist, a new profile starts fresh.
- `src/persistence/avatar.ts` - last selected profile id (`click-avatar-id`).
- `src/persistence/avatars.ts` - profile list (`click-avatars`).
- `src/persistence/keybinds.ts` — keybinds storage.

### `src/ui/`
React components. Should be “dumb”: render state, dispatch actions. Avoid putting game rules here.

- `src/ui/GameScreen.tsx` — main in-game screen entrypoint (wires state + handlers, delegates layout to `src/ui/game/*`).
- `src/ui/game/` — GameScreen composition pieces + local UI hooks (bottom bar, overlays, drag/drop, hotkeys).
- `src/ui/EntryScreen.tsx` - entry flow (profile selection + new profile creation via `+`; a profile is a unique `profileId` that references a base avatar type).
- `src/ui/InventoryPanel.tsx` / `src/ui/CharacterPanel.tsx` — inventory + equipment UI (DnD + context menus).
- `src/ui/SkillsBar.tsx` — abilities action bar.
- Dialogs: `src/ui/StatsDialog.tsx`, `src/ui/PerksDialog.tsx`, `src/ui/BloodlineDialog.tsx`, `src/ui/FameDialog.tsx`, `src/ui/ReputationDialog.tsx`, etc.
- Overlays: `src/ui/Tooltip.tsx`, `src/ui/ContextMenu.tsx`, `src/ui/LootToasts.tsx`.

### `src/hooks/`
React hooks for UI infrastructure (not domain state).

- `src/hooks/menus/useContextMenu.ts` — context menu behavior.
- `src/hooks/ui/useTooltip.ts` — tooltip positioning/behavior.
- `src/hooks/ui/useRarityTheme.ts` — CSS theme wiring.
- `src/hooks/map/*` — map pan/zoom + map context menu.
- `src/hooks/work/useClickWork.ts` — click/work timer hook used by the click area.

### `src/styles/`
CSS split by feature area.

- `src/styles/core.css` — base layout, entry screen, click area, etc.
- `src/styles/dialogs.css` — dialog layouts (stats/perks/bloodline/map/location/settings).
- `src/styles/inventory.css` — inventory/character panel visuals.
- `src/styles/resources.css` — resource HUD bars.
- `src/styles/overlays.css` — tooltip/toasts/context menu.
- `src/styles/avatar.css` — avatar circle styling.
- `src/styles/index.css` — style entrypoint.

## Asset conventions

- `src/assets/ui/` — UI buttons/icons (bag/map/settings/abilities).
- `src/assets/items/` — item icons (e.g. `hunter_journal.png`).
- `src/assets/abilities/` — ability icons.
- `src/assets/abilities/helpers/` — small overlays for ability UI (e.g. auto-repeat mark).

## Common change recipes

- **Change how a stat/resource is calculated:** edit `src/systems/calc/*` or `src/systems/resources/*`, then adjust selectors in `src/state/*`, add/update tests in `tests/`.
- **Change a base value / label / color:** edit the relevant file in `src/content/*`.
- **Add a new location:** create folder in `src/content/locations/`, define loot and meta, then register in `src/content/locations/index.js` as described in `locations/README.md`.
- **Change UI layout/styling:** edit `src/ui/*` and the matching CSS in `src/styles/*`.
- **Change saving behavior:** edit `src/persistence/*` and how it is used in `src/app/store.ts`.
- **Add a new domain feature:** implement pure rules in `src/systems/`, wire via `src/state/`, then render in `src/ui/`.

## Notes / guardrails

- Domain state lives in Redux Toolkit only; keep store serializable (no classes/functions/Date).
- Inventory item data may include `deletable: false` to hide the Delete action in UI context menus.
- Legacy-safe loading: `src/systems/inventory/normalizeInventory.ts` may remap old item ids (e.g. `skills_book` -> `hunting_journal`).
- Profiles: multiple characters can share the same base avatar. `profileId` is unique (format: `<baseAvatarId>:<timestamp>_<suffix>`). Use `src/systems/player/profileId.ts` to create/parse it. Saves are keyed by `profileId`, while avatar meta/perks use the base avatar id (`avatarId`).
- `constructor/` is out of scope to modify.
- `src/vite-env.d.ts` is ambient typing for Vite/TypeScript (it's not imported by code).
