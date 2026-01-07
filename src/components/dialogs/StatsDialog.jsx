import React, { useMemo } from "react";
import { buildStatDetails } from "../../data/stats/index.js";
import { STATS_DISPLAY_CONFIG } from "../../data/stats/display_config.js";
import StatsDetailList from "../stats/StatsDetailList.jsx";

export default function StatsDialog({ isOpen, onClose, avatarMeta }) {
  const totalStats = useMemo(() => {
    // We prefer the pre-calculated finalStats from avatarMeta logic
    if (avatarMeta?.finalStats) {
        return buildStatDetails(avatarMeta.finalStats, 0);
    }
    
    return buildStatDetails({}, 0);
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
        aria-label="Stats"
      >
        <h3>Stats</h3>
        <div className="stats-dialog__body">
          <StatsDetailList 
            details={totalStats} 
            displayConfig={STATS_DISPLAY_CONFIG} 
          />
        </div>
      </div>
    </div>
  );
}
