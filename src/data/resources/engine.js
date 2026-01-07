import { RESOURCES } from "./index.js";
import { STATS } from "../stats/index.js";
import { calculateFinalValues } from "../../utils/calcEngine.js";

/**
 * Calculates final resource maximums considering stat modifiers.
 * 
 * @param {Object} calculatedStats - Already calculated final stat values
 * @param {Object} overrideBases - Manual base overrides
 */
export function calculateFinalResources(calculatedStats, overrideBases = {}) {
    // Combine resources and stats for the calculation engine so it can resolve dependencies
    // (e.g. Strength -> Max HP)
    const allNodes = [...RESOURCES, ...STATS];
    
    // Run the shared calculation engine
    const finalValues = calculateFinalValues(allNodes, { ...calculatedStats, ...overrideBases });
    
    // Filter out only resources from the result
    const resourceResults = {};
    RESOURCES.forEach(res => {
        resourceResults[res.id] = finalValues[res.id];
    });
    
    return resourceResults;
}
