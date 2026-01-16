import { useMemo } from "react";
import { useAppSelector } from "../app/hooks";
import { BASE_INVENTORY_SLOTS } from "../config/inventory";
import { CURRENCIES } from "../content/currencies/index.js";
import { selectInventorySnapshot } from "../state/inventorySlice";
import { canEquipInSlot } from "../systems/inventory/equipment/canEquipInSlot";
import { resolveTargetSlot } from "../systems/inventory/equipment/resolveTargetSlot";
import type { TooltipState } from "../hooks/ui/useTooltip";
import type { InventoryContextMenuData } from "./ContextMenu";

type DragState =
  | { source: "inventory"; index: number }
  | { source: "equipped"; slotId: string }
  | null;

export default function InventoryPanel(props: {
  drag: DragState;
  onStartDrag: (
    payload: DragState,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
  tooltip: TooltipState;
  onTooltipShow: (event: { clientX: number; clientY: number }, text: string, rarity?: string) => void;
  onTooltipMove: (event: { clientX: number; clientY: number }) => void;
  onTooltipHide: () => void;
  onOpenContextMenu: (
    event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
    payload: InventoryContextMenuData
  ) => void;
}) {
  const inventory = useAppSelector(selectInventorySnapshot);

  const dragIndex = props.drag?.source === "inventory" ? props.drag.index : null;

  const activeBagSlots = inventory.equippedBagId ? inventory.bagSlotsById[inventory.equippedBagId] ?? [] : [];
  const visibleSlots = useMemo(() => [...inventory.baseSlots, ...activeBagSlots], [inventory.baseSlots, activeBagSlots]);
  const slotCount = visibleSlots.length;

  const displayOrder = useMemo(() => {
    const bagSlotCount = Math.max(0, slotCount - BASE_INVENTORY_SLOTS);
    return [
      ...Array.from({ length: bagSlotCount }, (_, index) => BASE_INVENTORY_SLOTS + index),
      ...Array.from({ length: Math.min(BASE_INVENTORY_SLOTS, slotCount) }, (_, index) => index)
    ];
  }, [slotCount]);

  return (
    <aside className="bag__panel">
      <div className="bag__header">
        <span>Bag</span>
      </div>
      <div className="bag__grid">
        {displayOrder.map((slotIndex) => {
          const slot = visibleSlots[slotIndex] ?? null;
          const isBase = slotIndex < BASE_INVENTORY_SLOTS;
          const isDragging = props.drag?.source === "inventory" && slotIndex === dragIndex;
          const item = slot ? (CURRENCIES as Record<string, any>)[slot.id] : null;

          const canDropEquippedHere = (() => {
            if (props.drag?.source !== "equipped") return false;
            if (!props.drag.slotId) return false;
            if (!slot) return true;
            const targetData = (CURRENCIES as Record<string, any>)[slot.id] ?? null;
            return canEquipInSlot(targetData, props.drag.slotId);
          })();

          if (!slot) {
            return (
              <div
                key={`empty-${slotIndex}`}
                className={`bag-slot bag-slot--empty${isBase ? " bag-slot--base" : ""}`}
                data-drop-kind="bag"
                data-drop-index={slotIndex}
                style={{
                  boxShadow: canDropEquippedHere ? "0 0 0 2px rgba(255,255,255,0.15) inset" : undefined
                }}
              />
            );
          }

          return (
            <button
              key={`${slot.id}-${slotIndex}`}
              className={`bag-slot bag-slot--filled${isBase ? " bag-slot--base" : ""}`}
              type="button"
              data-dragging={isDragging ? "true" : "false"}
              data-drop-kind="bag"
              data-drop-index={slotIndex}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                props.onTooltipHide();

                const iconEl = (event.currentTarget as HTMLButtonElement).querySelector(".bag-slot__icon") as
                  | HTMLImageElement
                  | null;
                if (iconEl) {
                  const rect = iconEl.getBoundingClientRect();
                  const hotspotX = rect.width > 0 ? ((event.clientX - rect.left) / rect.width) * 40 : 20;
                  const hotspotY = rect.height > 0 ? ((event.clientY - rect.top) / rect.height) * 40 : 20;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  props.onStartDrag(
                    { source: "inventory", index: slotIndex },
                    item?.icon ? String(item.icon) : null,
                    event,
                    {
                      hotspotX: Math.max(0, Math.min(40, hotspotX)),
                      hotspotY: Math.max(0, Math.min(40, hotspotY)),
                      pointerId: event.pointerId,
                      captureEl: event.currentTarget
                    }
                  );
                } else {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  props.onStartDrag(
                    { source: "inventory", index: slotIndex },
                    item?.icon ? String(item.icon) : null,
                    event,
                    { hotspotX: 20, hotspotY: 20, pointerId: event.pointerId, captureEl: event.currentTarget }
                  );
                }
                event.preventDefault();
              }}
              onMouseEnter={(event) => {
                const currency = (CURRENCIES as Record<string, any>)[slot.id] ?? null;
                props.onTooltipShow(event, String(currency?.name ?? slot.id), currency?.rarity);
              }}
              onMouseMove={(event) => props.onTooltipMove(event)}
              onMouseLeave={() => props.onTooltipHide()}
              onContextMenu={(event) => {
                const currency = (CURRENCIES as Record<string, any>)[slot.id] ?? null;
                const equippableSlotId = currency ? resolveTargetSlot(currency, inventory.equippedItems as any) : null;
                props.onOpenContextMenu(event, {
                  source: "bag",
                  index: slotIndex,
                  id: slot.id,
                  instanceId: slot.instanceId,
                  equippableSlotId,
                  usable: Boolean(currency?.effects),
                  deletable: (currency as any)?.deletable !== false
                });
              }}
              style={{
                outline: canDropEquippedHere ? "2px solid rgba(255,255,255,0.15)" : undefined
              }}
            >
              {item?.icon ? <img className="bag-slot__icon" src={item.icon} alt="" draggable={false} /> : null}
              {(() => {
                const maxStackRaw = (item as { maxStack?: unknown } | null)?.maxStack;
                const maxStack = Number(maxStackRaw);
                const count = Number(slot.count);
                const canStack = Number.isFinite(maxStack) ? maxStack > 1 : false;
                const showCount = canStack && Number.isFinite(count) && count > 1;
                return showCount ? <span className="bag-slot__count">{String(slot.count)}</span> : null;
              })()}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
