import React from "react";
import AvatarCircle from "../ui/AvatarCircle.jsx";

export function MapDialogShell({ isOpen, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop dialog-backdrop--map"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="dialog map-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Map"
      >
        {children}
      </div>
    </div>
  );
}

export function MapCanvas({
  mapRef,
  canvasRef,
  offset,
  zoom,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onLocationContext,
  avatarIcon,
  avatarBg,
  avatarOffset,
  avatarName,
  avatarIconOffset,
  avatarIconScale,
  avatarBgOffset,
  avatarBgScale,
  locationName,
  children
}) {
  return (
    <div
      className="map-dialog__map"
      ref={mapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className="map-dialog__canvas"
        ref={canvasRef}
        style={{
          "--map-x": `${offset.x}px`,
          "--map-y": `${offset.y}px`,
          "--map-scale": zoom,
          ...(avatarOffset !== undefined && avatarOffset !== null
            ? { "--avatar-offset-y": `${avatarOffset}px` }
            : {})
        }}
      >
        {avatarIcon ? (
          <AvatarCircle
            className="map-dialog__avatar map-dialog__avatar--marker avatar-circle--map"
            size={38}
            icon={avatarIcon}
            bg={avatarBg}
            name={avatarName}
            iconOffset={avatarIconOffset}
            iconScale={avatarIconScale}
            bgOffset={avatarBgOffset}
            bgScale={avatarBgScale}
          />
        ) : null}
        <div className="map-dialog__location" onContextMenu={onLocationContext}>
          <span className="map-dialog__location-text">{locationName}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function MapContextMenu({ menu, menuRef, onInfo, onClose }) {
  if (!menu) {
    return null;
  }

  const handleInfo = () => {
    if (onClose) {
      onClose();
    }
    if (onInfo) {
      onInfo();
    }
  };

  const stopEvent = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className="context-menu map-dialog__menu"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      ref={menuRef}
      onClick={stopEvent}
      onPointerDown={stopEvent}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button type="button" onClick={handleInfo}>
        Info
      </button>
    </div>
  );
}

export function MapRecenterButton({ onClick }) {
  return (
    <button
      className="map-dialog__recenter"
      type="button"
      onClick={onClick}
      aria-label="Recenter map"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.8v3.1M12 18.1v3.1M2.8 12h3.1M18.1 12h3.1" />
      </svg>
    </button>
  );
}
