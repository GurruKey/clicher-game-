import { RACE_0_RACE } from "./0.js";
import { RACE_1_RACE } from "./1.js";
import { RACE_2_RACE } from "./2.js";
import { RACE_3_RACE } from "./3.js";
import { RACE_4_RACE } from "./4.js";
import { RACE_5_RACE } from "./5.js";
import { RACE_67_RACE } from "./67.js";
import { RACE_7_RACE } from "./7.js";
import { RACE_8_RACE } from "./8.js";
import { RACE_9_RACE } from "./9.js";
import { HUMAN_RACE } from "./human.js";
import { ORC_RACE } from "./orc.js";

export const RACES = [RACE_0_RACE, RACE_1_RACE, RACE_2_RACE, RACE_3_RACE, RACE_4_RACE, RACE_5_RACE, RACE_67_RACE, RACE_7_RACE, RACE_8_RACE, RACE_9_RACE, HUMAN_RACE, ORC_RACE];

const RACE_BY_ID = Object.fromEntries(
  RACES.map((race) => [race.id, race])
);

export function getRaceById(id) {
  if (!id) {
    return null;
  }
  return RACE_BY_ID[id] ?? null;
}
