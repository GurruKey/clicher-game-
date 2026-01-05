import React from "react";

export default function StatsDetailList({ details }) {
  return (
    <div className="stats-dialog__details">
      {details.map((detail) => (
        <div className="stats-dialog__detail" key={detail.label}>
          <span className="stats-dialog__detail-label">{detail.label}</span>
          <span className="stats-dialog__detail-value">{detail.value}</span>
        </div>
      ))}
    </div>
  );
}
