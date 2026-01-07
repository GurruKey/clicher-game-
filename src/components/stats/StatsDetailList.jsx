import React from "react";

export default function StatsDetailList({ details, displayConfig = [] }) {
  // If no config provided, just show flat list
  if (!displayConfig || displayConfig.length === 0) {
    return (
      <div className="stats-dialog__details">
        {details.map((detail) => (
          <div className="stats-dialog__detail" key={detail.id || detail.label}>
            <span className="stats-dialog__detail-label">{detail.label}</span>
            <span className="stats-dialog__detail-value">{detail.value}</span>
          </div>
        ))}
      </div>
    );
  }

  // Create a map for quick lookup
  const detailMap = {};
  details.forEach(d => {
    detailMap[d.id] = d;
  });

  const assignedIds = new Set();
  
  const categories = displayConfig.map(cat => {
    const catDetails = cat.stats
      .map(sid => detailMap[sid])
      .filter(Boolean);
    
    cat.stats.forEach(sid => assignedIds.add(sid));
    
    return {
      ...cat,
      details: catDetails
    };
  }).filter(cat => cat.details.length > 0);

  // Collect unassigned stats
  const unassigned = details.filter(d => !assignedIds.has(d.id));

  return (
    <div className="stats-dialog__categories">
      {categories.map((cat) => (
        <div className="stats-dialog__category" key={cat.id}>
          <div className="stats-dialog__category-header">
            {cat.label}
          </div>
          <div className="stats-dialog__details">
            {cat.details.map((detail) => (
              <div className="stats-dialog__detail" key={detail.id}>
                <span className="stats-dialog__detail-label">{detail.label}</span>
                <span className="stats-dialog__detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {unassigned.length > 0 && (
        <div className="stats-dialog__category">
          <div className="stats-dialog__category-header">
            Other
          </div>
          <div className="stats-dialog__details">
            {unassigned.map((detail) => (
              <div className="stats-dialog__detail" key={detail.id}>
                <span className="stats-dialog__detail-label">{detail.label}</span>
                <span className="stats-dialog__detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
