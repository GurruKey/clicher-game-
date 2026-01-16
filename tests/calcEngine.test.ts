import { describe, expect, it } from "vitest";
import { aggregateBaseValues, calculateFinalValues, type CalcNodeDefinition } from "../src/systems/calc/calcEngine";

describe("calcEngine", () => {
  it("aggregates base values from arrays and objects", () => {
    expect(
      aggregateBaseValues([
        [{ id: "str", value: 2 }, { id: "agi", value: "3" }],
        { str: 1, int: 5 },
        null
      ])
    ).toEqual({ str: 3, agi: 3, int: 5 });
  });

  it("calculates values with overrides and modifiers", () => {
    const defs: CalcNodeDefinition[] = [
      { id: "a", base: 10, modifiers: [{ targetStatId: "b", value: 0.1 }] },
      { id: "b", base: 0 }
    ];

    expect(calculateFinalValues(defs)).toEqual({ a: 10, b: 1 });
    expect(calculateFinalValues(defs, { a: 5 })).toEqual({ a: 15, b: 1.5 });
  });
});

