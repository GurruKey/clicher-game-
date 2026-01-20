import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { CURRENCIES } from "../content/currencies/index.js";
import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { selectDiscoveryByLocationId, selectKnownItemIds } from "../state/lootSlice";
import { closeLocation, selectUi } from "../state/uiSlice";
import { buildLocationDropItems } from "../systems/loot/locationDropItems";
import ModalShell from "./ModalShell";
import { selectLocationId } from "../state/playerSlice";
import { moveLocation } from "../state/gameThunks";
import { selectWork } from "../state/workSlice";
import { MOBS, getMobById } from "../content/entities/index.js";
import { useState } from "react";

export default function LocationDialog() {
  const dispatch = useAppDispatch();
  const [expandedMobId, setExpandedMobId] = useState<string | null>(null);
  const currentLocationId = useAppSelector(selectLocationId);
  const work = useAppSelector(selectWork);
  const ui = useAppSelector(selectUi);
  
  // Берем ID локации из стейта UI (какую смотрим) или текущую.
  const displayLocationId = ui.viewedLocationId ?? currentLocationId;

  const location =
    (LOCATIONS as Record<string, any>)[displayLocationId] ??
    (LOCATIONS as Record<string, any>)[DEFAULT_LOCATION_ID];
    
  const discovery = useAppSelector((state) => selectDiscoveryByLocationId(state, displayLocationId));
  const knownItemIds = useAppSelector(selectKnownItemIds);

  // Лут всегда берем из отображаемой локации
  const items = useMemo(() => {
    if (!location?.lootTable) return [];
    
    // Use isolated location stats
    const stats = discovery.location;
    
    // New logic: Divide by "Safe Attempts" (Total - Encounters).
    // This represents the chance to find the item WHEN we didn't get interrupted by a fight.
    const totalEncounters = Object.values(discovery.encounters).reduce((acc: number, val: number) => acc + val, 0);
    const safeAttempts = Math.max(1, discovery.totalAttempts - totalEncounters);

    return location.lootTable
      .map((loot: any) => {
        const meta = (CURRENCIES as Record<string, any>)[loot.id] ?? null;
        const count = stats.items[loot.id] ?? 0;
        // Visibility depends on "Known" status (picked up at least once)
        const isDiscovered = knownItemIds.includes(loot.id);

        // Isolated dynamic rate relative to safe attempts
        // Chance: (Found Count / Safe Attempts) * 100
        const observedRate = Math.min(100, (count / safeAttempts) * 100);

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
  }, [location, discovery, knownItemIds]);

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

  const mobStats = useMemo(() => {
    if (displayLocationId !== "testing_grounds") return [];
    
    const mobsInLocation = [MOBS.rat];
    const result: any[] = [];
    
    for (const mobDef of mobsInLocation) {
      if (!mobDef) continue;
      
      const encounterCount = discovery.encounters[mobDef.id] ?? 0;
      const isMet = encounterCount > 0;
      if (!isMet) continue;

      // 1. Mob appearance rate
      const appearanceRate = discovery.totalAttempts > 0 
        ? (encounterCount / discovery.totalAttempts) * 100 
        : 0;

      const mobLootItems: any[] = [];
      
      // 2. Isolated Mob Loot rates (Independent probability)
      // We look at discovery.mobDrops[mobDef.id] which stores accurate drop counts for THIS mob
      const specificMobDrops = discovery.mobDrops?.[mobDef.id]?.items ?? {};
      
      for (const drop of mobDef.drops) {
        const meta = (CURRENCIES as Record<string, any>)[drop.id] ?? null;
        
        // We fall back to global mob stats for legacy saves if specific stats are missing
        const foundCount = specificMobDrops[drop.id] ?? discovery.mobs.items[drop.id] ?? 0;
        
        // Visibility depends on "Known" status
        const isKnown = knownItemIds.includes(drop.id);
        if (!isKnown) continue;

        // Rate: (Times dropped / Total encounters with THIS mob) * 100
        // Since drops are independent, we don't divide by "total items dropped", but by encounters (kills).
        // This correctly reflects e.g. "50% chance to get a tail" regardless of other items.
        const observedRate = Math.min(100, (foundCount / encounterCount) * 100);
        
        mobLootItems.push({
          id: drop.id,
          name: meta?.name ?? drop.id,
          rate: observedRate,
          icon: meta?.icon ?? null,
          rarity: meta?.rarity ?? "common"
        });
      }

      result.push({
        id: mobDef.id,
        name: mobDef.name,
        appearanceRate,
        loot: mobLootItems
      });
    }
    return result;
  }, [displayLocationId, discovery, knownItemIds]);

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

      {mobStats.length > 0 && (
        <>
          <div className="location-dialog__section-title" style={{ marginTop: "1.5rem" }}>Local Mobs</div>
          {mobStats.map((mob: any) => (
            <div key={mob.id} className="location-dialog__mob-section" style={{ marginBottom: "0.5rem" }}>
              <button 
                className="location-dialog__row" 
                style={{ 
                  width: "100%", 
                  background: "rgba(255,255,255,0.05)", 
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
                onClick={() => setExpandedMobId(expandedMobId === mob.id ? null : mob.id)}
              >
                 <span className="location-dialog__name" style={{ fontWeight: "bold" }}>{mob.name}</span>
                 <span className="location-dialog__rate" style={{ fontSize: "0.8rem", color: "var(--accent-bright)" }}>
                    ~{mob.appearanceRate.toFixed(1)}% appearance
                 </span>
              </button>
              
              {expandedMobId === mob.id && (
                <div className="location-dialog__list" style={{ paddingLeft: "10px", marginTop: "5px", background: "rgba(0,0,0,0.2)", borderRadius: "0 0 4px 4px" }}>
                  {mob.loot.length > 0 ? (
                    mob.loot.map((item: any) => (
                      <div key={item.id} className="location-dialog__row" style={{ padding: "4px 8px" }}>
                        <div className="location-dialog__left">
                          {item.icon ? (
                            <img src={item.icon} alt="" draggable={false} className="location-dialog__icon" style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <span className="location-dialog__icon" style={{ width: "16px" }} />
                          )}
                          <span className="location-dialog__name" data-rarity={item.rarity} style={{ fontSize: "0.9rem" }}>
                            {item.name}
                          </span>
                        </div>
                        <span className="location-dialog__rate" style={{ fontSize: "0.8rem" }}>
                          {item.rate.toFixed(1)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px", fontSize: "0.8rem", opacity: 0.5 }}>No loot discovered yet</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

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
