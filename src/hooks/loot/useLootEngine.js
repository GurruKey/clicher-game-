import { useRef } from "react";
import useClickWork from "../work/useClickWork.js";
import { pickLootByChance, sumLootChance } from "../../utils/loot.js";

export default function useLootEngine({
  location,
  consumeStamina,
  staminaCost,
  durationMs,
  onLoot
}) {
  const lootWarningRef = useRef(new Set());
  const { isWorking, progress, remainingSeconds, startWork } = useClickWork({
    durationMs,
    onComplete: () => {
      const lootTable = location?.lootTable ?? [];
      if (lootTable.length === 0) {
        return;
      }
      const totalChance = sumLootChance(lootTable);
      if (totalChance <= 0) {
        return;
      }

      if (
        location?.id &&
        totalChance !== 100 &&
        !lootWarningRef.current.has(location.id)
      ) {
        lootWarningRef.current.add(location.id);
        console.warn(
          `Loot chances for ${location.id} sum to ${totalChance}. ` +
            "To keep exact percentages, make it 100."
        );
      }

      const lootId = pickLootByChance(lootTable);
      if (!lootId) {
        return;
      }

      if (onLoot) {
        onLoot(lootId);
      }
    }
  });

  const handleClick = () => {
    if (isWorking) {
      return;
    }

    if (!consumeStamina(staminaCost)) {
      return;
    }

    startWork();
  };

  return {
    isWorking,
    progress,
    remainingSeconds,
    handleClick
  };
}
