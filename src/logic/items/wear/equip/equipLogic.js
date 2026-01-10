import { ITEM_TYPES } from "../../../../data/items/presets/types/index.js";

/**
 * Centralized mapping of item types to character slots.
 */
const TYPE_TO_SLOT = {
    "helmet": "head",
    "bag": "bag",
    "shoulders": "shoulders",
    "chest": "chest",
    "armor": "chest",
    "belt": "belt",
    "pants": "pants",
    "legs": "pants",
    "boots": "boots",
    "feet": "boots",
    "gloves": "gloves",
    "hands": "gloves",
    "necklace": "necklace",
    "amulet": "amulet",
    "ring": "ringLeft",
    "ringLeft": "ringLeft",
    "ringRight": "ringRight",
    "weapon": "weaponOuter1",
    "weaponOuter1": "weaponOuter1",
    "weaponOuter2": "weaponOuter2",
    "cloak": "cloak",
    "bracers": "bracers",
    "scarf": "scarf",
    "collar": "scarf",
    "kneepads": "kneepads",
    "talisman": "talisman",
    "face": "face",
    "mask": "face",
    "shirt": "shirt",
    "underwear": "underwear",
    "earring": "earringLeft",
    "earringLeft": "earringLeft",
    "earringRight": "earringRight",
    "undershirt": "undershirt",
    "support": "weaponInner1"
};

/**
 * Resolves the target equipment slot for a given item.
 * @param {Object} itemData - Item definition data.
 * @param {Object} equippedItems - Currently equipped items.
 * @returns {string|null} - The target slot ID or null if not equippable.
 */
export const resolveTargetSlot = (itemData, equippedItems) => {
    let targetSlotId = null;

    if (itemData.slot) {
        targetSlotId = itemData.slot;
    } else {
        const types = itemData.types || (Array.isArray(itemData.type) ? itemData.type : [itemData.type]);
        if (types) {
            for (const typeId of types) {
                const preset = ITEM_TYPES[typeId];
                if (preset && preset.slot) {
                    targetSlotId = preset.slot;
                    break;
                }
                if (TYPE_TO_SLOT[typeId]) {
                    targetSlotId = TYPE_TO_SLOT[typeId];
                    break;
                }
            }
        }
    }

    if (!targetSlotId) return null;

    // Handle multiple slots for rings, weapons and earrings
    if (targetSlotId === "ringLeft" && equippedItems["ringLeft"] && !equippedItems["ringRight"]) {
        targetSlotId = "ringRight";
    }
    if (targetSlotId === "weaponOuter1" && equippedItems["weaponOuter1"] && !equippedItems["weaponOuter2"]) {
        targetSlotId = "weaponOuter2";
    }
    if (targetSlotId === "earringLeft" && equippedItems["earringLeft"] && !equippedItems["earringRight"]) {
        targetSlotId = "earringRight";
    }

    return targetSlotId;
};

/**
 * Validates if an item can be equipped in a specific slot.
 * @param {Object} itemData - Item definition data.
 * @param {string} slotId - Target slot ID.
 * @param {Object} currencies - Optional currency definitions for deep check.
 * @returns {boolean}
 */
export const canEquipInSlot = (itemData, slotId, currencies = {}) => {
    if (!itemData) return false;
    
    // 1. Direct slot match
    if (itemData.slot === slotId) return true;

    // Special handling for multi-instance slots
    const isRingSlot = slotId === "ringLeft" || slotId === "ringRight";
    const isWeaponSlot = slotId === "weaponOuter1" || slotId === "weaponOuter2";
    const isEarringSlot = slotId === "earringLeft" || slotId === "earringRight";

    const types = itemData.types || (Array.isArray(itemData.type) ? itemData.type : [itemData.type]);
    if (!types) return false;

    return types.some(typeId => {
        // Preset check
        const typeDef = ITEM_TYPES[typeId];
        if (typeDef && typeDef.slot === slotId) return true;
        if (isRingSlot && typeDef && typeDef.slot === "ringLeft") return true;
        if (isWeaponSlot && typeDef && typeDef.slot === "weaponOuter1") return true;
        if (isEarringSlot && typeDef && typeDef.slot === "earringLeft") return true;

        // Map check
        if (TYPE_TO_SLOT[typeId] === slotId) return true;
        if (isRingSlot && TYPE_TO_SLOT[typeId] === "ringLeft") return true;
        if (isWeaponSlot && TYPE_TO_SLOT[typeId] === "weaponOuter1") return true;
        if (isEarringSlot && TYPE_TO_SLOT[typeId] === "earringLeft") return true;

        return false;
    }) || (slotId === "head" && types.includes("helmet")); // Fallback
};
