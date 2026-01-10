import { useEffect, useMemo, useState } from "react";
import EntryScreen from "./components/entry/EntryScreen.jsx";
import GameRoot from "./components/GameRoot.jsx";
import { AVATARS, DEFAULT_AVATAR_ID } from "./data/avatars/index.js";
import { getRaceById } from "./data/race_variants/races/index.js";
import { getFactionByName, getFactionStats } from "./data/factions/index.js";
import { getOriginByName, getOriginStats } from "./data/origins/index.js";
import { getPerkById } from "./data/perks/index.js";
import { STATS } from "./data/stats/index.js";
import { calculateFinalValues, aggregateBaseValues } from "./utils/calcEngine.js";
import {
  getRaceVariantById,
  getRaceVariantStats
} from "./data/race_variants/index.js";
import { clearGameSave } from "./utils/gameStorage.js";

const AVATAR_STORAGE_KEY = "click-avatar-id";

export default function App() {
  const [hasAvatar, setHasAvatar] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR_ID);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);

    const stored = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    const known = AVATARS.some((avatar) => avatar.id === stored);
    if (known && stored) {
      setSelectedAvatarId(stored);
    }
    setHasAvatar(known);
    setIsReady(true);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const selectedAvatar = useMemo(
    () => AVATARS.find((avatar) => avatar.id === selectedAvatarId) ?? AVATARS[0],
    [selectedAvatarId]
  );
  
  const selectedAvatarMeta = useMemo(() => {
    if (!selectedAvatar) {
      return null;
    }
    const raceVariant = getRaceVariantById(selectedAvatar.raceVariantId);
    const raceSource = raceVariant
      ? getRaceById(raceVariant.raceId)
      : null;
    const fallbackRaceName = selectedAvatar.race ?? "Unknown";
    const fallbackSubraceName = selectedAvatar.subrace ?? "Unknown";
    const raceStats = raceVariant
      ? getRaceVariantStats(raceVariant.id)
      : null;
    const subraceVariant = getRaceVariantById(
      selectedAvatar.subraceVariantId
    );
    const subraceSource = subraceVariant
      ? getRaceById(subraceVariant.raceId)
      : null;
    const subraceStats = subraceVariant
      ? getRaceVariantStats(subraceVariant.id)
      : null;
    const factionStats = getFactionStats(selectedAvatar.faction);
    const originStats = getOriginStats(selectedAvatar.origin);
    const originSource = getOriginByName(selectedAvatar.origin);
    const factionSource = getFactionByName(selectedAvatar.faction);
    const perks = [];
    const perkStats = {};
    const addPerks = (sourceType, sourceName, perkIds) => {
      if (!perkIds?.length) {
        return;
      }
      perkIds.forEach((perkId) => {
        const perk = getPerkById(perkId);
        if (!perk) {
          return;
        }
        perks.push({
          id: perk.id,
          name: perk.name,
          sourceType,
          sourceName,
          stats: perk.stats ?? null
        });
        if (perk.stats) {
          Object.entries(perk.stats).forEach(([key, value]) => {
            const num = Number(value);
            if (!Number.isFinite(num)) {
              return;
            }
            perkStats[key] = (perkStats[key] ?? 0) + num;
          });
        }
      });
    };
    if (raceVariant) {
      addPerks(
        "Race",
        raceSource?.name ?? raceVariant.raceId,
        raceVariant.perks
      );
    }
    if (originSource) {
      addPerks("Origin", originSource.name, originSource.perks);
    }
    if (factionSource) {
      addPerks("Faction", factionSource.name, factionSource.perks);
    }
    
    // Calculate Final Stats
    const baseStats = aggregateBaseValues([
        raceStats,
        originStats,
        factionStats,
        perkStats
    ]);
    const finalStats = calculateFinalValues(STATS, baseStats);
    
    return {
      ...selectedAvatar,
      race: raceSource?.name ?? fallbackRaceName,
      raceLevel: raceVariant?.level ?? selectedAvatar.raceLevel ?? 1,
      subrace: subraceSource?.name ?? fallbackSubraceName,
      subraceLevel: subraceVariant?.level ?? selectedAvatar.subraceLevel ?? 1,
      subraceStats: subraceStats ?? selectedAvatar.subraceStats,
      raceStats: raceStats ?? selectedAvatar.raceStats,
      factionStats: factionStats ?? selectedAvatar.factionStats,
      originStats: originStats ?? selectedAvatar.originStats,
      perks,
      perkStats,
      finalStats
    };
  }, [selectedAvatar]);

  const staminaEnabled = useMemo(() => {
    if (!selectedAvatarMeta) {
      return false;
    }
    return selectedAvatarMeta.perks?.some((perk) => perk.id === "stamina");
  }, [selectedAvatarMeta]);

  const staminaBonus = useMemo(() => {
    if (!staminaEnabled) return 0;
    return selectedAvatarMeta?.finalStats?.max_stamina ?? 0;
  }, [selectedAvatarMeta, staminaEnabled]);

  const handleEnter = () => {
    const avatarId = selectedAvatar?.id ?? DEFAULT_AVATAR_ID;
    window.localStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    setHasAvatar(true);
    setInGame(true);
  };

  const handleResetProgress = () => {
    clearGameSave();
    window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    setHasAvatar(false);
    setSelectedAvatarId(DEFAULT_AVATAR_ID);
    setInGame(false);
  };

  const handleSelectAvatar = (avatarId) => {
    setSelectedAvatarId(avatarId);
  };

  if (!isReady) {
    return null;
  }

  return (
    <div className="app">
      {inGame ? (
        <GameRoot
          avatarIcon={selectedAvatar?.icon}
          avatarBg={selectedAvatar?.bg}
          avatarName={selectedAvatar?.name}
          avatarMeta={selectedAvatarMeta}
          staminaBonus={staminaBonus}
          staminaEnabled={staminaEnabled}
          onResetProgress={handleResetProgress}
        />
      ) : (
        <EntryScreen
          hasAvatar={hasAvatar}
          avatars={AVATARS}
          selectedAvatarId={selectedAvatarId}
          onSelectAvatar={handleSelectAvatar}
          onEnter={handleEnter}
        />
      )}
    </div>
  );
}
