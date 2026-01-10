/**
 * Handles the logic for consuming a potion.
 * @param {Object} itemData - The potion item data.
 * @param {Object} resourceActions - Object containing addResource function.
 * @returns {boolean} - Returns true if the potion was consumed.
 */
export const drinkPotion = (itemData, resourceActions) => {
    if (!itemData || !itemData.effects) return false;

    let consumed = false;
    itemData.effects.forEach(effect => {
        if (effect.type === "restore_resource") {
            if (resourceActions && typeof resourceActions.addResource === 'function') {
                resourceActions.addResource(effect.resourceId, effect.value);
                consumed = true;
            }
        }
    });

    return consumed;
};
