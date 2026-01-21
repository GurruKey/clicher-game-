import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { CURRENCIES } from "../content/currencies/index.js";
import {
  CHARACTER_INNER_LEFT,
  CHARACTER_INNER_RIGHT,
  CHARACTER_OUTER_LEFT,
  CHARACTER_OUTER_RIGHT,
  CHARACTER_WEAPON_INNER,
  CHARACTER_WEAPON_OUTER
} from "../content/characterSlots.js";
import { selectInventorySnapshot } from "../state/inventorySlice";
import {
  closeCharacter,
  openBloodline,
  openFame,
  openPerks,
  openReputation,
  openStats,
  selectUi,
  toggleGearLayer
} from "../state/uiSlice";
import { canEquipInSlot } from "../systems/inventory/equipment/canEquipInSlot";
import { getBagIdFromInstance } from "../systems/inventory/bagInstance";
import type { InventoryContextMenuData } from "./ContextMenu";

type DragState =
  | { source: "inventory"; index: number }
  | { source: "equipped"; slotId: string }
  | null;

type SlotDef = { id: string; label: string };

function CharacterSlot(props: {
  slot: SlotDef;
  item: { id: string; instanceId?: string } | null;
  isDragging?: boolean;
  canDrop: boolean;
  onStartDrag: (
    payload: DragState,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
  onOpenContextMenu: (
    event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
    payload: InventoryContextMenuData
  ) => void;
  onTooltipShow: (event: { clientX: number; clientY: number }, text: string, rarity?: string) => void;
  onTooltipMove: (event: { clientX: number; clientY: number }) => void;
  onTooltipHide: () => void;
}) {
  const effectiveItem = props.isDragging ? null : props.item;
  const data = effectiveItem ? (CURRENCIES as Record<string, any>)[effectiveItem.id] : null;
  const label = data?.name ?? effectiveItem?.id ?? props.slot.label;

  return (
    <div
      className="character-slot"
      data-drop-kind="equipped"
      data-drop-slot-id={props.slot.id}
      data-can-drop={props.canDrop ? "true" : "false"}
      data-empty={effectiveItem ? "false" : "true"}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (!props.item) return;
        const dragData = (CURRENCIES as Record<string, any>)[props.item.id] ?? null;
        const iconSrc = dragData?.icon ? String(dragData.icon) : null;
        props.onTooltipHide();

        const iconEl = (event.currentTarget as HTMLDivElement).querySelector("img") as HTMLImageElement | null;
        if (iconEl) {
          const rect = iconEl.getBoundingClientRect();
          const hotspotX = rect.width > 0 ? ((event.clientX - rect.left) / rect.width) * 40 : 20;
          const hotspotY = rect.height > 0 ? ((event.clientY - rect.top) / rect.height) * 40 : 20;
          event.currentTarget.setPointerCapture(event.pointerId);
          props.onStartDrag(
            { source: "equipped", slotId: props.slot.id },
            iconSrc,
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
            { source: "equipped", slotId: props.slot.id },
            iconSrc,
            event,
            { hotspotX: 20, hotspotY: 20, pointerId: event.pointerId, captureEl: event.currentTarget }
          );
        }
        event.preventDefault();
      }}
      onContextMenu={(event) => {
        if (!effectiveItem) return;
        props.onOpenContextMenu(event, {
          source: "character",
          slotId: props.slot.id,
          id: effectiveItem.id,
          instanceId: effectiveItem.instanceId
        });
      }}
      onMouseEnter={(event) => {
        if (!effectiveItem) return;
        props.onTooltipShow(event, String(label), data?.rarity);
      }}
      onMouseMove={(event) => {
        if (!effectiveItem) return;
        props.onTooltipMove(event);
      }}
      onMouseLeave={() => props.onTooltipHide()}
    >
      {effectiveItem && data?.icon ? (
        <img
          src={data.icon}
          alt=""
          draggable={false}
          className="character-slot__icon"
        />
      ) : (
        (props.isDragging ? null : <span className="character-slot__label">{props.slot.label}</span>)
      )}
    </div>
  );
}

