import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store";
import { BASE_INVENTORY_SLOTS } from "../config/inventory";
import type { InventorySnapshot } from "../systems/inventory/inventoryTypes";
import { createBagInstanceId } from "../systems/inventory/bagInstance";
import { placeItemInVisibleSlots } from "../systems/inventory/placeItemInVisibleSlots";
import { applyStackDrop } from "../systems/inventory/stackDrop";
import { performBagEquipSwap } from "../systems/inventory/bagEquipSwap";
import { BAGS } from "../content/bags.js";
import { CURRENCIES } from "../content/currencies/index.js";
import { deleteEquipped, deleteFromInventory } from "../systems/inventory/deleteFromInventory";
import { unequipToInventory } from "../systems/inventory/unequipToInventory";
import { getBagIdFromInstance } from "../systems/inventory/bagInstance";
import { equipFromVisibleIndex as equipFromVisibleIndexSystem } from "../systems/inventory/equipment/equipFromVisibleIndex";
import { dropEquippedOnVisibleSlot as dropEquippedOnVisibleSlotSystem } from "../systems/inventory/equipment/dropEquippedOnVisibleSlot";

type InventoryState = InventorySnapshot;

const initialState: InventoryState = {
  baseSlots: Array(BASE_INVENTORY_SLOTS).fill(null),
  bagSlotsById: {},
  equippedBagId: null,
  equippedItems: {},
  seenItemIds: []
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setInventory(state, action: PayloadAction<InventorySnapshot>) {
      return action.payload;
    },
    placeItemInCurrentContainer: {
      reducer(
        state,
        action: PayloadAction<{
          itemId: string;
          amount: number;
          maxStack: number;
          isBag?: boolean;
          bagCapacity?: number;
          instanceId?: string;
          createdBagInstanceId?: string;
        }>
      ) {
        const { itemId, amount, maxStack, isBag, bagCapacity, instanceId, createdBagInstanceId } =
          action.payload;

        const result = placeItemInVisibleSlots({
          snapshot: state,
          itemId,
          amount,
          maxStack,
          createBagInstance: (bagItemId) => ({
            instanceId:
              createdBagInstanceId ??
              createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
            capacity: bagCapacity ?? 0
          }),
          options: { instanceId, isBag, bagCapacity }
        });

        if (!result.changed) return;
        return result.next;
      },
      prepare(payload: {
        itemId: string;
        amount?: number;
        maxStack: number;
        isBag?: boolean;
        bagCapacity?: number;
        instanceId?: string;
      }) {
        const amount = payload.amount ?? 1;
        const createdBagInstanceId =
          payload.isBag && !payload.instanceId
            ? createBagInstanceId(payload.itemId, Date.now(), nanoid(6))
            : undefined;
        return {
          payload: {
            itemId: payload.itemId,
            amount,
            maxStack: payload.maxStack,
            isBag: payload.isBag,
            bagCapacity: payload.bagCapacity,
            instanceId: payload.instanceId,
            createdBagInstanceId
          }
        };
      }
    },
    dropOnVisibleSlot(
      state,
      action: PayloadAction<{ dragIndex: number; targetIndex: number; baseSlotCount: number }>
    ) {
      const { dragIndex, targetIndex, baseSlotCount } = action.payload;
      if (!Number.isInteger(dragIndex) || !Number.isInteger(targetIndex)) return;

      const equippedBagId = state.equippedBagId;
      const activeBagSlots = equippedBagId ? state.bagSlotsById[equippedBagId] ?? [] : [];
      const visibleSlots = [...state.baseSlots, ...activeBagSlots];

      const sourceSlot = visibleSlots[dragIndex] ?? null;
      if (!sourceSlot) return;

      // Prevent placing a bag into its own currently open container (legacy logic parity).
      if (equippedBagId && targetIndex >= baseSlotCount) {
        const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
        const isBag = Boolean(bagsByItemId[sourceSlot.id]);
        const sameInstance = Boolean(sourceSlot.instanceId && sourceSlot.instanceId === equippedBagId);
        if (isBag && sameInstance) {
          return;
        }
      }
      const targetSlot = visibleSlots[targetIndex] ?? null;

      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const result = applyStackDrop({ sourceSlot, targetSlot, getMaxStack });
      if (!result.changed) return;

      const nextBase = [...state.baseSlots];
      const nextBag = [...activeBagSlots];
      const setAt = (slotIndex: number, value: typeof result.source) => {
        if (slotIndex < baseSlotCount) nextBase[slotIndex] = value;
        else if (equippedBagId) nextBag[slotIndex - baseSlotCount] = value;
      };

      setAt(dragIndex, result.source);
      setAt(targetIndex, result.target);

      state.baseSlots = nextBase;
      if (equippedBagId) {
        state.bagSlotsById = { ...state.bagSlotsById, [equippedBagId]: nextBag };
      }
    },
    equipBagFromVisibleIndex(
      state,
      action: PayloadAction<{ dragIndex: number; baseSlotCount: number }>
    ) {
      const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const swap = performBagEquipSwap({
        snapshot: state,
        dragIndex: action.payload.dragIndex,
        baseSlotCount: action.payload.baseSlotCount,
        bagsByItemId,
        getMaxStack,
        createBagInstance: (bagItemId) => ({
          instanceId: createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
          capacity: bagsByItemId[bagItemId]?.capacity ?? 0
        })
      });

      if (!swap.ok) return;
      return swap.next;
    },
    equipFromVisibleIndex(state, action: PayloadAction<{ dragIndex: number; baseSlotCount: number }>) {
      const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
      const currenciesById = CURRENCIES as unknown as Record<string, { id: string; maxStack?: unknown }>;
      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const result = equipFromVisibleIndexSystem({
        snapshot: state,
        dragIndex: action.payload.dragIndex,
        baseSlotCount: action.payload.baseSlotCount,
        currenciesById,
        bagsByItemId,
        getMaxStack,
        createBagInstance: (bagItemId: string) => ({
          instanceId: createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
          capacity: bagsByItemId[bagItemId]?.capacity ?? 0
        })
      });

      if (!result.ok) return;
      return result.next;
    },
    equipFromVisibleIndexToSlot(
      state,
      action: PayloadAction<{ dragIndex: number; baseSlotCount: number; slotId: string }>
    ) {
      const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
      const currenciesById = CURRENCIES as unknown as Record<string, { id: string; maxStack?: unknown }>;
      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const result = equipFromVisibleIndexSystem({
        snapshot: state,
        dragIndex: action.payload.dragIndex,
        baseSlotCount: action.payload.baseSlotCount,
        slotIdOverride: action.payload.slotId,
        currenciesById,
        bagsByItemId,
        getMaxStack,
        createBagInstance: (bagItemId: string) => ({
          instanceId: createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
          capacity: bagsByItemId[bagItemId]?.capacity ?? 0
        })
      });

      if (!result.ok) return;
      return result.next;
    },
    dropEquippedOnVisibleSlot(
      state,
      action: PayloadAction<{ slotId: string; targetIndex: number; baseSlotCount: number }>
    ) {
      const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
      const currenciesById = CURRENCIES as unknown as Record<string, { id: string; maxStack?: unknown }>;
      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const result = dropEquippedOnVisibleSlotSystem({
        snapshot: state,
        slotId: action.payload.slotId,
        targetIndex: action.payload.targetIndex,
        baseSlotCount: action.payload.baseSlotCount,
        currenciesById,
        bagsByItemId,
        getMaxStack,
        createBagInstance: (bagItemId: string) => ({
          instanceId: createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
          capacity: bagsByItemId[bagItemId]?.capacity ?? 0
        })
      });

      if (!result.ok) return;
      return result.next;
    },
    deleteFromCurrentContainer(state, action: PayloadAction<{ container: "base" | "bag"; slotIndex: number; amount: number }>) {
      const result = deleteFromInventory({
        snapshot: state,
        container: action.payload.container,
        slotIndex: action.payload.slotIndex,
        amount: action.payload.amount
      });
      if (!result.changed) return;
      return result.next;
    },
    deleteEquippedSlot(state, action: PayloadAction<{ slotId: string }>) {
      const result = deleteEquipped({ snapshot: state, slotId: action.payload.slotId });
      if (!result.changed) return;
      return result.next;
    },
    unequipEquippedSlotToInventory(state, action: PayloadAction<{ slotId: string }>) {
      const bagsByItemId = BAGS as unknown as Record<string, { capacity: number }>;
      const getMaxStack = (itemId: string) => {
        const max = (CURRENCIES as Record<string, { maxStack?: unknown }>)[itemId]?.maxStack;
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 1;
      };

      const result = unequipToInventory({
        snapshot: state,
        slotId: action.payload.slotId,
        getMaxStack,
        bagsByItemId,
        createBagInstance: (bagItemId) => ({
          instanceId: createBagInstanceId(bagItemId, Date.now(), nanoid(6)),
          capacity: bagsByItemId[bagItemId]?.capacity ?? 0
        })
      });

      if (!result.ok) return;
      return result.next;
    },
    markItemsSeen(state, action: PayloadAction<string[]>) {
      const next = new Set(state.seenItemIds);
      let changed = false;
      for (const id of action.payload) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      if (changed) {
        state.seenItemIds = Array.from(next);
      }
    },
    debugFillEquippedBag(state) {
      const equippedBagId = state.equippedBagId;
      if (!equippedBagId) return;
      const bagItemId = getBagIdFromInstance(equippedBagId);
      if (!bagItemId) return;
      const capacity = (BAGS as unknown as Record<string, { capacity: number }>)[bagItemId]?.capacity ?? 0;
      if (!state.bagSlotsById[equippedBagId]) {
        state.bagSlotsById = { ...state.bagSlotsById, [equippedBagId]: Array(capacity).fill(null) };
      }
    },
    resetInventory(state) {
      state.baseSlots = initialState.baseSlots;
      state.bagSlotsById = initialState.bagSlotsById;
      state.equippedBagId = initialState.equippedBagId;
      state.equippedItems = initialState.equippedItems;
    }
  }
});

export const {
  dropOnVisibleSlot,
  dropEquippedOnVisibleSlot,
  debugFillEquippedBag,
  deleteEquippedSlot,
  deleteFromCurrentContainer,
  equipFromVisibleIndex,
  equipFromVisibleIndexToSlot,
  equipBagFromVisibleIndex,
  placeItemInCurrentContainer,
  unequipEquippedSlotToInventory,
  markItemsSeen,
  setInventory,
  resetInventory
} = inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;

export const selectInventorySnapshot = (state: RootState) => state.inventory;
