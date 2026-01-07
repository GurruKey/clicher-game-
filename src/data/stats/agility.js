import { AGILITY_MODIFIERS } from "./logic/agility.js";

export const AGILITY = {
  id: "agility",
  label: "Agility",
  effects: [
    "Adds to Stamina (+1 per Agility).",
    "Stamina unlock required."
  ],
  modifiers: AGILITY_MODIFIERS
};
