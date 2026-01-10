import { CURRENCIES } from "./currencies/index.js";
import { ITEM_TYPES } from "./items/presets/types/index.js";

export const BAGS = Object.fromEntries(
  Object.values(CURRENCIES)
    .filter(item => {
      const types = item.types || (Array.isArray(item.type) ? item.type : [item.type]);
      return types.some(t => t === "bag" || ITEM_TYPES[t]?.is_bag);
    })
    .map(item => [
      item.id,
      {
        id: item.id,
        itemId: item.id,
        capacity: item.capacity || 0,
        name: item.name,
        icon: item.icon
      }
    ])
);

