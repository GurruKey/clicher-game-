import { AVATARS, DEFAULT_AVATAR_ID } from "../../content/avatars/index.js";
import { getRaceVariantById, getRaceVariantStats } from "../../content/race_variants/index.js";
import { getRaceById } from "../../content/race_variants/races/index.js";
import { getFactionByName, getFactionStats } from "../../content/factions_variants/index.js";
import { getOriginByName, getOriginStats } from "../../content/origins_variants/index.js";
import { getPerkById } from "../../content/perks/index.js";
import { STATS } from "../../content/stats/index.js";
import {
  aggregateBaseValues,
  calculateFinalValues,
  type CalcNodeDefinition
} from "../calc/calcEngine";

type Avatar = (typeof AVATARS)[number] & Record<string, unknown>;

type PerkResolved = {
  id: string;
  name: string;
  sourceType: "Race" | "Origin" | "Faction";
  sourceName: string;
  stats: unknown;
};

export function getSelectedAvatarById(avatarId: string | null): Avatar | null {
  const id = avatarId ?? DEFAULT_AVATAR_ID;
  return (AVATARS.find((a) => a.id === id) ?? AVATARS[0] ?? null) as Avatar | null;
}

export function getDefaultPerkIdsForAvatarId(avatarId: string | null): string[] {
  const avatar = getSelectedAvatarById(avatarId);
  if (!avatar) return [];

  const raceVariant = getRaceVariantById(avatar.raceVariantId);
  const originLevelRaw = (avatar as { originLevel?: unknown }).originLevel;
  const originLevel = Number.isFinite(Number(originLevelRaw)) ? Number(originLevelRaw) : 1;
  const originSource = getOriginByName(avatar.origin, originLevel) as unknown as
    | { perks?: unknown }
    | null;
  const factionLevelRaw = (avatar as { factionLevel?: unknown }).factionLevel;
  const factionLevel = Number.isFinite(Number(factionLevelRaw)) ? Number(factionLevelRaw) : 1;
  const factionSource = getFactionByName(avatar.faction, factionLevel) as unknown as
    | { perks?: unknown }
    | null;

  const ids = new Set<string>();
  const addIds = (value: unknown) => {
    if (!Array.isArray(value)) return;
    for (const id of value) {
      if (typeof id === "string") ids.add(id);
    }
  };

  addIds(raceVariant?.perks);
  addIds(originSource?.perks);
  addIds(factionSource?.perks);

  return Array.from(ids);
}

export function buildAvatarMeta(selectedAvatar: Avatar) {
  const raceVariant = getRaceVariantById(selectedAvatar.raceVariantId);
  const raceSource = raceVariant ? getRaceById(raceVariant.raceId) : null;
  const fallbackRaceName = (selectedAvatar as { race?: string }).race ?? "Unknown";
  const fallbackSubraceName = (selectedAvatar as { subrace?: string }).subrace ?? "Unknown";

  const raceStats = raceVariant ? getRaceVariantStats(raceVariant.id) : null;

  const subraceVariant = getRaceVariantById(selectedAvatar.subraceVariantId);
  const subraceSource = subraceVariant ? getRaceById(subraceVariant.raceId) : null;
  const subraceStats = subraceVariant ? getRaceVariantStats(subraceVariant.id) : null;

  const factionLevelRaw = (selectedAvatar as { factionLevel?: unknown }).factionLevel;
  const factionLevel = Number.isFinite(Number(factionLevelRaw)) ? Number(factionLevelRaw) : 1;
  const factionStats = getFactionStats(selectedAvatar.faction, factionLevel);
  const originLevelRaw = (selectedAvatar as { originLevel?: unknown }).originLevel;
  const originLevel = Number.isFinite(Number(originLevelRaw)) ? Number(originLevelRaw) : 1;
  const originStats = getOriginStats(selectedAvatar.origin, originLevel);
  const originSource = getOriginByName(selectedAvatar.origin, originLevel) as unknown as
    | { name: string; perks?: unknown }
    | null;
  const factionSource = getFactionByName(selectedAvatar.faction, factionLevel) as unknown as
    | { name: string; perks?: unknown }
    | null;

  const perks: PerkResolved[] = [];
  const perkStats: Record<string, number> = {};

  const addPerks = (
    sourceType: PerkResolved["sourceType"],
    sourceName: string,
    perkIds?: unknown
  ) => {
    if (!Array.isArray(perkIds) || perkIds.length === 0) return;
    for (const perkId of perkIds) {
      if (typeof perkId !== "string") continue;
      const perk = getPerkById(perkId);
      if (!perk) continue;
      perks.push({
        id: perk.id,
        name: perk.name,
        sourceType,
        sourceName,
        stats: perk.stats ?? null
      });
      if (perk.stats && typeof perk.stats === "object") {
        for (const [key, value] of Object.entries(perk.stats as Record<string, unknown>)) {
          const num = Number(value);
          if (!Number.isFinite(num)) continue;
          perkStats[key] = (perkStats[key] ?? 0) + num;
        }
      }
    }
  };

  if (raceVariant) addPerks("Race", raceSource?.name ?? raceVariant.raceId, raceVariant.perks);
  if (originSource) addPerks("Origin", originSource.name, originSource.perks);
  if (factionSource) addPerks("Faction", factionSource.name, factionSource.perks);

  const baseStats = aggregateBaseValues([raceStats, originStats, factionStats, perkStats]);
  const finalStats = calculateFinalValues(STATS as unknown as CalcNodeDefinition[], baseStats);

  return {
    ...selectedAvatar,
    race: raceSource?.name ?? fallbackRaceName,
    raceLevel: (raceVariant as { level?: unknown } | null)?.level ?? (selectedAvatar as { raceLevel?: unknown }).raceLevel ?? 1,
    subrace: subraceSource?.name ?? fallbackSubraceName,
    subraceLevel:
      (subraceVariant as { level?: unknown } | null)?.level ??
      (selectedAvatar as { subraceLevel?: unknown }).subraceLevel ??
      1,
    subraceStats: subraceStats ?? (selectedAvatar as { subraceStats?: unknown }).subraceStats,
    raceStats: raceStats ?? (selectedAvatar as { raceStats?: unknown }).raceStats,
    factionStats: factionStats ?? (selectedAvatar as { factionStats?: unknown }).factionStats,
    originStats: originStats ?? (selectedAvatar as { originStats?: unknown }).originStats,
    perks,
    perkStats,
    finalStats
  };
}
