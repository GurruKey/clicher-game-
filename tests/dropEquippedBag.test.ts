import { describe, expect, it } from "vitest";
import { dropEquippedOnVisibleSlot } from "../src/systems/inventory/equipment/dropEquippedOnVisibleSlot";

describe("inventory.dropEquippedOnVisibleSlot (bag)", () => {
  it("unequips bag when dropped onto open-bag slots by placing into base slot", () => {
    const snapshot: any = {
      baseSlots: [null, null, null, null, null, null, null],
      bagSlotsById: {
        "peasant_bag:1_x": Array(3).fill(null)
      },
      equippedBagId: "peasant_bag:1_x",
      equippedItems: {}
    };

    const result = dropEquippedOnVisibleSlot({
      snapshot,
      slotId: "bag",
      // target inside bag container area (index >= baseSlotCount)
      targetIndex: 8,
      baseSlotCount: 7,
      currenciesById: { peasant_bag: { id: "peasant_bag", types: ["bag"] } },
      bagsByItemId: { peasant_bag: { capacity: 3 } },
      getMaxStack: () => 1,
      createBagInstance: () => ({ instanceId: "peasant_bag:NEW", capacity: 3 })
    });

    expect(result.ok).toBe(true);
    expect(result.next.equippedBagId).toBe(null);
    expect(result.next.baseSlots[0]).toEqual({ id: "peasant_bag", count: 1, instanceId: "peasant_bag:1_x" });
    expect(result.next.bagSlotsById["peasant_bag:1_x"]).toEqual(Array(3).fill(null));
  });
});

