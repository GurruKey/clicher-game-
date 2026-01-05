import { CURRENCIES } from "./currencies/index.js";

const BAG_DEFINITIONS = {
  peasant_bag: {
    id: "peasant_bag",
    itemId: "peasant_bag",
    capacity: 5
  }
};

const buildBagEntry = (definition) => {
  const item = CURRENCIES[definition.itemId];
  return {
    ...definition,
    name: item?.name ?? definition.id,
    icon: item?.icon
  };
};

export const BAGS = Object.fromEntries(
  Object.values(BAG_DEFINITIONS).map((definition) => [
    definition.id,
    buildBagEntry(definition)
  ])
);

export const DEFAULT_BAG_ID = "peasant_bag";
