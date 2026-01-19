import { MYSTORY_FOREST } from "./mystory_forest/index.js";
import { HUNTER_MEADOWS } from "./hunter_meadows/index.js";
import { TESTING_GROUNDS } from "./testing_grounds/index.js";

/**
 * Реестр всех локаций игры.
 * Чтобы добавить новую локацию:
 * 1. Создайте папку в src/content/locations/
 * 2. Импортируйте объект локации здесь
 * 3. Добавьте его в массив ALL_LOCATIONS
 */
const ALL_LOCATIONS = [
  MYSTORY_FOREST,
  HUNTER_MEADOWS,
  TESTING_GROUNDS,
];

export const LOCATIONS = ALL_LOCATIONS.reduce((acc, loc) => {
  acc[loc.id] = loc;
  return acc;
}, {});

export const DEFAULT_LOCATION_ID = MYSTORY_FOREST.id;
