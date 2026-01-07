import { useState, useEffect, useMemo } from "react";
import { PERKS } from "../../data/perks/index.js";

/**
 * Manages current resource values (stamina, mana, etc.)
 * 
 * @param {Array} resourceDefinitions - Array of resource definitions
 * @param {Array} playerPerkIds - List of perk IDs the player has
 * @param {Object} initialStates - Saved current values { resourceId: value }
 * @param {Object} calculatedMaxValues - Dynamic max values from stat engine { resourceId: value }
 */
export default function useResources(
  resourceDefinitions, 
  playerPerkIds = [], 
  initialStates = {},
  calculatedMaxValues = {}
) {
  const safeInitialStates = initialStates || {};
  
  // Filter definitions based on what is unlocked by current perks
  const activeDefs = useMemo(() => {
    // 1. Get all resources unlocked by player perks
    const unlockedResourceIds = new Set();
    
    playerPerkIds.forEach(perkId => {
        const perk = PERKS.find(p => p.id === perkId);
        if (perk && perk.unlockResources) {
            perk.unlockResources.forEach(resId => unlockedResourceIds.add(resId));
        }
    });

    // 2. Filter resources: only those in the set are active
    return resourceDefinitions.filter(def => unlockedResourceIds.has(def.id));
  }, [resourceDefinitions, playerPerkIds]);

  const getMaxValue = (id) => {
    if (calculatedMaxValues && calculatedMaxValues[id] !== undefined) {
      return calculatedMaxValues[id];
    }
    const def = resourceDefinitions.find(d => d.id === id);
    return def?.base || 0;
  };

  const [resources, setResources] = useState(() => {
    const state = {};
    activeDefs.forEach((def) => {
      const id = def.id;
      const max = getMaxValue(id);
      const initial = safeInitialStates[id] !== undefined ? safeInitialStates[id] : max;
      state[id] = Math.min(max, Math.max(0, initial));
    });
    return state;
  });

  useEffect(() => {
    setResources((prev) => {
      const next = { ...prev };
      let changed = false;
      
      activeDefs.forEach((def) => {
        const id = def.id;
        const max = getMaxValue(id);
        
        if (next[id] === undefined) {
            next[id] = max;
            changed = true;
        } else if (next[id] > max) {
          next[id] = max;
          changed = true;
        }
      });

      Object.keys(next).forEach(id => {
        if (!activeDefs.find(def => def.id === id)) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [activeDefs, calculatedMaxValues]);

  useEffect(() => {
    const intervals = [];

    activeDefs.forEach((def) => {
      if (def.regenInterval && def.regenInterval > 0) {
        const id = setInterval(() => {
          setResources((prev) => {
            const current = prev[def.id];
            const max = getMaxValue(def.id);
            if (current === undefined || current >= max) return prev;
            return { ...prev, [def.id]: Math.min(max, current + 1) };
          });
        }, def.regenInterval);
        intervals.push(id);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [activeDefs, calculatedMaxValues]);

  const consumeResource = (id, amount) => {
    if (!id) return true;
    const current = resources[id];
    if (current === undefined || current < amount) return false;
    
    setResources((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] - amount)
    }));
    return true;
  };

  const addResource = (id, amount) => {
    const def = activeDefs.find(d => d.id === id);
    if (!def) return;
    const max = getMaxValue(id);
    setResources((prev) => ({
      ...prev,
      [id]: Math.min(max, (prev[id] || 0) + amount)
    }));
  };

  return { resources, consumeResource, addResource };
}
