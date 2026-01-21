import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { BASE_INVENTORY_SLOTS } from "../config/inventory";
import { CURRENCIES } from "../content/currencies/index.js";
import { ABILITIES, getAbilityById } from "../content/abilities/index.js";
import { formatKeybind } from "../content/keybinds";
import { DEFAULT_LOCATION_ID, LOCATIONS } from "../content/locations/index.js";
import { useItemFromVisibleIndex } from "../state/inventoryThunks";
import { useAbility } from "../state/abilitiesThunks";
import { playerAttack } from "../state/combatThunks";
import { selectInventorySnapshot } from "../state/inventorySlice";
import {
  selectAbilityCooldownEndsAtById,
  selectAbilityDelayEndsAtById,
  selectAbilityAutoRepeatEnabledById,
  selectAbilityCastEndsAtById,
  selectAbilityToggledById,
  selectLocationId,
  selectSkillSlots,
  selectSkillSlots2,
  setAbilityAutoRepeatEnabled
} from "../state/playerSlice";
import { selectResourcesCurrent } from "../state/resourcesSlice";
import { selectKeybinds } from "../state/settingsSlice";
import autoRepeatIcon from "../assets/abilities/helpers/auto_repeat.png";
import { getAbilityFrameById } from "../content/abilities/frames/index.js";
import { getActiveAuraModifiers } from "../systems/abilities/auras";

const KEY_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

type DragState = { source: "skillSlot"; barId: 1 | 2; index: number; assignedId: string } | null;

