import { STAMINA_MODIFIERS } from "./logic/stamina.js";

export const STAMINA = {
  id: "stamina",
  label: "Stamina",
  effects: [
    "Adds to Stamina max (+1 per Stamina).",
    "Stamina unlock required."
  ],
  modifiers: STAMINA_MODIFIERS
};
