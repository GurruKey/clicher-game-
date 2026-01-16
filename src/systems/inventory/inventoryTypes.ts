export type InventorySlot = {
  id: string;
  count: number;
  instanceId?: string;
};

export type EquippedItem = {
  id: string;
  instanceId?: string;
};

export type EquippedItemsBySlotId = Record<string, EquippedItem>;

export type InventorySnapshot = {
  baseSlots: Array<InventorySlot | null>;
  bagSlotsById: Record<string, Array<InventorySlot | null>>;
  equippedBagId: string | null;
  equippedItems: EquippedItemsBySlotId;
  seenItemIds: string[];
};
