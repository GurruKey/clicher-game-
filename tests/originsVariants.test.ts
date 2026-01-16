import { describe, expect, it } from "vitest";
import { getOriginByName, getOriginStats, ORIGIN_VARIANTS } from "../src/content/origins_variants/index.js";

describe("origins_variants content", () => {
  it("resolves origin variant by name and level", () => {
    expect(getOriginByName("Peasant", 1)?.id).toBe("peasant_1");
    expect(getOriginByName("peasant", 1)?.id).toBe("peasant_1");
    expect(getOriginByName("Peasant", 999)?.id).toBe("peasant_1");
  });

  it("builds stat details from origin variant stats", () => {
    const details = getOriginStats("Mountain Ridge", 1);
    expect(details).not.toBeNull();
    expect(details?.find((d) => d.id === "strength")?.value).toBe("3");
    expect(details?.find((d) => d.id === "agility")?.value).toBe("3");
    expect(details?.find((d) => d.id === "intellect")?.value).toBe("3");
  });

  it("includes newly added origins", () => {
    const names = ORIGIN_VARIANTS.map((v) => v.name);
    expect(names).toContain("City Urchin");
    expect(names).toContain("Forest Hermit");
    expect(names).toContain("Temple Acolyte");
    expect(names).toContain("Border Nomad");
  });
});
