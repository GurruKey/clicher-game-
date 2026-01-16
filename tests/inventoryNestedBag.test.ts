import { describe, expect, it } from "vitest";
import { hasNestedBagWithItems, type BagsByItemId } from "../src/systems/inventory/hasNestedBagWithItems";

describe("inventory.hasNestedBagWithItems", () => {
  const bagsByItemId: BagsByItemId = {
    bag_small: { capacity: 5 },
    bag_large: { capacity: 10 }
  };

  it("returns false when container has no nested bags with items", () => {
    expect(
      hasNestedBagWithItems({
        containerId: "bag#1",
        snapshot: { bagSlotsById: { "bag#1": [{ id: "stone", count: 1 }] as any } },
        bagsByItemId
      })
    ).toBe(false);
  });

  it("returns true when a nested bag contains items", () => {
    expect(
      hasNestedBagWithItems({
        containerId: "bag#1",
        snapshot: {
          bagSlotsById: {
            "bag#1": [{ id: "bag_small", count: 1, instanceId: "bag#2" }] as any,
            "bag#2": [{ id: "twigs", count: 1 }] as any
          }
        },
        bagsByItemId
      })
    ).toBe(true);
  });

  it("returns true through deep nesting", () => {
    expect(
      hasNestedBagWithItems({
        containerId: "bag#1",
        snapshot: {
          bagSlotsById: {
            "bag#1": [{ id: "bag_large", count: 1, instanceId: "bag#2" }] as any,
            "bag#2": [{ id: "bag_small", count: 1, instanceId: "bag#3" }] as any,
            "bag#3": [{ id: "stone", count: 2 }] as any
          }
        },
        bagsByItemId
      })
    ).toBe(true);
  });
});

