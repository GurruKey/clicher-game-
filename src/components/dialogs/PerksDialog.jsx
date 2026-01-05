import React, { useMemo, useState } from "react";
import StatsDetailList from "../stats/StatsDetailList.jsx";
import StatsRowButton from "../stats/StatsRowButton.jsx";
import { STATS } from "../../data/stats/index.js";

export default function PerksDialog({ isOpen, onClose, perks }) {
  if (!isOpen) {
    return null;
  }

  const list = Array.isArray(perks) ? perks : [];
  const [openKey, setOpenKey] = useState(null);
  const detailsMap = useMemo(() => {
    const map = new Map();
    list.forEach((perk, index) => {
      const key = `${perk.sourceType}-${perk.sourceName}-${perk.id}-${index}`;
      if (!perk.stats) {
        map.set(key, []);
        return;
      }
      const details = STATS.filter((stat) => perk.stats[stat.id] != null).map(
        (stat) => ({
          label: stat.label,
          value: String(perk.stats[stat.id])
        })
      );
      map.set(key, details);
    });
    return map;
  }, [list]);

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog stats-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Perks"
      >
        <h3>Perks</h3>
        <div className="stats-dialog__body">
          {list.length === 0 ? (
            <div className="stats-dialog__row">
              <span className="stats-dialog__label">No perks yet</span>
            </div>
          ) : (
            list.map((perk, index) => {
              const key = `${perk.sourceType}-${perk.sourceName}-${perk.id}-${index}`;
              const details = detailsMap.get(key) ?? [];
              const hasDetails = details.length > 0;
              return (
                <div key={key}>
                  {hasDetails ? (
                    <StatsRowButton
                      label={`${perk.sourceType}: ${perk.sourceName}`}
                      value={perk.name}
                      onClick={() =>
                        setOpenKey((prev) => (prev === key ? null : key))
                      }
                    />
                  ) : (
                    <div className="stats-dialog__row">
                      <span className="stats-dialog__label">
                        {perk.sourceType}: {perk.sourceName}
                      </span>
                      <span className="stats-dialog__value">{perk.name}</span>
                    </div>
                  )}
                  {hasDetails && openKey === key ? (
                    <StatsDetailList details={details} />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
