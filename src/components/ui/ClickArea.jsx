import React from "react";

export default function ClickArea({
  label,
  value,
  onClick,
  isWorking,
  progress,
  timeLabel,
  locationName,
  onLocationClick,
  squeezeLeft,
  squeezeRight
}) {
  const progressWidth = `${Math.min(100, Math.max(0, progress * 100))}%`;
  const squeezeClasses = [
    "click-area-wrap",
    squeezeLeft ? "click-area-wrap--squeeze-left" : "",
    squeezeRight ? "click-area-wrap--squeeze-right" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={squeezeClasses}>
      <button
        className="location-title"
        type="button"
        onClick={onLocationClick}
      >
        {locationName}
      </button>
      <div className="click-frame">
        <button
          className="click-area"
          onClick={onClick}
          type="button"
          disabled={isWorking}
        />
      </div>
      <div className="click-progress-row" aria-hidden="true">
        <div className="click-progress">
          <div
            className="click-progress__fill"
            style={{ width: progressWidth }}
          />
        </div>
        <div className="click-progress__time">{timeLabel}</div>
      </div>
    </div>
  );
}
