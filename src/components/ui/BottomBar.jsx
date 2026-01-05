import React from "react";
import { Bag } from "./BagParts.jsx";
import { InfoButton, MapButton } from "./UiButtons.jsx";

export default function BottomBar({
  isBagOpen,
  onBagToggle,
  onMapOpen,
  newTypesCount,
  bagSlots,
  dragIndex,
  currencies,
  bagIcon,
  bagName,
  bagSlotCount,
  baseSlotCount,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide
}) {
  return (
    <div className="bottom-bar">
      <MapButton onClick={onMapOpen} />
      <InfoButton />
      <Bag
        isOpen={isBagOpen}
        onToggle={onBagToggle}
        newTypesCount={newTypesCount}
        bagSlots={bagSlots}
        dragIndex={dragIndex}
        currencies={currencies}
        bagIcon={bagIcon}
        bagName={bagName}
        slotCount={bagSlotCount}
        baseSlotCount={baseSlotCount}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        onTooltipShow={onTooltipShow}
        onTooltipMove={onTooltipMove}
        onTooltipHide={onTooltipHide}
      />
    </div>
  );
}
