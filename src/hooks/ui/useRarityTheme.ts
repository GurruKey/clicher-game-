import { useEffect } from "react";
import { RARITIES } from "../../content/items/presets/rarities/index.js";

export function useRarityTheme() {
  useEffect(() => {
    const root = document.documentElement;
    for (const rarity of Object.values(RARITIES)) {
      if (!rarity?.id || !rarity?.color) continue;
      root.style.setProperty(`--rarity-${rarity.id}`, String(rarity.color));
    }
  }, []);
}

