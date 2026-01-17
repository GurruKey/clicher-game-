import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { closeMap, openLocation, selectUi } from "../state/uiSlice";
import useMapContextMenu from "../hooks/map/useMapContextMenu";
import useMapPanZoom from "../hooks/map/useMapPanZoom";
import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { selectAvatarMetaFromRoot } from "../state/avatarSelectors";
import { selectLocationId, setLocationId } from "../state/playerSlice";
import { MapCanvas, MapContextMenu, MapDialogShell, MapRecenterButton } from "./map/MapParts";

export default function MapDialog() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUi);
  const avatarMeta = useAppSelector(selectAvatarMetaFromRoot) as any;
  const currentLocationId = useAppSelector(selectLocationId);

  const viewedLocationId = ui.viewedLocationId ?? currentLocationId;
  const location =
    (LOCATIONS as Record<string, any>)[viewedLocationId] ??
    (LOCATIONS as Record<string, any>)[DEFAULT_LOCATION_ID];

  const coordsLabel =
    location?.coords && typeof location.coords.x === "number" && typeof location.coords.y === "number"
      ? `${location.coords.x.toFixed(1)}, ${location.coords.y.toFixed(1)}`
      : null;

  const { mapMenu, menuRef, openMenu, closeMenu } = useMapContextMenu({ isOpen: ui.isMapOpen });
  const avatarOffset = 58;

  const focusOffset = useMemo(() => {
    const currentLoc = (LOCATIONS as Record<string, any>)[currentLocationId];
    const coords = currentLoc?.coords ?? { x: 0, y: 0 };
    return {
      x: -(coords.x * 1000),
      y: (coords.y * 1000) + avatarOffset
    };
  }, [currentLocationId]);

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
    isOpen: ui.isMapOpen,
    onDragStart: closeMenu,
    focusOffset
  });

  const handleLocationClick = (id: string) => {
    // При клике левой кнопкой по локации просто открываем инфо, 
    // не закрывая карту.
    dispatch(openLocation(id));
  };

  const handleLocationContext = (event: React.MouseEvent, id: string) => {
    // При клике правой кнопкой выделяем локацию и открываем меню
    dispatch(openLocation(id));
    openMenu(event as any);
  };

  const avatar = useMemo(() => {
    if (!avatarMeta) return null;
    const icon = avatarMeta.icon ?? null;
    const bg = avatarMeta.bg ?? null;
    if (!icon || !bg) return null;
    return {
      name: String(avatarMeta.name ?? "Avatar"),
      icon: String(icon),
      bg: String(bg),
      iconOffset: avatarMeta.iconOffset ?? undefined,
      iconScale: avatarMeta.iconScale ?? undefined,
      bgOffset: avatarMeta.bgOffset ?? undefined,
      bgScale: avatarMeta.bgScale ?? undefined
    };
  }, [avatarMeta]);

  const locationsList = useMemo(() => {
    return Object.values(LOCATIONS as Record<string, any>).map((loc) => ({
      id: String(loc.id),
      name: String(loc.name ?? loc.id),
      coords: loc.coords ?? { x: 0, y: 0 }
    }));
  }, []);

  return (
    <MapDialogShell isOpen={ui.isMapOpen} onClose={() => dispatch(closeMap())}>
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
        avatarIcon={avatar?.icon}
        avatarBg={avatar?.bg}
        avatarName={avatar?.name}
        avatarIconOffset={avatar?.iconOffset}
        avatarIconScale={avatar?.iconScale}
        avatarBgOffset={avatar?.bgOffset}
        avatarBgScale={avatar?.bgScale}
        avatarOffset={avatarOffset}
        currentLocationId={currentLocationId}
        locationName={location?.name ?? "Unknown"}
        locations={locationsList}
        onSelectLocation={handleLocationClick}
      >
        {coordsLabel ? (
          <div className="map-dialog__coords">{coordsLabel}</div>
        ) : null}

        <MapRecenterButton
          onClick={() => {
            closeMenu();
            handleRecenter();
          }}
        />

        <MapContextMenu
          menu={mapMenu}
          menuRef={menuRef}
          onClose={closeMenu}
          onInfo={() => {
            dispatch(openLocation(ui.viewedLocationId ?? undefined));
          }}
          onSelectLocation={(locationId) => {
            dispatch(openLocation(locationId));
          }}
          locations={[]}
        />
      </MapCanvas>
    </MapDialogShell>
  );
}
