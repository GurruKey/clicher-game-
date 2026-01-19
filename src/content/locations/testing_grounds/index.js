import { TESTING_GROUNDS_LOOT } from "./loot.js";
import testingGroundsBg from "../../../assets/locations/testing_grounds.png";

export const TESTING_GROUNDS = {
  id: "testing_grounds",
  name: "Testing Grounds",
  bg: testingGroundsBg,
  coords: { x: 0.3, y: 0.3 },
  workDurationMs: 5000,
  requiredResourceId: "max_stamina",
  resourceCost: 10.0,
  lootTable: TESTING_GROUNDS_LOOT
};
