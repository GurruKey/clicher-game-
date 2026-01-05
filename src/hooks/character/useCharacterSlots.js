import {
  CHARACTER_OUTER_LEFT,
  CHARACTER_OUTER_RIGHT,
  CHARACTER_INNER_LEFT,
  CHARACTER_INNER_RIGHT,
  CHARACTER_WEAPON_OUTER,
  CHARACTER_WEAPON_INNER
} from "../../data/characterSlots.js";

export default function useCharacterSlots({ gearLayer }) {
  const isOuterLayer = gearLayer === "outer";
  const leftSlots = isOuterLayer
    ? CHARACTER_OUTER_LEFT
    : CHARACTER_INNER_LEFT;
  const rightSlots = isOuterLayer
    ? CHARACTER_OUTER_RIGHT
    : CHARACTER_INNER_RIGHT;
  const weaponSlots = isOuterLayer
    ? CHARACTER_WEAPON_OUTER
    : CHARACTER_WEAPON_INNER;

  return {
    isOuterLayer,
    leftSlots,
    rightSlots,
    weaponSlots
  };
}
