import React from "react";

export default function StatsRowButton({ label, value, onClick }) {
  return (
    <button
      className="stats-dialog__row stats-dialog__row--button"
      type="button"
      onClick={onClick}
    >
      <span className="stats-dialog__label">{label}</span>
      <span className="stats-dialog__value">{value}</span>
    </button>
  );
}
