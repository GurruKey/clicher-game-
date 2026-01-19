import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { CURRENCIES } from "../content/currencies/index.js";
import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { selectDiscoveryByLocationId } from "../state/lootSlice";
import { closeLocation, selectUi } from "../state/uiSlice";
import { buildLocationDropItems } from "../systems/loot/locationDropItems";
import ModalShell from "./ModalShell";
import { selectLocationId } from "../state/playerSlice";
import { moveLocation } from "../state/gameThunks";
import { selectWork } from "../state/workSlice";

export default function LocationDialog() {
  const dispatch = useAppDispatch();
  const currentLocationId = useAppSelector(selectLocationId);
  const work = useAppSelector(selectWork);
  const ui = useAppSelector(selectUi);
  
  // Берем ID локации из стейта UI (какую смотрим) или текущую.
  const displayLocationId = ui.viewedLocationId ?? currentLocationId;

  const location =
    (LOCATIONS as Record<string, any>)[displayLocationId] ??
    (LOCATIONS as Record<string, any>)[DEFAULT_LOCATION_ID];
    
  const discovery = useAppSelector((state) => selectDiscoveryByLocationId(state, displayLocationId));

  // Лут всегда берем из отображаемой локации
  const items = useMemo(() => {
    if (!location?.lootTable) return [];
    return location.lootTable
      .map((loot: any) => {
        const meta = (CURRENCIES as Record<string, any>)[loot.id] ?? null;
        const count = discovery.items[loot.id] ?? 0;
        const isDiscovered = count > 0;

        // Динамический шанс: (количество выпадений этого предмета / общее количество выпадений в локации) * 100
        const observedRate = discovery.total > 0 
          ? (count / discovery.total) * 100 
          : 0;

        return {
          id: loot.id,
          name: isDiscovered ? (meta?.name ?? loot.id) : "???",
          rate: observedRate,
          icon: isDiscovered ? meta?.icon : null,
          rarity: isDiscovered ? (meta?.rarity ?? "common") : "unknown",
          isDiscovered
        };
      })
      // Показываем только то, что игрок уже находил.
      // Неизвестный лут (???) скрыт, чтобы игрок не знал общее количество предметов.
      .filter((item: any) => item.isDiscovered);
  }, [location, discovery]);

  // Мы "здесь", только если ID совпадает И мы не в процессе переезда
  // Работа (сбор/крафт) в текущей локации не считается "переездом"
  const isTraveling = work.isWorking && Boolean(work.fromLocationId);
  const isAtThisLocation = currentLocationId === displayLocationId && !isTraveling;

  const travelInfo = useMemo(() => {
    if (isAtThisLocation) return null;
    
    const currentLoc = (LOCATIONS as any)[currentLocationId];
    const targetLoc = (LOCATIONS as any)[displayLocationId];
    if (!currentLoc || !targetLoc) return null;

    const dx = targetLoc.coords.x - currentLoc.coords.x;
    const dy = targetLoc.coords.y - currentLoc.coords.y;
    const distance = Math.sqrt(dx * dx + dy * dy) * 10;
    
    return {
      distance,
      cost: distance * 10,
      duration: distance * 10
    };
  }, [isAtThisLocation, currentLocationId, displayLocationId]);

  const coordsLabel =
    location?.coords &&
    typeof location.coords.x === "number" &&
    typeof location.coords.y === "number"
      ? `${location.coords.x.toFixed(1)}, ${location.coords.y.toFixed(1)}`
      : null;

  return (
    <ModalShell
      title="Location Info"
      onClose={() => dispatch(closeLocation())}
      backdropClassName="dialog-backdrop--location"
      dialogClassName="location-dialog"
    >
      <div className="location-dialog__header">
        <div className="location-dialog__title">{location?.name ?? "Unknown"}</div>
        {coordsLabel ? <div className="location-dialog__coords">{coordsLabel}</div> : null}
      </div>

      <div className="location-dialog__section-title">Possible Loot</div>
      <div className="location-dialog__list">
        {items.map((item: any) => (
          <div key={item.id} className="location-dialog__row">
            <div className="location-dialog__left">
              {item.icon ? (
                <img
                  src={item.icon}
                  alt=""
                  draggable={false}
                  className="location-dialog__icon"
                />
              ) : (
                <span className="location-dialog__icon" />
              )}
              <span className="location-dialog__name" data-rarity={item.rarity}>
                {item.name}
              </span>
            </div>
            <span className="location-dialog__rate">
              {item.isDiscovered ? `${item.rate.toFixed(1)}%` : "??%"}
            </span>
          </div>
        ))}
      </div>

      <div className="location-dialog__footer">
        {isAtThisLocation ? (
          <div className="location-dialog__current-status">
            <div className="location-dialog__section-title">Status</div>
            <div className="location-dialog__status-text">You are here</div>
          </div>
        ) : (
          <div className="location-dialog__travel">
            <div className="location-dialog__section-title">Travel Info</div>
            {travelInfo && (
              <div className="location-dialog__travel-grid">
                <div className="location-dialog__stat-box">
                  <div className="location-dialog__stat-label">Distance</div>
                  <div className="location-dialog__stat-value">{travelInfo.distance.toFixed(1)} km</div>
                </div>
                <div className="location-dialog__stat-box">
                  <div className="location-dialog__stat-label">Cost</div>
                  <div className="location-dialog__stat-value">{travelInfo.cost.toFixed(2)} Stamina</div>
                </div>
                <div className="location-dialog__stat-box">
                  <div className="location-dialog__stat-label">Time</div>
                  <div className="location-dialog__stat-value">{travelInfo.duration.toFixed(2)}s</div>
                </div>
              </div>
            )}
            <button 
              className="location-dialog__move-btn"
              disabled={work.isWorking}
              onClick={() => {
                 dispatch(moveLocation(displayLocationId));
                 dispatch(closeLocation());
              }}
            >
              {work.isWorking ? "Traveling..." : "Move Here"}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
