import { RACE_LEVEL_1 } from "./level_1.js";

export const RACE_LEVELS = [RACE_LEVEL_1];

const LEVEL_BY_ID = Object.fromEntries(
  RACE_LEVELS.map((level) => [level.id, level])
);

const LEVEL_BY_NUMBER = Object.fromEntries(
  RACE_LEVELS.map((level) => [level.level, level])
);

export function getRaceLevelById(id) {
  if (!id) {
    return null;
  }
  return LEVEL_BY_ID[id] ?? null;
}

export function getRaceLevelByNumber(levelNumber) {
  if (levelNumber === null || levelNumber === undefined) {
    return null;
  }
  return LEVEL_BY_NUMBER[levelNumber] ?? null;
}
