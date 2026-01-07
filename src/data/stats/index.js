import { AGILITY } from "./agility.js";
import { ARMOR } from "./armor.js";
import { INTELLECT } from "./intellect.js";
import { STAMINA } from "./stamina.js";
import { STRENGTH } from "./strength.js";

export const STATS = [
  AGILITY,
  ARMOR,
  INTELLECT,
  STAMINA,
  STRENGTH,
];

export { AGILITY, ARMOR, INTELLECT, STAMINA, STRENGTH };

export function buildStatDetails(statValues = null, fallbackValue = 0) {
  return STATS.map((stat) => {
    const value = statValues?.[stat.id] ?? fallbackValue;
    return { id: stat.id, label: stat.label, value: String(value) };
  });
}

export function getStatValue(statValues, id, fallbackValue = 0) {
  const raw = statValues?.[id];
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallbackValue;
}