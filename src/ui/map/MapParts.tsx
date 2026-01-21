import type { ReactNode } from "react";
import AvatarCircle from "../AvatarCircle";

type Offset = { x: number; y: number };

export function MapDialogShell(props: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  if (!props.isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={props.onClose}
      className="dialog-backdrop dialog-backdrop--map"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Map"
        onClick={(event) => event.stopPropagation()}
        className="dialog map-dialog"
      >
        {props.children}
      </div>
    </div>
  );
}

export function MapCanvas(props: {
  mapRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLDivElement>;
  offset: Offset;
  zoom: number;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onWheel: (event: React.WheelEvent) => void;
  onLocationContext: (event: React.MouseEvent, id: string) => void;
  avatarIcon?: string | null;
  avatarBg?: string | null;
  avatarOffset?: number;
  avatarName?: string | null;
  avatarIconOffset?: Offset;
  avatarIconScale?: number;
  avatarBgOffset?: Offset;
  avatarBgScale?: number;
  currentLocationId?: string;
  locationName: string;
  locations?: Array<{ id: string; name: string; coords: { x: number; y: number } }>;
  onSelectLocation?: (id: string) => void;
  children?: ReactNode;
}) {
  const avatarOffset = props.avatarOffset ?? 58;
  const currentLoc = props.locations?.find((l) => l.id === props.currentLocationId);
  const avatarCoords = currentLoc?.coords ?? { x: 0, y: 0 };

  return (
    <div
      ref={props.mapRef}
      onPointerDown={props.onPointerDown}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerLeave={props.onPointerUp}
      onPointerCancel={props.onPointerUp}
      onWheel={props.onWheel}
      className="map-dialog__map"
    >
      <div
        ref={props.canvasRef}
        className="map-dialog__canvas"
        style={{
          ["--map-x" as any]: `${props.offset.x}px`,
          ["--map-y" as any]: `${props.offset.y}px`,
          ["--map-scale" as any]: props.zoom
        }}
      >
        <div className="map-dialog__canvas-inner">
          {props.locations?.map((loc) => (
            <button
              key={loc.id}
              className="map-dialog__location"
              style={{
                left: `calc(50% + ${loc.coords.x * 1000}px)`,
                top: `calc(50% - ${loc.coords.y * 1000}px)`
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                console.log("PointerDown on location:", loc.id);
                props.onSelectLocation?.(loc.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onLocationContext(e, loc.id);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Click on location:", loc.id);
                props.onSelectLocation?.(loc.id);
              }}
            >
              <span className="map-dialog__location-text">{loc.name}</span>
            </button>
          ))}

          {props.avatarIcon && props.avatarBg ? (
            <div
              className="map-dialog__avatar map-dialog__avatar--marker"
              style={{
                left: `calc(50% + ${avatarCoords.x * 1000}px)`,
                top: `calc(50% - ${avatarCoords.y * 1000}px)`,
                ["--avatar-offset-y" as any]: `${avatarOffset}px`
              }}
            >
              <AvatarCircle
                size={38}
                name={props.avatarName ?? "Avatar"}
                icon={props.avatarIcon}
                bg={props.avatarBg}
                iconOffset={props.avatarIconOffset}
                iconScale={props.avatarIconScale}
                bgOffset={props.avatarBgOffset}
                bgScale={props.avatarBgScale}
              />
            </div>
          ) : null}
        </div>
      </div>

      {props.children}
    </div>
  );
}

export function MapContextMenu(props: {
  menu: { x: number; y: number } | null;
  menuRef: React.RefObject<HTMLDivElement>;
  onInfo: () => void;
  onSelectLocation: (locationId: string) => void;
  locations: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  if (!props.menu) return null;

  const stopEvent = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <div
      ref={props.menuRef}
      role="menu"
      onClick={stopEvent}
      onPointerDown={stopEvent}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      className="context-menu map-dialog__menu"
      style={{ left: props.menu.x, top: props.menu.y }}
    >
      <button
        type="button"
        onClick={() => {
          props.onClose();
          props.onInfo();
        }}
      >
        Info
      </button>

      {props.locations.map((loc) => (
        <button
          key={loc.id}
          type="button"
          onClick={() => {
            props.onClose();
            props.onSelectLocation(loc.id);
          }}
        >
          {loc.name}
        </button>
      ))}
    </div>
  );
}

export function MapRecenterButton(props: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Recenter map"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={props.onClick}
      className="map-dialog__recenter"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" fill="none" />
        <path d="M12 2.8v3.1M12 18.1v3.1M2.8 12h3.1M18.1 12h3.1" />
      </svg>
    </button>
  );
}
