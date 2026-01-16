import { ITEM_TYPES } from "../../../content/items/presets/types/index.js";

type ItemTypePreset = { slot?: string };

type ItemData = {
  slot?: string;
  type?: unknown;
  types?: unknown;
};

/**
 * Mirrors `srcold/logic/items/wear/equip/equipLogic.js`.
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

export function resolveTargetSlot(
  itemData: ItemData,
  equippedItems: Record<string, unknown>
): string | null {
  let targetSlotId: string | null = null;

  if (itemData.slot) {
    targetSlotId = itemData.slot;
  } else {
    const types = toTypes(itemData);
    for (const typeId of types) {
      const preset = (ITEM_TYPES as unknown as Record<string, ItemTypePreset>)[typeId];
      if (preset?.slot) {
        targetSlotId = preset.slot;
        break;
      }
      if (TYPE_TO_SLOT[typeId]) {
        targetSlotId = TYPE_TO_SLOT[typeId];
        break;
      }
    }
  }

  if (!targetSlotId) return null;

  if (
    targetSlotId === "ringLeft" &&
    equippedItems["ringLeft"] &&
    !equippedItems["ringRight"]
  ) {
    targetSlotId = "ringRight";
  }
  if (
    targetSlotId === "weaponOuter1" &&
    equippedItems["weaponOuter1"] &&
    !equippedItems["weaponOuter2"]
  ) {
    targetSlotId = "weaponOuter2";
  }
  if (
    targetSlotId === "earringLeft" &&
    equippedItems["earringLeft"] &&
    !equippedItems["earringRight"]
  ) {
    targetSlotId = "earringRight";
  }

  return targetSlotId;
}

