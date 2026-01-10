import React, { useMemo, useState } from "react";
import { buildStatDetails } from "../../data/stats/index.js";
import StatsDetailList from "../stats/StatsDetailList.jsx";
import StatsRowButton from "../stats/StatsRowButton.jsx";

const DEFAULT_DETAILS = buildStatDetails(null, 3);

export default function BloodlineDialog({ isOpen, onClose, avatarMeta }) {
  const [isRaceOpen, setIsRaceOpen] = useState(false);
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isFactionOpen, setIsFactionOpen] = useState(false);
  const info = useMemo(() => {
    return {
      race: avatarMeta?.race ?? "Human",
      raceLevel: avatarMeta?.raceLevel ?? 1,
      subrace: avatarMeta?.subrace ?? "Common",
      subraceLevel: avatarMeta?.subraceLevel ?? 1,
      gender: avatarMeta?.gender ?? "Male",
      origin: avatarMeta?.origin ?? "Unknown",
      originLevel: avatarMeta?.originLevel ?? 1,
      faction: avatarMeta?.faction ?? "Neutral",
      factionLevel: avatarMeta?.factionLevel ?? 1,
      subfaction: avatarMeta?.subfaction ?? "None",
      subfactionLevel: avatarMeta?.subfactionLevel ?? 1,
      factionSubtype: avatarMeta?.factionSubtype ?? "None",
      factionSubtypeLevel: avatarMeta?.factionSubtypeLevel ?? 1,
      raceStats: avatarMeta?.raceStats ?? DEFAULT_DETAILS,
      originStats: avatarMeta?.originStats ?? DEFAULT_DETAILS,
      factionStats: avatarMeta?.factionStats ?? DEFAULT_DETAILS
    };
  }, [avatarMeta]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog stats-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Bloodline"
      >
        <h3>Bloodline</h3>
        <div className="stats-dialog__body">
          <StatsRowButton
            label="Race"
            value={`${info.race} (Level ${info.raceLevel})`}
            onClick={() => setIsRaceOpen((prev) => !prev)}
          />
          {isRaceOpen ? <StatsDetailList details={info.raceStats} /> : null}
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Subrace</span>
            <span className="stats-dialog__value">
              {`${info.subrace} (Level ${info.subraceLevel})`}
            </span>
          </div>
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Gender</span>
            <span className="stats-dialog__value">{info.gender}</span>
          </div>
          <StatsRowButton
            label="Origin"
            value={info.origin}
            onClick={() => setIsOriginOpen((prev) => !prev)}
          />
          {isOriginOpen ? <StatsDetailList details={info.originStats} /> : null}
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Origin Level</span>
            <span className="stats-dialog__value">{info.originLevel}</span>
          </div>
          <StatsRowButton
            label="Faction"
            value={info.faction}
            onClick={() => setIsFactionOpen((prev) => !prev)}
          />
          {isFactionOpen ? (
            <StatsDetailList details={info.factionStats} />
          ) : null}
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Faction Level</span>
            <span className="stats-dialog__value">{info.factionLevel}</span>
          </div>
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Subfaction</span>
            <span className="stats-dialog__value">{info.subfaction}</span>
          </div>
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Subfaction Level</span>
            <span className="stats-dialog__value">{info.subfactionLevel}</span>
          </div>
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Faction Subtype</span>
            <span className="stats-dialog__value">{info.factionSubtype}</span>
          </div>
          <div className="stats-dialog__row">
            <span className="stats-dialog__label">Faction Subtype Level</span>
            <span className="stats-dialog__value">
              {info.factionSubtypeLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