export default function CharacterPanel(props: {
  drag: DragState;
  onStartDrag: (
    payload: DragState,
    iconSrc: string | null,
    event: { clientX: number; clientY: number },
    meta?: { hotspotX: number; hotspotY: number; pointerId: number; captureEl: Element }
  ) => void;
  onTooltipShow: (event: { clientX: number; clientY: number }, text: string, rarity?: string) => void;
  onTooltipMove: (event: { clientX: number; clientY: number }) => void;
  onTooltipHide: () => void;
  onOpenContextMenu: (
    event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
    payload: InventoryContextMenuData
  ) => void;
}) {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectUi);
  const inventory = useAppSelector(selectInventorySnapshot);

  const activeBagSlots = inventory.equippedBagId ? inventory.bagSlotsById[inventory.equippedBagId] ?? [] : [];
  const visibleSlots = useMemo(() => [...inventory.baseSlots, ...activeBagSlots], [activeBagSlots, inventory.baseSlots]);

  const equippedBySlotId = useMemo(() => {
    const map: Record<string, { id: string; instanceId?: string } | null> = { ...inventory.equippedItems } as any;
    if (inventory.equippedBagId) {
      const bagItemId = getBagIdFromInstance(inventory.equippedBagId) ?? String(inventory.equippedBagId).split(":")[0];
      map.bag = { id: bagItemId, instanceId: inventory.equippedBagId };
    } else {
      map.bag = null;
    }
    return map;
  }, [inventory.equippedBagId, inventory.equippedItems]);

  const isOuter = ui.gearLayer === "outer";
  const leftSlots = (isOuter ? CHARACTER_OUTER_LEFT : CHARACTER_INNER_LEFT) as SlotDef[];
  const rightSlots = (isOuter ? CHARACTER_OUTER_RIGHT : CHARACTER_INNER_RIGHT) as SlotDef[];
  const weaponSlots = (isOuter ? CHARACTER_WEAPON_OUTER : CHARACTER_WEAPON_INNER) as SlotDef[];

  const leftSlotsNoBag = useMemo(() => leftSlots.filter((slot) => slot.id !== "bag"), [leftSlots]);
  const rightSlotsNoBag = useMemo(() => rightSlots.filter((slot) => slot.id !== "bag"), [rightSlots]);

  const canDropFromInventoryIntoSlot = useMemo(() => {
    return (slotId: string) => {
      if (props.drag?.source !== "inventory") return false;
      const slot = visibleSlots[props.drag.index] ?? null;
      const itemData = slot ? (CURRENCIES as Record<string, any>)[slot.id] : null;
      return Boolean(itemData && canEquipInSlot(itemData, slotId));
    };
  }, [props.drag, visibleSlots]);

  // Note: drag/drop is handled by GameScreen pointer-based DnD.

  const bagItem = equippedBySlotId.bag ?? null;
  const canDropBag = canDropFromInventoryIntoSlot("bag");
  const bagSlotDef: SlotDef = useMemo(() => ({ id: "bag", label: "Bag" }), []);

  return (
    <aside className="character-panel" aria-label="Character menu">
      <h3 className="character-panel__title">Character</h3>
      <div className="character-panel__body">
        <div className="character-layout">
          <div className="character-column character-column--left">
            {leftSlotsNoBag.map((slot) => (
              <CharacterSlot
                key={slot.id}
                slot={slot}
                item={equippedBySlotId[slot.id] ?? null}
                isDragging={props.drag?.source === "equipped" && props.drag.slotId === slot.id}
                canDrop={canDropFromInventoryIntoSlot(slot.id)}
                onStartDrag={props.onStartDrag}
                onOpenContextMenu={props.onOpenContextMenu}
                onTooltipShow={props.onTooltipShow}
                onTooltipMove={props.onTooltipMove}
                onTooltipHide={props.onTooltipHide}
              />
            ))}
            <CharacterSlot
              key="bag-left"
              slot={bagSlotDef}
              item={bagItem}
              isDragging={props.drag?.source === "equipped" && props.drag.slotId === bagSlotDef.id}
              canDrop={canDropBag}
              onStartDrag={props.onStartDrag}
              onOpenContextMenu={props.onOpenContextMenu}
              onTooltipShow={props.onTooltipShow}
              onTooltipMove={props.onTooltipMove}
              onTooltipHide={props.onTooltipHide}
            />
          </div>

          <div className="character-center">
            <div className="character-stats">
              <div className="character-stats__title">Stats</div>
              <div className="character-stats__body" />
            </div>
          </div>

          <div className="character-column character-column--right">
            {rightSlotsNoBag.map((slot) => (
              <CharacterSlot
                key={slot.id}
                slot={slot}
                item={equippedBySlotId[slot.id] ?? null}
                isDragging={props.drag?.source === "equipped" && props.drag.slotId === slot.id}
                canDrop={canDropFromInventoryIntoSlot(slot.id)}
                onStartDrag={props.onStartDrag}
                onOpenContextMenu={props.onOpenContextMenu}
                onTooltipShow={props.onTooltipShow}
                onTooltipMove={props.onTooltipMove}
                onTooltipHide={props.onTooltipHide}
              />
            ))}
            <CharacterSlot
              key="bag-right"
              slot={bagSlotDef}
              item={bagItem}
              isDragging={props.drag?.source === "equipped" && props.drag.slotId === bagSlotDef.id}
              canDrop={canDropBag}
              onStartDrag={props.onStartDrag}
              onOpenContextMenu={props.onOpenContextMenu}
              onTooltipShow={props.onTooltipShow}
              onTooltipMove={props.onTooltipMove}
              onTooltipHide={props.onTooltipHide}
            />
          </div>
        </div>

      <div className="character-stats-actions character-stats-actions--tight">
          <button className="character-stats-more" type="button" onClick={() => dispatch(openPerks())}>
            Perks
          </button>
          <button className="character-stats-more" type="button" onClick={() => dispatch(openStats())}>
            Stats
          </button>
          <button className="character-stats-more" type="button" onClick={() => dispatch(openBloodline())}>
            Bloodline
          </button>
          <button className="character-stats-more" type="button" onClick={() => dispatch(openReputation())}>
            Reputation
          </button>
          <button className="character-stats-more" type="button" onClick={() => dispatch(openFame())}>
            Fame
          </button>
        </div>

        <div className="character-footer">
          <div className="character-weapon-row">
            <button className="character-layer-toggle" type="button" onClick={() => dispatch(toggleGearLayer())}>
              {isOuter ? "Outer" : "Inner"}
            </button>
            <div className="character-weapon-bar">
              {weaponSlots.map((slot) => (
                <CharacterSlot
                  key={slot.id}
                  slot={slot}
                  item={equippedBySlotId[slot.id] ?? null}
                  isDragging={props.drag?.source === "equipped" && props.drag.slotId === slot.id}
                  canDrop={canDropFromInventoryIntoSlot(slot.id)}
                  onStartDrag={props.onStartDrag}
                  onOpenContextMenu={props.onOpenContextMenu}
                  onTooltipShow={props.onTooltipShow}
                  onTooltipMove={props.onTooltipMove}
                  onTooltipHide={props.onTooltipHide}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="character-panel__footer-actions" />
    </aside>
  );
}
