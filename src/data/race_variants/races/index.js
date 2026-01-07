import { HUMAN_RACE } from "./human.js";
import { ORC_RACE } from "./orc.js";

export const RACES = [HUMAN_RACE, ORC_RACE];

const RACE_BY_ID = Object.fromEntries(
  RACES.map((race) => [race.id, race])
);

export function getRaceById(id) {
  if (!id) {
    return null;
  }
  return RACE_BY_ID[id] ?? null;
}
