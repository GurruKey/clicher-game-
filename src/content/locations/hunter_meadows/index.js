import { HUNTER_MEADOWS_LOOT } from "./loot.js";
import hunterMeadowsBg from "../../../assets/locations/hunter_meadows.png";

export const HUNTER_MEADOWS = {
  id: "hunter_meadows",
  name: "Hunter Meadows",
  bg: hunterMeadowsBg,
  coords: { x: 0.0, y: 0.3 }, // 0.3 km = 300 m from 0,0
  workDurationMs: 8000,
  requiredResourceId: "max_stamina",
  resourceCost: 15.0,
  lootTable: HUNTER_MEADOWS_LOOT
};
