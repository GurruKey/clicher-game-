import { useMemo } from "react";
import { ABILITIES } from "../content/abilities/index.js";
import { getAbilityFrameById } from "../content/abilities/frames/index.js";
import autoRepeatIcon from "../assets/abilities/helpers/auto_repeat.png";
import { createPortal } from "react-dom";

type DragState = { source: "ability"; abilityId: string } | null;

export default function AbilitiesPanel(props: {
  drag: DragState;
  knownAbilityIds: string[];
  onStartDrag: (
    payload: DragState,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
}) {
  const abilities = useMemo(() => {
    const known = new Set((props.knownAbilityIds ?? []).filter((id) => typeof id === "string" && id.length > 0));
    return (ABILITIES as any[]).filter((a) => a && typeof a.id === "string" && known.has(a.id));
  }, [props.knownAbilityIds]);

  return createPortal(
    <aside className="abilities-panel" aria-label="Abilities">
      <div className="abilities-panel__header">
        <span>Abilities</span>
      </div>

      {abilities.length === 0 ? (
        <p className="dialog__hint">No abilities.</p>
      ) : (
        <div className="abilities-panel__body">
          <div className="abilities-panel__grid">
            {abilities.map((ability) => {
              const isDragging = props.drag?.source === "ability" && props.drag.abilityId === ability.id;
              const frame = ability?.frame ? String(ability.frame) : undefined;
              const frameDef = frame ? getAbilityFrameById(frame) : null;
              const frameStyle =
                frameDef && (frameDef.borderColor || frameDef.glowColor)
                  ? ({
                      ["--ability-frame-border" as any]: frameDef.borderColor ?? undefined,
                      ["--ability-frame-glow" as any]: frameDef.glowColor ?? undefined
                    } as any)
                  : undefined;
              return (
                <div key={ability.id} className="abilities-panel__entry" data-dragging={isDragging ? "true" : "false"}>
                  <button
                    type="button"
                    className="bag-slot bag-slot--filled bag-slot--base skills-bar__slot abilities-panel__slot abilities-panel__drag-handle"
                    data-dragging={isDragging ? "true" : "false"}
                    data-frame={frame}
                    style={frameStyle}
                    aria-label={`Drag ability ${ability.name}`}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      const iconEl = (event.currentTarget as HTMLButtonElement).querySelector(
                        ".abilities-panel__icon"
                      ) as HTMLImageElement | null;

                      event.currentTarget.setPointerCapture(event.pointerId);

                      if (iconEl) {
                        const rect = iconEl.getBoundingClientRect();
                        const hotspotX = rect.width > 0 ? ((event.clientX - rect.left) / rect.width) * 40 : 20;
                        const hotspotY = rect.height > 0 ? ((event.clientY - rect.top) / rect.height) * 40 : 20;
                        props.onStartDrag(
                          { source: "ability", abilityId: String(ability.id) },
                          ability?.icon ? String(ability.icon) : null,
                          event,
                          {
                            hotspotX: Math.max(0, Math.min(40, hotspotX)),
                            hotspotY: Math.max(0, Math.min(40, hotspotY)),
                            pointerId: event.pointerId,
                            captureEl: event.currentTarget
                          }
                        );
                      } else {
                        props.onStartDrag(
                          { source: "ability", abilityId: String(ability.id) },
                          ability?.icon ? String(ability.icon) : null,
                          event,
                          { hotspotX: 20, hotspotY: 20, pointerId: event.pointerId, captureEl: event.currentTarget }
                        );
                      }
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    {ability?.icon ? (
                      <img className="bag-slot__icon abilities-panel__icon" src={ability.icon} alt="" draggable={false} />
                    ) : null}
                    {ability?.autoRepeat ? (
                      <img className="skills-bar__auto" src={autoRepeatIcon} alt="Auto-repeat" draggable={false} />
                    ) : null}
                  </button>
                  <span className="abilities-panel__name">{ability.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>,
    document.body
  );
}
