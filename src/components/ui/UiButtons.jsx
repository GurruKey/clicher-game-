import React from "react";
import infoIcon from "../../assets/ui/info.png";
import mapIcon from "../../assets/ui/map.png";
import settingsIcon from "../../assets/ui/settings.png";

export function InfoButton() {
  return (
    <button className="book-button" type="button" aria-label="Book">
      <img src={infoIcon} alt="Info" draggable="false" />
    </button>
  );
}

export function MapButton({ onClick }) {
  return (
    <button className="map-button" type="button" onClick={onClick}>
      <img src={mapIcon} alt="Map" draggable="false" />
    </button>
  );
}

export function SettingsButton({ onClick }) {
  return (
    <button
      className="settings-button"
      type="button"
      aria-label="Settings"
      onClick={onClick}
    >
      <img src={settingsIcon} alt="" draggable="false" />
    </button>
  );
}
