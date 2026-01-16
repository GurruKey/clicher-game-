import { MYSTORY_FOREST_LOOT } from "./loot.js";
import mystoryForestBg from "../../../assets/locations/mystory_forest.png";

export const MYSTORY_FOREST = {
  id: "mystory_forest",
  name: "Mystory Forest",
  bg: mystoryForestBg,
  coords: { x: 0.0, y: 0.0 }, // 0 km
  workDurationMs: 10000,
  requiredResourceId: "max_stamina",
  resourceCost: 20.0,
  lootTable: MYSTORY_FOREST_LOOT
};
