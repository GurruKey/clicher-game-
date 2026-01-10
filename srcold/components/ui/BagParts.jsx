import React from "react";
import { resolveTargetSlot } from "../../logic/items/wear/equip/equipLogic.js";
import buildBagDisplayOrder from "./utils/buildBagDisplayOrder.js";

export function BagSlot({
  slotIndex,
  slot,
  currency,
  count,
  isBase,
  dragIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide,
  equippedItems
}) {
  if (!currency) {
    return (
      <div
        className={`bag-slot bag-slot--empty${isBase ? " bag-slot--base" : ""}`}
        onDragOver={onDragOver}
        onDrop={(event) => onDrop(event, slotIndex)}
      />
    );
  }

  return (
    <button
      className={`bag-slot bag-slot--filled${isBase ? " bag-slot--base" : ""}`}
      type="button"
      draggable
      data-dragging={dragIndex === slotIndex ? "true" : "false"}
      onDragStart={(event) => onDragStart(event, slotIndex)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, slotIndex)}
      onMouseEnter={(event) => onTooltipShow(event, currency.name, currency.rarity)}
      onMouseMove={onTooltipMove}
      onMouseLeave={onTooltipHide}
      onContextMenu={(event) => {
        const canEquip = Boolean(resolveTargetSlot(currency, equippedItems || {}));
        onContextMenu(event, {
          id: slot.id,
          source: "bag",
          index: slotIndex,
          equippable: canEquip,
          usable: Boolean(currency.effects)
        });
      }}
    >
      <img
        className="bag-slot__icon"
        src={currency.icon}
        alt={currency.name}
        draggable="false"
      />
      <span className="bag-slot__count">{count}</span>
    </button>
  );
}

export function BagGrid({
  bagSlots,
  dragIndex,
  currencies,
  slotCount,
  baseSlotCount,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide,
  equippedItems
}) {
  const displayOrder = buildBagDisplayOrder({ slotCount, baseSlotCount });

  return (
    <div className="bag__grid">
      {displayOrder.map((slotIndex) => {
        const slot = bagSlots[slotIndex] ?? null;
        const slotId = slot?.id ?? null;
        const currency = slotId ? currencies[slotId] : null;
        const count = slot?.count ?? 0;
        const key = slotId ? `${slotId}-${slotIndex}` : `empty-${slotIndex}`;
        const isBase = slotIndex < baseSlotCount;

        return (
          <BagSlot
            key={key}
            slotIndex={slotIndex}
            slot={slot}
            currency={currency}
            count={count}
            isBase={isBase}
            dragIndex={dragIndex}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onContextMenu={onContextMenu}
            onTooltipShow={onTooltipShow}
            onTooltipMove={onTooltipMove}
            onTooltipHide={onTooltipHide}
            equippedItems={equippedItems}
          />
        );
      })}
    </div>
  );
}

export function BagToggle({ isOpen, onToggle, newTypesCount, bagIcon, bagName }) {
  return (
    <button
      className="bag__toggle"
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className="bag__icon" aria-hidden="true">
        <img src={bagIcon} alt={bagName} draggable="false" />
      </span>
      <span className="bag__label">{bagName}</span>
      {newTypesCount > 0 ? <span className="bag__badge">{newTypesCount}</span> : null}
    </button>
  );
}

export function Bag({
  isOpen,
  onToggle,
  newTypesCount,
  bagSlots,
  dragIndex,
  currencies,
  bagIcon,
  bagName,
  slotCount,
  baseSlotCount,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide,
  equippedItems
}) {
  return (
    <aside className={`bag ${isOpen ? "bag--open" : "bag--closed"}`}>
      <BagToggle
        isOpen={isOpen}
        onToggle={onToggle}
        newTypesCount={newTypesCount}
        bagIcon={bagIcon}
        bagName={bagName}
      />
      {isOpen ? (
        <div className="bag__panel">
          <BagGrid
            bagSlots={bagSlots}
            dragIndex={dragIndex}
            currencies={currencies}
            slotCount={slotCount}
            baseSlotCount={baseSlotCount}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onContextMenu={onContextMenu}
            onTooltipShow={onTooltipShow}
            onTooltipMove={onTooltipMove}
            onTooltipHide={onTooltipHide}
            equippedItems={equippedItems}
          />
        </div>
      ) : null}
    </aside>
  );
}
