import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { getAbilityById } from "../content/abilities/index.js";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { WORK_DURATION_MS } from "../config/work";
import { openLocation } from "../state/uiSlice";
import { selectLocationId } from "../state/playerSlice";
import { selectWork } from "../state/workSlice";
import { cancelMovement } from "../state/gameThunks";
import { useEffect, useState } from "react";
import travelBg from "../assets/locations/loading/travel.png";

export default function ClickArea() {
  const dispatch = useAppDispatch();
  const selectedLocationId = useAppSelector(selectLocationId);
  const location =
    (LOCATIONS as Record<string, any>)[selectedLocationId] ??
    (LOCATIONS as Record<string, any>)[DEFAULT_LOCATION_ID];
  const stamina = useAppSelector((s) => s.resources.current[location?.requiredResourceId ?? "max_stamina"] ?? 0);
  const work = useAppSelector(selectWork);

  const [progress, setProgress] = useState(0);

  const isWorking = Boolean(work.isWorking);
  const isMoving = isWorking && work.locationId && work.locationId !== selectedLocationId;

  const ability = work.abilityId ? getAbilityById(work.abilityId) : null;
  const workOverlay = (ability as any)?.workOverlay;

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

  const label = location?.name ?? "Unknown";
  const cost = Number(location?.resourceCost ?? 1);
  const timeLabel = isWorking ? `${remainingSeconds.toFixed(1)}s` : stamina < cost ? "No stamina" : "\u00A0";

  return (
    <div className="click-area-wrap">
      <button className="location-title" type="button" onClick={() => dispatch(openLocation(undefined))}>
        {label}
      </button>

      <div className="click-frame" style={{ pointerEvents: "none" }}>
        <div 
          className="click-area click-area--disabled" 
          aria-label="Work area" 
          style={{ 
            pointerEvents: "none",
            backgroundImage: `url(${isMoving ? travelBg : (location?.bg ?? "")})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }} 
        />
        {isWorking && !isMoving && workOverlay && (
          <img src={workOverlay} className="pulse-overlay" alt="" />
        )}
        {isMoving && !work.isReturning && (
          <button
            type="button"
            className="cancel-movement-btn"
            onClick={() => dispatch(cancelMovement())}
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "auto",
              padding: "10px 20px",
              background: "rgba(0, 0, 0, 0.7)",
              border: "1px solid var(--accent)",
              color: "var(--accent-bright)",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
              fontSize: "1rem",
              textTransform: "uppercase"
            }}
          >
            Return
          </button>
        )}
      </div>

      <div className="click-progress-row" aria-hidden="true">
        <div className="click-progress">
          <div className="click-progress__fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
        <div className="click-progress__time">
          {timeLabel}
        </div>
      </div>
    </div>
  );
}
