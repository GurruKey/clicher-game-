/**
 * Generic calculation engine for nodes with modifiers (Stats, Resources, etc.)
 */

export function calculateFinalValues(definitions, overrideBases = {}) {
  // 1. Initialize with default base values from definitions or overrides
  let initialValues = {};
  definitions.forEach(def => {
    const defaultValue = def.base || 0;
    const overrideValue = overrideBases[def.id];
    
    // We ADD the override (from perks/race) to the base value from the file
    initialValues[def.id] = defaultValue + (overrideValue !== undefined ? overrideValue : 0);
  });

  let currentValues = { ...initialValues };
  const MAX_PASSES = 5;

  for (let i = 0; i < MAX_PASSES; i++) {
    let changed = false;
    let calculatedValues = { ...initialValues };

    definitions.forEach(sourceNode => {
        const sourceValue = currentValues[sourceNode.id] || 0;
        const modifiers = sourceNode.modifiers || [];

        modifiers.forEach(mod => {
            const { targetStatId, value, type } = mod;
            if (!targetStatId) return;

            let bonus = 0;
            if (type === "flat" || !type) {
                bonus = sourceValue * value;
            }

            if (bonus !== 0) {
                calculatedValues[targetStatId] = (calculatedValues[targetStatId] || 0) + bonus;
            }
        });
    });

    definitions.forEach(def => {
        if (calculatedValues[def.id] !== currentValues[def.id]) {
            changed = true;
        }
    });

    currentValues = calculatedValues;
    if (!changed) break;
  }

  return currentValues;
}

export function aggregateBaseValues(sources) {
    const base = {};
    sources.forEach(source => {
        if (!source) return;
        if (Array.isArray(source)) {
            source.forEach(item => {
                const val = Number(item.value);
                if (Number.isFinite(val)) {
                    base[item.id] = (base[item.id] || 0) + val;
                }
            });
        } else {
            Object.entries(source).forEach(([key, val]) => {
                const num = Number(val);
                if (Number.isFinite(num)) {
                    base[key] = (base[key] || 0) + num;
                }
            });
        }
    });
    return base;
}
