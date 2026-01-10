import { BAG } from "./Bags/bag.js";
import { BAGHEAD } from "./Equipment/baghead.js";
import { HELMET } from "./Equipment/helmet.js";
import { FUNGUS } from "./Fungi/fungus.js";
import { MATERIAL } from "./Materials/material.js";

export const ITEM_TYPES = {
  [BAG.id]: BAG,
  [BAGHEAD.id]: BAGHEAD,
  [HELMET.id]: HELMET,
  [FUNGUS.id]: FUNGUS,
  [MATERIAL.id]: MATERIAL,
};

export { BAG, BAGHEAD, HELMET, FUNGUS, MATERIAL };
