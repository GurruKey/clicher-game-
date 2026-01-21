import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { getAbilityById } from "../content/abilities/index.js";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { getMobById } from "../content/entities/index.js";
import { WORK_DURATION_MS } from "../config/work";
import { openLocation } from "../state/uiSlice";
import { selectLocationId } from "../state/playerSlice";
import { selectWork } from "../state/workSlice";
import { cancelMovement } from "../state/gameThunks";
import { escapeCombat, mobAttack, takeMobLootItem } from "../state/combatThunks";
import { CURRENCIES } from "../content/currencies/index.js";
import useContextMenu from "../hooks/menus/useContextMenu";
import { useEffect, useMemo, useState } from "react";
import travelBg from "../assets/locations/loading/travel.png";

export default function ClickArea(props: {
  onStartDrag?: (
    payload: any,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
}) {
  const dispatch = useAppDispatch();
  const selectedLocationId = useAppSelector(selectLocationId);
  const location =
    (LOCATIONS as Record<string, any>)[selectedLocationId] ??
    (LOCATIONS as Record<string, any>)[DEFAULT_LOCATION_ID];
  const stamina = useAppSelector((s) => s.resources.current[location?.requiredResourceId ?? "max_stamina"] ?? 0);
  const work = useAppSelector(selectWork);
  const combat = useAppSelector((s) => s.combat);

  const [progress, setProgress] = useState(0);

  const isWorking = Boolean(work.isWorking);
  const isMoving = isWorking && work.locationId && work.locationId !== selectedLocationId;
  const isCombat = combat.status === "fighting" || combat.status === "victory" || combat.status === "defeat";
  const [isLootOpen, setIsLootOpen] = useState(false);

  const { openContextMenu } = useContextMenu();

  const targetLocation = isMoving ? (LOCATIONS as Record<string, any>)[work.locationId!] : null;
  const combatMob = useMemo(() => combat.mobId ? getMobById(combat.mobId) : null, [combat.mobId]);

  const maxRarity = useMemo(() => {
    if (!combat.loot || combat.loot.length === 0) return "common";
    const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
    let maxIdx = 0;
    for (const item of combat.loot) {
      const idx = rarities.indexOf(item.rarity);
      if (idx > maxIdx) maxIdx = idx;
    }
    return rarities[maxIdx];
  }, [combat.loot]);

  const glowColor = useMemo(() => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--rarity-${maxRarity}`).trim() || "gold";
  }, [maxRarity]);
  
  const ability = work.abilityId ? getAbilityById(work.abilityId) : null;
  const workOverlay = (ability as any)?.workOverlay;

  useEffect(() => {
    if (combat.status !== "fighting") {
      setIsLootOpen(false);
      return;
    }
    const timer = setInterval(() => {
      dispatch(mobAttack());
    }, 2000);
    return () => clearInterval(timer);
  }, [combat.status, dispatch]);

  // Auto-close loot window when empty
  useEffect(() => {
    if (combat.loot.length === 0) {
      setIsLootOpen(false);
    }
  }, [combat.loot]);

  const durationMs = isWorking
    ? Math.max(0, Number(work.durationMs ?? 0))
    : Math.max(0, Number(location?.workDurationMs ?? WORK_DURATION_MS));
  const remainingSeconds = (() => {
    if (!isWorking || !work.startedAtMs) return 0;
    const elapsedMs = Date.now() - work.startedAtMs;
    return Math.max(0, (Math.max(0, durationMs - elapsedMs)) / 1000);
  })();

  useEffect(() => {
    if (!isWorking || !work.startedAtMs) {
      setProgress(0);
      return;
    }

    let rafId = 0;
    const tick = () => {
      const elapsedMs = Date.now() - work.startedAtMs!;
      const ratio = durationMs > 0 ? Math.min(1, Math.max(0, elapsedMs / durationMs)) : 1;
      setProgress(ratio);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, isWorking, work.startedAtMs]);

  const label = isMoving 
    ? `TRAVELING TO ${targetLocation?.name ?? "..."}` 
    : isCombat
    ? `FIGHTING ${combatMob?.name ?? "..."}`
    : (location?.name ?? "Unknown");
  const cost = Number(location?.resourceCost ?? 1);
  const timeLabel = isWorking ? `${remainingSeconds.toFixed(1)}s` : stamina < cost ? "No stamina" : "\u00A0";

  return (
    <div className="click-area-wrap">
      <button
        className={`location-title${isMoving ? " location-title--disabled" : ""}`}
        type="button"
        onClick={() => !isMoving && dispatch(openLocation(undefined))}
      >
        {label}
      </button>

      <div className="click-frame">
        <div 
          className="click-area click-area--disabled click-area--background" 
          aria-label="Work area" 
          style={{ 
            pointerEvents: "none",
            ["--click-area-bg" as any]: `url(${isMoving ? travelBg : (isCombat ? (combatMob as any)?.bg : (location?.bg ?? ""))})`
          }} 
        />
        {isCombat && combatMob && (
          <div 
            className={`combat-mob-wrap ${
              combat.status === "victory" 
                ? (combat.loot.length > 0 ? "mob--dead mob-loot-glow" : "mob--dead") 
                : ""
            } ${
              combat.lastHitType === "player" && Date.now() - combat.lastHitAt < 200 ? "shake" : ""
            } ${
              combat.lastHitType === "mob" && Date.now() - combat.lastHitAt < 300 ? "mob-attack-jump" : ""
            }`}
            style={{
              ["--loot-glow" as any]: glowColor
            } as any}
            onClick={() => combat.status === "victory" && setIsLootOpen((prev) => !prev)}
          >
            <img 
              src={(combatMob as any).icon} 
              alt="" 
              className="combat-mob__icon"
              draggable={false}
            />
            {combat.lastHitType === "player" && Date.now() - combat.lastHitAt < 200 && (
              <img 
                src={getAbilityById("basic_attack")?.icon}
                alt=""
                className="combat-hit-icon"
              />
            )}
            {combat.status === "fighting" && (
              <div
                className="mob-hp-bar"
                style={{ ["--mob-hp" as any]: `${(combat.currentMobHealth / combat.maxMobHealth) * 100}%` }}
              >
                <div
                  className="mob-hp-fill"
                />
                <div className="mob-hp-text">
                  {Math.ceil(combat.currentMobHealth)} / {combat.maxMobHealth}
                </div>
              </div>
            )}
            {combat.status === "defeat" && (
              <div className="combat-defeat-text">DEFEAT</div>
            )}
          </div>
        )}
        {isLootOpen && combat.status === "victory" && combat.loot.length > 0 && (
          <div className="mob-loot-overlay">
            <div className="mob-loot-grid">
              {combat.loot.map(item => {
                const meta = (CURRENCIES as any)[item.itemId];
                const icon = meta?.icon ?? null;
                return (
                  <button 
                    key={item.id}
                    className="bag-slot bag-slot--filled"
                    data-rarity={item.rarity}
                    onClick={() => dispatch(takeMobLootItem(item.id))}
                    onContextMenu={(e) => {
                      openContextMenu(e, {
                        items: [{ label: "Take", onClick: () => dispatch(takeMobLootItem(item.id)) }]
                      });
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return; // Only left click for drag
                      const hotspotBase = 40;
                      if (props.onStartDrag) {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        props.onStartDrag(
                          {
                            source: "mobLoot",
                            mobLootId: item.id,
                            itemId: item.itemId,
                            count: item.amount
                          } as any,
                          icon,
                          e,
                          {
                            hotspotX: hotspotBase / 2,
                            hotspotY: hotspotBase / 2,
                            pointerId: e.pointerId,
                            captureEl: e.currentTarget
                          }
                        );
                      }
                    }}
                  >
                    {icon && <img src={icon} className="bag-slot__icon" alt="" draggable={false} />}
                    {item.amount > 1 && <span className="bag-slot__count">{item.amount}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {isWorking && !isMoving && workOverlay && (
          <img src={workOverlay} className="pulse-overlay" alt="" />
        )}
        {isMoving && !work.isReturning && (
          <button
            type="button"
            className="cancel-movement-btn"
            onClick={() => dispatch(cancelMovement())}
          >
            Return
          </button>
        )}
        {(combat.status === "fighting" || combat.status === "victory") && (
          <button
            type="button"
            className={[
              "cancel-movement-btn",
              combat.status === "victory" ? "cancel-movement-btn--victory" : "cancel-movement-btn--escape"
            ].join(" ")}
            onClick={() => dispatch(escapeCombat())}
          >
            {combat.status === "victory" ? "Continue" : "Escape"}
          </button>
        )}
      </div>

      <div className="click-progress-row" aria-hidden="true">
        <div className="click-progress" style={{ ["--click-progress" as any]: `${Math.min(100, Math.max(0, progress * 100))}%` }}>
          <div className="click-progress__fill" />
        </div>
        <div className="click-progress__time">
          {timeLabel}
        </div>
      </div>
    </div>
  );
}
