import type { EquippedItemsBySlotId, EquippedItem, InventorySlot, InventorySnapshot } from "./inventoryTypes";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeItemId = (id: string): string => {
  if (id === "skills_book") return "hunting_journal";
  return id;
};

const normalizeSlot = (value: unknown): InventorySlot | null => {
  if (!isRecord(value)) return null;
  const id = value.id;
  const count = Number(value.count);
  if (typeof id !== "string" || !id) return null;
  if (!Number.isFinite(count) || count <= 0) return null;
  const instanceId = value.instanceId;
  return {
    id: normalizeItemId(id),
    count,
    instanceId: typeof instanceId === "string" && instanceId ? instanceId : undefined
  };
};

const normalizeSlotsArray = (value: unknown): Array<InventorySlot | null> => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => normalizeSlot(v));
};

const normalizeEquippedItem = (value: unknown): EquippedItem | null => {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" || !id) return null;
  const instanceId = value.instanceId;
  return {
    id: normalizeItemId(id),
    instanceId: typeof instanceId === "string" && instanceId ? instanceId : undefined
  };
};

const normalizeEquippedItems = (value: unknown): EquippedItemsBySlotId => {
  if (!isRecord(value)) return {};
  const next: EquippedItemsBySlotId = {};
  for (const [slotId, raw] of Object.entries(value)) {
    const item = normalizeEquippedItem(raw);
    if (!item) continue;
    next[slotId] = item;
  }
  return next;
};

const normalizeBagSlotsById = (value: unknown): Record<string, Array<InventorySlot | null>> => {
  if (!isRecord(value)) return {};
  const next: Record<string, Array<InventorySlot | null>> = {};
  for (const [bagInstanceId, rawSlots] of Object.entries(value)) {
    if (typeof bagInstanceId !== "string" || !bagInstanceId) continue;
    const slots = normalizeSlotsArray(rawSlots);
    next[bagInstanceId] = slots;
  }
  return next;
};

const normalizeSeenItemIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
};

export function normalizeInventorySnapshot(value: unknown): InventorySnapshot | null {
  if (!isRecord(value)) return null;
  const baseSlots = normalizeSlotsArray(value.baseSlots);
  const bagSlotsById = normalizeBagSlotsById(value.bagSlotsById);
  const equippedBagIdRaw = value.equippedBagId;
  const equippedBagId =
    typeof equippedBagIdRaw === "string" && equippedBagIdRaw ? equippedBagIdRaw : null;
  const equippedItems = normalizeEquippedItems(value.equippedItems);
  const seenItemIds = normalizeSeenItemIds(value.seenItemIds);

  return {
    baseSlots,
    bagSlotsById,
    equippedBagId,
    equippedItems,
    seenItemIds
  };
}
