import { calculateFinalValues, type CalcNodeDefinition } from "../calc/calcEngine";

export type ResourceDefinition = CalcNodeDefinition & {
  label?: string;
  regenInterval?: number;
  color?: string;
  textColor?: string;
  effects?: unknown[];
};

/**
 * Calculates final resource maximums considering stat/resource modifiers.
 * Mirrors the current behavior from legacy logic.
 */
export function calculateFinalResources(
  calculatedStats: Record<string, number>,
  resources: ResourceDefinition[],
  stats: CalcNodeDefinition[],
  overrideBases: Record<string, number> = {}
): Record<string, number> {
  const allNodes: CalcNodeDefinition[] = [...resources, ...stats];

  const finalValues = calculateFinalValues(allNodes, {
    ...calculatedStats,
    ...overrideBases
  });

  const resourceResults: Record<string, number> = {};
  for (const res of resources) {
    resourceResults[res.id] = finalValues[res.id] ?? 0;
  }
  return resourceResults;
}
