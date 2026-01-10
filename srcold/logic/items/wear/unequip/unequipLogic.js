import { hasNestedBagWithItems } from "../../../../hooks/inventory/utils/useInventoryDragHelpers.js";

/**
 * Validates if an item can be unequipped to a specific inventory slot.
 * @param {Object} params - Validation parameters.
 * @returns {string|null} - Error message ID or null if valid.
 */
export const validateUnequip = ({
    draggedId,
    dragItemInstanceId,
    targetIndex,
    baseSlotCount,
    bagSlotsByIdRef,
    bags,
    isBase,
    equippedBagId
}) => {
    if (!draggedId) return "no_item";

    // Prevent unequipping item into its own container if it's currently open
    // This handles the "bag in itself" bug when dragging from character slot to current bag slots
    if (!isBase && equippedBagId === dragItemInstanceId) {
        return "bag_inside";
    }

    if (
        isBase &&
        targetIndex < baseSlotCount &&
        hasNestedBagWithItems({
            containerId: dragItemInstanceId,
            bagSlotsByIdRef,
            bags
        })
    ) {
        return "bag_nested";
    }

    // Additional validation can go here

    return null;
};

/**
 * Logic for unequipping an item or swapping it with an inventory item.
 * This is a pure-ish logic helper that could be used to calculate next state.
 */
export const calculateUnequipResult = (params) => {
    // This is more complex because it involves many state setters in the current architecture.
    // For now, we provide validation and slot resolution.
};
