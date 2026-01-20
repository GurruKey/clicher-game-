import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_INVENTORY_SLOTS } from "../../../config/inventory";
import { CURRENCIES } from "../../../content/currencies/index.js";
import { canEquipInSlot } from "../../../systems/inventory/equipment/canEquipInSlot";
import {
  dropEquippedOnVisibleSlot,
  dropOnVisibleSlot,
  equipBagFromVisibleIndex,
  equipFromVisibleIndexToSlot
} from "../../../state/inventorySlice";
import { setSkillSlot, setSkillSlot2 } from "../../../state/playerSlice";
import { takeMobLootItem } from "../../../state/combatThunks";
import type { DragCursor, DragHotspot, DragState, StartDragFn, StartDragMeta } from "../types";

type InventorySnapshot = {
  baseSlots: Array<{ id: string; count: number; instanceId?: string } | null>;
  bagSlotsById: Record<string, Array<{ id: string; count: number; instanceId?: string } | null>>;
  equippedBagId: string | null;
  equippedItems: Record<string, { id: string; instanceId?: string } | null>;
};

type VisibleSlot = { id: string; count: number; instanceId?: string } | null;

export function useGameDragAndDrop(args: {
  visibleSlots: VisibleSlot[];
  inventory: InventorySnapshot;
  skillSlots: Array<string | null>;
  skillSlots2: Array<string | null>;
  beforeStartDrag: () => void;
  dispatch: (action: any) => void;
}): {
  drag: DragState;
  dragCursor: DragCursor | null;
  dragIconSrc: string | null;
  dragHotspot: DragHotspot | null;
  startDrag: StartDragFn;
  resetDrag: () => void;
} {
  const { visibleSlots, inventory, skillSlots, skillSlots2, beforeStartDrag, dispatch } = args;
  const [drag, setDrag] = useState<DragState>(null);
  const [dragCursor, setDragCursor] = useState<DragCursor | null>(null);
  const [dragIconSrc, setDragIconSrc] = useState<string | null>(null);
  const [dragHotspot, setDragHotspot] = useState<DragHotspot | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragCaptureElRef = useRef<Element | null>(null);

  const resetDrag = useCallback(() => {
    setDrag(null);
    setDragCursor(null);
    setDragIconSrc(null);
    setDragHotspot(null);
    dragPointerIdRef.current = null;
    dragCaptureElRef.current = null;
  }, []);

  const startDrag = useCallback<StartDragFn>(
    (payload: DragState, iconSrc: string | null, event: { clientX: number; clientY: number }, meta?: StartDragMeta) => {
      beforeStartDrag();
      setDrag(payload);
      setDragCursor({ x: event.clientX, y: event.clientY });
      setDragIconSrc(iconSrc);
      setDragHotspot(meta ? { x: meta.hotspotX, y: meta.hotspotY } : { x: 20, y: 20 });
      dragPointerIdRef.current = meta?.pointerId ?? null;
      dragCaptureElRef.current = meta?.captureEl ?? null;
    },
    [beforeStartDrag]
  );

  const resolveDropTarget = useCallback((x: number, y: number) => {
    const stack = document.elementsFromPoint(x, y) as HTMLElement[];

    for (const candidate of stack) {
      let el: HTMLElement | null = candidate;
      while (el) {
        const kind = el.dataset.dropKind;
        if (kind === "bag") {
          const raw = el.dataset.dropIndex;
          const index = raw ? Number(raw) : NaN;
          return Number.isInteger(index) ? ({ kind: "bag", index } as const) : null;
        }
        if (kind === "equipped") {
          const slotId = el.dataset.dropSlotId;
          return slotId ? ({ kind: "equipped", slotId } as const) : null;
        }
        if (kind === "skill") {
          const raw = el.dataset.dropIndex;
          const index = raw ? Number(raw) : NaN;
          const barRaw = el.dataset.dropBar;
          const barId = barRaw === "2" ? 2 : 1;
          return Number.isInteger(index) ? ({ kind: "skill", index, barId } as const) : null;
        }
        el = el.parentElement;
      }
    }

    return null;
  }, []);

  const handleDropAt = useCallback(
    (x: number, y: number) => {
      if (!drag) {
        resetDrag();
        return;
      }

      const target = resolveDropTarget(x, y);
      if (!target) {
        if (drag.source === "skillSlot") {
          const setSlot = drag.barId === 2 ? setSkillSlot2 : setSkillSlot;
          dispatch(setSlot({ index: drag.index, itemId: null }));
        }
        resetDrag();
        return;
      }

      if (target.kind === "bag") {
        if ((drag as any).source === "mobLoot") {
          dispatch(takeMobLootItem((drag as any).mobLootId));
          resetDrag();
          return;
        }
        if (drag.source === "inventory") {
          if (drag.index !== target.index) {
            dispatch(
              dropOnVisibleSlot({ dragIndex: drag.index, targetIndex: target.index, baseSlotCount: BASE_INVENTORY_SLOTS })
            );
          }
          resetDrag();
          return;
        }

        if (drag.source === "equipped") {
          dispatch(
            dropEquippedOnVisibleSlot({
              slotId: drag.slotId,
              targetIndex: target.index,
              baseSlotCount: BASE_INVENTORY_SLOTS
            })
          );
        }
        resetDrag();
        return;
      }

      if (target.kind === "equipped") {
        if (drag.source !== "inventory") {
          resetDrag();
          return;
        }

        const dragSlot = visibleSlots[drag.index] ?? null;
        const dragItemData = dragSlot ? (CURRENCIES as Record<string, any>)[dragSlot.id] : null;
        if (!dragItemData || !canEquipInSlot(dragItemData, target.slotId)) {
          resetDrag();
          return;
        }

        if (target.slotId === "bag") {
          dispatch(equipBagFromVisibleIndex({ dragIndex: drag.index, baseSlotCount: BASE_INVENTORY_SLOTS }));
          resetDrag();
          return;
        }

        dispatch(
          equipFromVisibleIndexToSlot({ dragIndex: drag.index, baseSlotCount: BASE_INVENTORY_SLOTS, slotId: target.slotId })
        );
        resetDrag();
        return;
      }

      if (target.kind === "skill") {
        const setSlot = target.barId === 2 ? setSkillSlot2 : setSkillSlot;
        if (drag.source === "inventory") {
          const dragSlot = visibleSlots[drag.index] ?? null;
          if (dragSlot?.id) {
            dispatch(setSlot({ index: target.index, itemId: String(dragSlot.id) }));
          }
          resetDrag();
          return;
        }

        if (drag.source === "ability") {
          dispatch(setSlot({ index: target.index, itemId: String(drag.abilityId) }));
          resetDrag();
          return;
        }

        if (drag.source === "skillSlot") {
          if (drag.barId === target.barId && drag.index === target.index) {
            resetDrag();
            return;
          }

          const sourceSet = drag.barId === 2 ? setSkillSlot2 : setSkillSlot;
          const sourceSlots = drag.barId === 2 ? skillSlots2 : skillSlots;
          const targetSlots = target.barId === 2 ? skillSlots2 : skillSlots;

          const targetPrev = (targetSlots as any)?.[target.index] ?? null;
          dispatch(setSlot({ index: target.index, itemId: drag.assignedId }));
          dispatch(sourceSet({ index: drag.index, itemId: targetPrev ? String(targetPrev) : null }));
          resetDrag();
          return;
        }

        const equippedSlot = (inventory as any)?.equippedItems?.[drag.slotId] ?? null;
        if (equippedSlot?.id) {
          dispatch(setSlot({ index: target.index, itemId: String(equippedSlot.id) }));
        }
        resetDrag();
        return;
      }

      resetDrag();
    },
    [dispatch, drag, inventory, resetDrag, resolveDropTarget, skillSlots, skillSlots2, visibleSlots]
  );

  useEffect(() => {
    if (!drag) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "grabbing";

    const handleMove = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      setDragCursor({ x: event.clientX, y: event.clientY });
    };

    const handleUp = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      handleDropAt(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", handleMove, true);
    window.addEventListener("pointerup", handleUp, true);
    window.addEventListener("pointercancel", handleUp, true);

    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      const captureEl = dragCaptureElRef.current;
      const pointerId = dragPointerIdRef.current;
      if (captureEl && pointerId !== null && "releasePointerCapture" in captureEl) {
        try {
          (captureEl as any).releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
      window.removeEventListener("pointermove", handleMove, true);
      window.removeEventListener("pointerup", handleUp, true);
      window.removeEventListener("pointercancel", handleUp, true);
    };
  }, [drag, handleDropAt]);

  return { drag, dragCursor, dragIconSrc, dragHotspot, startDrag, resetDrag };
}
