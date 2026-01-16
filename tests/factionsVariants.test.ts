import { describe, expect, it } from "vitest";
import { getFactionByName, getFactionStats, FACTION_VARIANTS } from "../src/content/factions_variants/index.js";

describe("factions_variants content", () => {
  it("resolves faction variant by name and level", () => {
    expect(getFactionByName("Neutral", 1)?.id).toBe("neutral_1");
    expect(getFactionByName("neutral", 1)?.id).toBe("neutral_1");
    expect(getFactionByName("Neutral", 999)?.id).toBe("neutral_1");
  });

  it("builds stat details from faction variant stats", () => {
    const details = getFactionStats("Neutral", 1);
    expect(details).not.toBeNull();
    expect(details?.find((d) => d.id === "strength")?.value).toBe("3");
  });

  it("exposes variants list", () => {
    expect(FACTION_VARIANTS.map((v) => v.id)).toContain("neutral_1");
  });
});

