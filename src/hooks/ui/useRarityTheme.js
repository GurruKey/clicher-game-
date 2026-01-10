import { useEffect } from "react";
import { RARITIES } from "../../data/items/presets/rarities/index.js";

export default function useRarityTheme() {
  useEffect(() => {
    const root = document.documentElement;
    Object.values(RARITIES).forEach((rarity) => {
      if (rarity?.id && rarity?.color) {
        root.style.setProperty(`--rarity-${rarity.id}`, rarity.color);
      }
    });
  }, []);
}
