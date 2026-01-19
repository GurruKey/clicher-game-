import { ITEM_TYPES } from "../../../content/items/presets/types/index.js";

type ItemTypePreset = { slot?: string };

type ItemData = {
  slot?: string;
  type?: unknown;
  types?: unknown;
};

/**
 * Mirrors legacy logic (compat check).
 */
const TYPE_TO_SLOT: Record<string, string> = {
  helmet: "head",
  bag: "bag",
  shoulders: "shoulders",
  chest: "chest",
  armor: "chest",
  belt: "belt",
  pants: "pants",
  legs: "pants",
  boots: "boots",
  feet: "boots",
  gloves: "gloves",
  hands: "gloves",
  necklace: "necklace",
  amulet: "amulet",
  ring: "ringLeft",
  ringLeft: "ringLeft",
  ringRight: "ringRight",
  weapon: "weaponOuter1",
  weaponOuter1: "weaponOuter1",
  weaponOuter2: "weaponOuter2",
  cloak: "cloak",
  bracers: "bracers",
  scarf: "scarf",
  collar: "scarf",
  kneepads: "kneepads",
  talisman: "talisman",
  face: "face",
  mask: "face",
  shirt: "shirt",
  underwear: "underwear",
  earring: "earringLeft",
  earringLeft: "earringLeft",
  earringRight: "earringRight",
  undershirt: "undershirt",
  support: "weaponInner1"
};

const toTypes = (itemData: ItemData): string[] => {
  if (Array.isArray(itemData.types)) {
    return itemData.types.filter((t): t is string => typeof t === "string");
  }
  if (Array.isArray(itemData.type)) {
    return itemData.type.filter((t): t is string => typeof t === "string");
  }
  if (typeof itemData.type === "string") {
    return [itemData.type];
  }
  return [];
};

export function canEquipInSlot(itemData: ItemData | null | undefined, slotId: string): boolean {
  if (!itemData) return false;
  if (!slotId) return false;

  // 1) Direct slot match
  if (itemData.slot === slotId) return true;

  const isRingSlot = slotId === "ringLeft" || slotId === "ringRight";
  const isWeaponSlot = slotId === "weaponOuter1" || slotId === "weaponOuter2";
  const isEarringSlot = slotId === "earringLeft" || slotId === "earringRight";

  const types = toTypes(itemData);
  if (types.length === 0) return false;

  return (
    types.some((typeId) => {
      const preset = (ITEM_TYPES as unknown as Record<string, ItemTypePreset>)[typeId];
      if (preset?.slot === slotId) return true;
      if (isRingSlot && preset?.slot === "ringLeft") return true;
      if (isWeaponSlot && preset?.slot === "weaponOuter1") return true;
      if (isEarringSlot && preset?.slot === "earringLeft") return true;

      if (TYPE_TO_SLOT[typeId] === slotId) return true;
      if (isRingSlot && TYPE_TO_SLOT[typeId] === "ringLeft") return true;
      if (isWeaponSlot && TYPE_TO_SLOT[typeId] === "weaponOuter1") return true;
      if (isEarringSlot && TYPE_TO_SLOT[typeId] === "earringLeft") return true;

      return false;
    }) || (slotId === "head" && types.includes("helmet"))
  );
}
