import React, { useMemo } from "react";
import { buildStatDetails } from "../../data/stats/index.js";
import StatsDetailList from "../stats/StatsDetailList.jsx";

const DEFAULT_DETAILS = buildStatDetails(null, 3);

export default function StatsDialog({ isOpen, onClose, avatarMeta }) {
  const info = useMemo(() => {
    return {
      raceStats: avatarMeta?.raceStats ?? DEFAULT_DETAILS,
      originStats: avatarMeta?.originStats ?? DEFAULT_DETAILS,
      factionStats: avatarMeta?.factionStats ?? DEFAULT_DETAILS
    };
  }, [avatarMeta]);
  const totalStats = useMemo(() => {
    const totals = {};
    const addDetails = (details) => {
      if (!details) {
        return;
      }
      details.forEach((detail) => {
        const num = Number(detail.value);
        if (!Number.isFinite(num)) {
          return;
        }
        totals[detail.id] = (totals[detail.id] ?? 0) + num;
      });
    };
    addDetails(info.raceStats);
    addDetails(info.originStats);
    addDetails(info.factionStats);
    if (avatarMeta?.perkStats) {
      Object.entries(avatarMeta.perkStats).forEach(([key, value]) => {
        const num = Number(value);
        if (!Number.isFinite(num)) {
          return;
        }
        totals[key] = (totals[key] ?? 0) + num;
      });
    }
    if (Number.isFinite(totals.agility)) {
      totals.stamina = (totals.stamina ?? 0) + totals.agility;
    }
    return buildStatDetails(totals, 0);
  }, [
    info.raceStats,
    info.originStats,
    info.factionStats,
    avatarMeta?.perkStats
  ]);

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
        aria-label="Stats"
      >
        <h3>Stats</h3>
        <div className="stats-dialog__body">
          <StatsDetailList details={totalStats} />
        </div>
      </div>
    </div>
  );
}
