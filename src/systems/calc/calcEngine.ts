export type CalcModifier = {
  targetStatId: string;
  value: number;
  type?: "flat";
};

export type CalcNodeDefinition = {
  id: string;
  base?: number;
  modifiers?: CalcModifier[];
};

export function calculateFinalValues(
  definitions: CalcNodeDefinition[],
  overrideBases: Record<string, number> = {}
): Record<string, number> {
  const initialValues: Record<string, number> = {};
  for (const def of definitions) {
    const defaultValue = def.base ?? 0;
    const overrideValue = overrideBases[def.id];
    initialValues[def.id] = defaultValue + (overrideValue !== undefined ? overrideValue : 0);
  }

  let currentValues: Record<string, number> = { ...initialValues };
  const MAX_PASSES = 5;

  for (let i = 0; i < MAX_PASSES; i++) {
    let changed = false;
    const calculatedValues: Record<string, number> = { ...initialValues };

    for (const sourceNode of definitions) {
      const sourceValue = currentValues[sourceNode.id] ?? 0;
      const modifiers = sourceNode.modifiers ?? [];

      for (const mod of modifiers) {
        const { targetStatId, value, type } = mod;
        if (!targetStatId) continue;

        let bonus = 0;
        if (type === "flat" || !type) {
          bonus = sourceValue * value;
        }

        if (bonus !== 0) {
          calculatedValues[targetStatId] = (calculatedValues[targetStatId] ?? 0) + bonus;
        }
      }
    }

    for (const def of definitions) {
      if (calculatedValues[def.id] !== currentValues[def.id]) {
        changed = true;
      }
    }

    currentValues = calculatedValues;
    if (!changed) break;
  }

  return currentValues;
}

export function aggregateBaseValues(
  sources: Array<unknown>
): Record<string, number> {
  const base: Record<string, number> = {};

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const item of source) {
        if (!item || typeof item !== "object") continue;
        const id = (item as { id?: unknown }).id;
        const value = (item as { value?: unknown }).value;
        if (typeof id !== "string") continue;
        const num = Number(value);
        if (Number.isFinite(num)) {
          base[id] = (base[id] ?? 0) + num;
        }
      }
      continue;
    }

    if (typeof source === "object") {
      for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
        const num = Number(value);
        if (Number.isFinite(num)) {
          base[key] = (base[key] ?? 0) + num;
        }
      }
    }
  }

  return base;
}

