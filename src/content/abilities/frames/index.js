/**
 * Ability frames are UI tokens (border/glow colors) keyed by id.
 * Add a new frame by creating a new `*.js` file in this folder exporting a default object.
 */

const modules = import.meta.glob("./*.js", { eager: true });

const defs = Object.entries(modules)
  .map(([path, mod]) => {
    if (path.endsWith("/index.js")) return null;
    const value = mod && (mod.default ?? mod);
    if (!value || typeof value !== "object") return null;
    if (typeof value.id !== "string" || value.id.length === 0) return null;
    return value;
  })
  .filter(Boolean);

export const ABILITY_FRAMES = defs;
export const ABILITY_FRAMES_BY_ID = Object.fromEntries(defs.map((d) => [d.id, d]));

export function getAbilityFrameById(id) {
  if (typeof id !== "string" || id.length === 0) return null;
  return ABILITY_FRAMES_BY_ID[id] ?? null;
}
