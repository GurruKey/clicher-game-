import React, { useMemo, useState } from "react";
import StatsDetailList from "../stats/StatsDetailList.jsx";
import StatsRowButton from "../stats/StatsRowButton.jsx";

export default function PerksDialog({ isOpen, onClose, perks = [] }) {
  const [openKey, setOpenKey] = useState(null);

  const list = Array.isArray(perks) ? perks : [];

  const perksWithDetails = useMemo(() => {
    return list.map((perk, index) => {
      const stats = perk.stats || {};
      const details = Object.entries(stats).map(([id, value]) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1), // Basic label fallback
        value: String(value)
      }));
      
      return {
        ...perk,
        key: `${perk.id}-${index}`,
        details
      };
    });
  }, [list]);

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
        aria-label="Perks"
      >
        <h3>Perks</h3>
        <div className="stats-dialog__body">
          {perksWithDetails.length === 0 ? (
            <div className="stats-dialog__row">
              <span className="stats-dialog__label">No perks yet</span>
            </div>
          ) : (
            perksWithDetails.map((perk) => {
              const hasDetails = perk.details.length > 0;
              const isExpanded = openKey === perk.key;

              return (
                <div key={perk.key}>
                  {hasDetails ? (
                    <StatsRowButton
                      label={perk.name}
                      value={isExpanded ? "▲" : "▼"}
                      onClick={() => setOpenKey(isExpanded ? null : perk.key)}
                    />
                  ) : (
                    <div className="stats-dialog__row">
                      <span className="stats-dialog__label">{perk.name}</span>
                      <span className="stats-dialog__value">Active</span>
                    </div>
                  )}
                  {hasDetails && isExpanded && (
                    <StatsDetailList details={perk.details} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
