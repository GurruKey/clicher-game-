export type DragState =
  | { source: "inventory"; index: number }
  | { source: "equipped"; slotId: string }
  | { source: "ability"; abilityId: string }
  | { source: "skillSlot"; barId: 1 | 2; index: number; assignedId: string }
  | null;

export type DragCursor = { x: number; y: number };
export type DragHotspot = { x: number; y: number };

export type StartDragMeta = {
  hotspotX: number;
  hotspotY: number;
  pointerId: number;
  captureEl: Element;
};

export type StartDragFn = (
  payload: DragState,
  iconSrc: string | null,
  event: { clientX: number; clientY: number },
  meta?: StartDragMeta
) => void;

