import React from "react";

export default function LocationDialog({
  isOpen,
  locationName,
  locationCoords,
  items,
  currencies,
  onClose
}) {
  if (!isOpen) {
    return null;
  }

  const coordsLabel =
    locationCoords && typeof locationCoords.x === "number" && typeof locationCoords.y === "number"
      ? `${locationCoords.x.toFixed(1)}, ${locationCoords.y.toFixed(1)}`
      : null;

  return (
    <div
      className="dialog-backdrop dialog-backdrop--location"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="dialog location-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="location-dialog__header">
          <h3 className="location-dialog__title">{locationName}</h3>
          {coordsLabel ? (
            <span className="location-dialog__coords">{coordsLabel}</span>
          ) : null}
        </div>
        {items.length === 0 ? (
          <div className="location-dialog__empty">Empty</div>
        ) : (
          <div className="location-dialog__list">
            {items.map((item) => (
              <div className="location-dialog__row" key={item.id}>
                <div className="location-dialog__left">
                  <img
                    className="location-dialog__icon"
                    src={currencies[item.id]?.icon}
                    alt={item.name}
                    draggable="false"
                  />
                  <span
                    className="location-dialog__name"
                    data-rarity={item.rarity || undefined}
                  >
                    {item.name}
                  </span>
                </div>
                <span className="location-dialog__rate">{item.rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