export default function SkillsBar(props: {
  barId: 1 | 2;
  drag: DragState;
  onStartDrag: (
    payload: DragState,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
}) {
  const dispatch = useAppDispatch();
  const skillSlots = useAppSelector(props.barId === 1 ? selectSkillSlots : selectSkillSlots2);
  const keybinds = useAppSelector(selectKeybinds) as any;
  const inventory = useAppSelector(selectInventorySnapshot);
  const delayEndsAtById = useAppSelector(selectAbilityDelayEndsAtById);
  const cooldownEndsAtById = useAppSelector(selectAbilityCooldownEndsAtById);
  const autoRepeatEnabledById = useAppSelector(selectAbilityAutoRepeatEnabledById);
  const castEndsAtById = useAppSelector(selectAbilityCastEndsAtById);
  const toggledById = useAppSelector(selectAbilityToggledById) as Record<string, boolean>;
  const resources = useAppSelector(selectResourcesCurrent);
  const locationId = useAppSelector(selectLocationId);
  const combat = useAppSelector((s) => s.combat);
  const ui = useAppSelector((s) => (s as any).ui);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);

  const pendingRef = useRef<
    | null
    | {
        pointerId: number;
        startX: number;
        startY: number;
        started: boolean;
        barId: 1 | 2;
        index: number;
        assignedId: string;
        icon: string | null;
        captureEl: HTMLButtonElement;
        activate: () => void;
      }
  >(null);

  const visibleSlots = useMemo(() => {
    const activeBagSlots = inventory.equippedBagId ? inventory.bagSlotsById[inventory.equippedBagId] ?? [] : [];
    return [...inventory.baseSlots, ...activeBagSlots];
  }, [inventory.bagSlotsById, inventory.baseSlots, inventory.equippedBagId]);

  const itemIndexById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < visibleSlots.length; i++) {
      const slot = visibleSlots[i];
      if (!slot) continue;
      if (!map.has(slot.id)) map.set(slot.id, i);
    }
    return map;
  }, [visibleSlots]);

  const bar2KeybindLabels = useMemo(() => {
    if (props.barId !== 2) return null;
    const ids = [
      "useSkill2_1",
      "useSkill2_2",
      "useSkill2_3",
      "useSkill2_4",
      "useSkill2_5",
      "useSkill2_6",
      "useSkill2_7",
      "useSkill2_8",
      "useSkill2_9",
      "useSkill2_10"
    ];
    return ids.map((id) => {
      const raw = keybinds?.[id];
      const label = formatKeybind(raw);
      return label === "Unbound" ? "" : label;
    });
  }, [keybinds, props.barId]);

  const auraMods = useMemo(() => {
    return getActiveAuraModifiers({
      abilities: ABILITIES as any[],
      enabledById: (toggledById as any) ?? {}
    });
  }, [toggledById]);

  useEffect(() => {
    const hasAnyTimers =
      Object.keys(delayEndsAtById ?? {}).length > 0 ||
      Object.keys(cooldownEndsAtById ?? {}).length > 0 ||
      Object.keys(castEndsAtById ?? {}).length > 0;
    if (!hasAnyTimers) return;

    const id = window.setInterval(() => setNowMs(Date.now()), 50);
    return () => window.clearInterval(id);
  }, [castEndsAtById, cooldownEndsAtById, delayEndsAtById]);

  useEffect(() => {
    if (ui.skillError && ui.skillError.barId === props.barId) {
      if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
      const index = ui.skillError.index;
      setErrorIndex(index);
      errorTimerRef.current = window.setTimeout(() => setErrorIndex((prev) => (prev === index ? null : prev)), 260);
    }
  }, [ui.skillError, props.barId]);

  useEffect(() => {
    if (ui.skillPress && ui.skillPress.barId === props.barId) {
      const index = ui.skillPress.index;
      setPressedIndex(index);
      const timer = window.setTimeout(() => setPressedIndex((prev) => (prev === index ? null : prev)), 100);
      return () => window.clearTimeout(timer);
    }
  }, [ui.skillPress, props.barId]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, []);

  const beginPending = useCallback(
    (payload: {
      event: React.PointerEvent<HTMLButtonElement>;
      captureEl: HTMLButtonElement;
      barId: 1 | 2;
      index: number;
      assignedId: string;
      icon: string | null;
      activate: () => void;
    }) => {
      const { event, captureEl, barId, index, assignedId, icon, activate } = payload;
      pendingRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
        barId,
        index,
        assignedId,
        icon,
        captureEl,
        activate
      };

      const DRAG_THRESHOLD_PX = 7;

      const onMove = (moveEvent: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending) return;
        if (moveEvent.pointerId !== pending.pointerId) return;
        if (pending.started) return;

        const dx = moveEvent.clientX - pending.startX;
        const dy = moveEvent.clientY - pending.startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

        pending.started = true;

        const iconEl = pending.captureEl.querySelector(".bag-slot__icon") as HTMLImageElement | null;
        const hotspotBase = 40;
        if (iconEl) {
          const rect = iconEl.getBoundingClientRect();
          const hotspotX = rect.width > 0 ? ((moveEvent.clientX - rect.left) / rect.width) * hotspotBase : hotspotBase / 2;
          const hotspotY = rect.height > 0 ? ((moveEvent.clientY - rect.top) / rect.height) * hotspotBase : hotspotBase / 2;
          props.onStartDrag(
            { source: "skillSlot", barId: pending.barId, index: pending.index, assignedId: pending.assignedId },
            pending.icon,
            moveEvent,
            {
              hotspotX: Math.max(0, Math.min(hotspotBase, hotspotX)),
              hotspotY: Math.max(0, Math.min(hotspotBase, hotspotY)),
              pointerId: pending.pointerId,
              captureEl: pending.captureEl
            }
          );
        } else {
          props.onStartDrag(
            { source: "skillSlot", barId: pending.barId, index: pending.index, assignedId: pending.assignedId },
            pending.icon,
            moveEvent,
            { hotspotX: hotspotBase / 2, hotspotY: hotspotBase / 2, pointerId: pending.pointerId, captureEl: pending.captureEl }
          );
        }

        moveEvent.preventDefault();
        moveEvent.stopPropagation();
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove, true);
        window.removeEventListener("pointerup", onUp, true);
        window.removeEventListener("pointercancel", onUp, true);
        pendingRef.current = null;
        setPressedIndex(null);
      };

      const onUp = (upEvent: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending) return;
        if (upEvent.pointerId !== pending.pointerId) return;

        if (!pending.started) {
          pending.activate();
          upEvent.preventDefault();
          upEvent.stopPropagation();
        }

        cleanup();
      };

      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onUp, true);
    },
    [props]
  );

  return (
    <aside
      className={`skills-bar ${props.barId === 1 ? "skills-bar--primary" : "skills-bar--secondary"}`}
      aria-label={props.barId === 1 ? "Skills bar" : "Skills bar 2"}
    >
      <div className="skills-bar__grid">
        {Array.from({ length: 10 }, (_v, index) => {
          const assignedItemId = skillSlots?.[index] ?? null;
          const inventoryIndex =
            assignedItemId && itemIndexById.has(assignedItemId) ? (itemIndexById.get(assignedItemId) as number) : null;
          const inventorySlot = inventoryIndex !== null ? visibleSlots[inventoryIndex] ?? null : null;
          const itemMeta = assignedItemId ? (CURRENCIES as Record<string, any>)[assignedItemId] ?? null : null;
          const abilityMeta = assignedItemId && !itemMeta ? (getAbilityById(assignedItemId) as any) : null;
          const icon = itemMeta?.icon
            ? String(itemMeta.icon)
            : abilityMeta?.icon
              ? String(abilityMeta.icon)
              : null;

          const maxStackRaw = itemMeta?.maxStack;
          const maxStack = Number(maxStackRaw);
          const canStack = Number.isFinite(maxStack) ? maxStack > 1 : false;
          const count = Number(inventorySlot?.count ?? 0);
          const showCount = canStack && Number.isFinite(count) && count > 1;

          const keyLabel = KEY_LABELS[index] ?? String(index + 1);
          const showKey = props.barId === 1;
          const bar2Label = props.barId === 2 ? String(bar2KeybindLabels?.[index] ?? "") : "";

          const delayEndsAtMs = abilityMeta ? Number((delayEndsAtById as any)?.[abilityMeta.id] ?? 0) : 0;
          const cooldownEndsAtMs = abilityMeta ? Number((cooldownEndsAtById as any)?.[abilityMeta.id] ?? 0) : 0;
          const delayTotalMs = abilityMeta ? Math.max(0, Number((abilityMeta as any).useDelayMs ?? 0)) : 0;
          const cooldownTotalMs = abilityMeta ? Math.max(0, Number((abilityMeta as any).cooldownMs ?? 0)) : 0;
          const delayRemainingMs = delayTotalMs > 0 ? Math.max(0, delayEndsAtMs - nowMs) : 0;
          const cooldownRemainingMs = cooldownTotalMs > 0 ? Math.max(0, cooldownEndsAtMs - nowMs) : 0;
          const delayPct =
            delayTotalMs > 0 ? Math.min(100, Math.max(0, (delayRemainingMs / delayTotalMs) * 100)) : 0;
          const cooldownPct =
            cooldownTotalMs > 0 ? Math.min(100, Math.max(0, (cooldownRemainingMs / cooldownTotalMs) * 100)) : 0;

          const frame = abilityMeta?.frame ? String(abilityMeta.frame) : undefined;
          const frameDef = frame ? getAbilityFrameById(frame) : null;
          const frameStyle =
            frameDef && (frameDef.borderColor || frameDef.glowColor)
              ? ({
                  ["--ability-frame-border" as any]: frameDef.borderColor ?? undefined,
                  ["--ability-frame-glow" as any]: frameDef.glowColor ?? undefined
                } as any)
              : undefined;

          const isAura = Boolean(abilityMeta && (abilityMeta as any).kind === "aura" && (abilityMeta as any).toggle);
          const isAuraActive = isAura ? Boolean((toggledById as any)?.[String((abilityMeta as any).id)]) : false;
          const canAutoRepeat = Boolean((abilityMeta as any)?.autoRepeat);
          const autoRepeatEnabled = canAutoRepeat ? Boolean((autoRepeatEnabledById as any)?.[abilityMeta.id]) : false;
          const isDraggingThis =
            props.drag?.source === "skillSlot" && props.drag.barId === props.barId && props.drag.index === index;

          const castEndsAtMs = abilityMeta ? Number((castEndsAtById as any)?.[abilityMeta.id] ?? 0) : 0;
          const castTotalMs = abilityMeta ? Math.max(0, Number((abilityMeta as any).castTimeMs ?? 0)) : 0;
          const castRemainingMs = castTotalMs > 0 ? Math.max(0, castEndsAtMs - nowMs) : 0;
          const castPct =
            castTotalMs > 0 ? Math.min(100, Math.max(0, (castRemainingMs / castTotalMs) * 100)) : 0;

          const isCombatActive = combat.status === "fighting";

          const canUseNow =
            !abilityMeta ||
            (() => {
              if (isCombatActive && !abilityMeta.isCombat) return false;
              if (!isCombatActive && abilityMeta.isCombat) return false;

              const kind = String((abilityMeta as any)?.kind ?? "");
              const isAuraToggle = kind === "aura" && Boolean((abilityMeta as any)?.toggle);
              const isAuraEnabled = isAuraToggle ? Boolean((toggledById as any)?.[String(abilityMeta.id)]) : false;

              if (isAuraToggle && isAuraEnabled) return true;

              const manaCost = Math.max(0, Number((abilityMeta as any)?.manaCost ?? 0));
              if (manaCost > 0) {
                const currentMana = Number((resources as any)?.max_mana ?? 0);
                return Number.isFinite(currentMana) && currentMana >= manaCost;
              }

              if (kind === "collecting") {
                const locId = locationId ?? DEFAULT_LOCATION_ID;
                const loc = (LOCATIONS as Record<string, any>)[locId] ?? null;
                const resourceId: string = String(loc?.requiredResourceId || "max_stamina");
                const baseCost = Number(loc?.resourceCost ?? 1);
                if (!Number.isFinite(baseCost) || baseCost <= 0) return false;
                const cost =
                  resourceId === "max_stamina"
                    ? Math.max(0, baseCost * Number(auraMods.staminaCostMultiplier ?? 1))
                    : baseCost;
                const current = Number((resources as any)?.[resourceId] ?? 0);
                return Number.isFinite(current) && current >= cost;
              }

              return true;
            })();

          const activate = () => {
            if (isCombatActive && abilityMeta?.isCombat && abilityMeta.kind === "combat_attack") {
              dispatch(playerAttack(String(abilityMeta.id)));
              return;
            }

            if (inventoryIndex !== null) {
              if (isCombatActive) return; // Block inventory in combat for now
              dispatch(useItemFromVisibleIndex({ slotIndex: inventoryIndex, baseSlotCount: BASE_INVENTORY_SLOTS }));
              return;
            }
            if (abilityMeta) {
              if (!canUseNow) {
                if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
                setErrorIndex(index);
                errorTimerRef.current = window.setTimeout(() => setErrorIndex((prev) => (prev === index ? null : prev)), 260);
                return;
              }
              if (canAutoRepeat) {
                const next = !autoRepeatEnabled;
                dispatch(setAbilityAutoRepeatEnabled({ abilityId: String(abilityMeta.id), enabled: next }));
                if (next) dispatch(useAbility({ abilityId: String(abilityMeta.id) }));
                return;
              }
              dispatch(useAbility({ abilityId: String(abilityMeta.id) }));
            }
          };

          return (
            <button
              key={index}
              type="button"
              className={`bag-slot${icon ? " bag-slot--filled" : " bag-slot--empty"} bag-slot--base skills-bar__slot`}
              data-drop-kind="skill"
              data-drop-index={index}
              data-drop-bar={props.barId}
              data-frame={frame}
              style={frameStyle}
              data-aura={isAura ? "true" : "false"}
              data-aura-active={isAuraActive ? "true" : "false"}
              data-dragging={isDraggingThis ? "true" : "false"}
              data-pressed={pressedIndex === index ? "true" : "false"}
              data-error={errorIndex === index ? "true" : "false"}
              aria-label={`Skill slot ${keyLabel}`}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                if (!assignedItemId) return;

                setPressedIndex(index);
                event.currentTarget.setPointerCapture(event.pointerId);
                beginPending({
                  event,
                  captureEl: event.currentTarget,
                  barId: props.barId,
                  index,
                  assignedId: String(assignedItemId),
                  icon,
                  activate: () => {
                    activate();
                    setPressedIndex((prev) => (prev === index ? null : prev));
                  }
                });
                event.preventDefault(); // prevent native click; we'll decide click vs drag on pointerup
              }}
              onPointerUp={() => setPressedIndex((prev) => (prev === index ? null : prev))}
              onPointerCancel={() => setPressedIndex((prev) => (prev === index ? null : prev))}
            >
              {icon ? <img className="bag-slot__icon" src={icon} alt="" draggable={false} /> : null}
              {showCount ? <span className="bag-slot__count">{String(count)}</span> : null}
              {showKey ? <span className="skills-bar__key">{keyLabel}</span> : null}
              {bar2Label ? <span className="skills-bar__key">{bar2Label}</span> : null}
              {canAutoRepeat ? (
                <img
                  className={`skills-bar__auto${autoRepeatEnabled ? " skills-bar__auto--active" : ""}`}
                  src={autoRepeatIcon}
                  alt="Auto-repeat"
                  draggable={false}
                />
              ) : null}
              {abilityMeta && castRemainingMs > 0 ? (
                <span
                  className="skills-bar__cast"
                  aria-hidden="true"
                  style={{ ["--skill-cast" as any]: `${castPct}%` }}
                >
                  <span className="skills-bar__cast-fill" />
                </span>
              ) : null}
              {abilityMeta && (delayRemainingMs > 0 || cooldownRemainingMs > 0) ? (
                <span className="skills-bar__timers" aria-hidden="true">
                  {delayTotalMs > 0 ? (
                    <span className="skills-bar__timer" style={{ ["--skill-timer" as any]: `${delayPct}%` }}>
                      <span className="skills-bar__timer-fill" />
                    </span>
                  ) : null}
                  {cooldownTotalMs > 0 ? (
                    <span
                      className="skills-bar__timer skills-bar__timer--cooldown"
                      style={{ ["--skill-timer" as any]: `${cooldownPct}%` }}
                    >
                      <span className="skills-bar__timer-fill" />
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
