import { PERKS } from "../content/perks/index.js";
import { RESOURCES } from "../content/resources/index.js";
import type { ResourceDefinition } from "../systems/resources/calculateFinalResources";
import {
  getActiveResourceDefinitions,
  getUnlockedResourceIds,
  type PerkDefinition
} from "../systems/resources/resourceState";

export type DerivedResourcesConfig = {
  activeDefs: ResourceDefinition[];
  activeIds: string[];
  baseById: Record<string, number>;
};

export function deriveResourcesConfig(perkIds: string[]): DerivedResourcesConfig {
  const perkDefs = PERKS as unknown as PerkDefinition[];
  const resourceDefs = RESOURCES as unknown as ResourceDefinition[];

  const unlocked = getUnlockedResourceIds(perkIds, perkDefs);
  const activeDefs = getActiveResourceDefinitions(resourceDefs, unlocked);

  const baseById: Record<string, number> = {};
  for (const def of activeDefs) {
    baseById[def.id] = def.base ?? 0;
  }

  return {
    activeDefs,
    activeIds: activeDefs.map((d) => d.id),
    baseById
  };
}

