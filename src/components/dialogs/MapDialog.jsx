import React from "react";
import useMapContextMenu from "../../hooks/map/useMapContextMenu.js";
import useMapPanZoom from "../../hooks/map/useMapPanZoom.js";
import {
  MapCanvas,
  MapContextMenu,
  MapDialogShell,
  MapRecenterButton
} from "../map/MapParts.jsx";

export default function MapDialog({
  isOpen,
  locationName,
  locationCoords,
  avatarIcon,
  avatarBg,
  avatarName,
  avatarIconOffset,
  avatarIconScale,
  avatarBgOffset,
  avatarBgScale,
  onClose,
  onLocationInfo
}) {
  const { mapMenu, menuRef, openMenu, closeMenu } = useMapContextMenu({
    isOpen
  });
  const avatarOffset = 58;
  const {
    mapRef,
    canvasRef,
    offset,
    zoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleRecenter
  } = useMapPanZoom({
    isOpen,
    onDragStart: closeMenu,
    focusOffset: { x: 0, y: avatarOffset }
  });

  const handleLocationContext = (event) => {
    openMenu(event);
  };

  const coordsLabel =
    locationCoords && typeof locationCoords.x === "number" && typeof locationCoords.y === "number"
      ? `${locationCoords.x.toFixed(1)}, ${locationCoords.y.toFixed(1)}`
      : null;

  return (
    <MapDialogShell isOpen={isOpen} onClose={onClose}>
      <MapCanvas
        mapRef={mapRef}
        canvasRef={canvasRef}
        offset={offset}
        zoom={zoom}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onLocationContext={handleLocationContext}
        avatarIcon={avatarIcon}
        avatarBg={avatarBg}
        avatarName={avatarName}
        avatarIconOffset={avatarIconOffset}
        avatarIconScale={avatarIconScale}
        avatarBgOffset={avatarBgOffset}
        avatarBgScale={avatarBgScale}
        avatarOffset={avatarOffset}
        locationName={locationName}
      >
        {coordsLabel ? (
          <div className="map-dialog__coords">{coordsLabel}</div>
        ) : null}
        <MapRecenterButton onClick={handleRecenter} />
        <MapContextMenu
          menu={mapMenu}
          menuRef={menuRef}
          onClose={closeMenu}
          onInfo={onLocationInfo}
        />
      </MapCanvas>
    </MapDialogShell>
  );
}
