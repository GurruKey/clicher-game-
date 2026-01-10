import React from "react";
import useCharacterSlots from "../../hooks/character/useCharacterSlots.js";

export function CharacterSlot({
  slot,
  equippedItem,
  currencies,
  onDrop,
  onContextMenu,
  onDragStart,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide
}) {
  const itemData = equippedItem ? currencies[equippedItem.id] : null;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    onDrop(slot.id);
  };

  const handleDragStart = (e) => {
    if (itemData && onDragStart) {
      onDragStart(e, equippedItem.id, slot.id, equippedItem.instanceId);
    }
  };

  return (
    <div
      className={`character-slot${itemData ? "" : " character-slot--empty"}`}
      draggable={!!itemData}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={itemData && onTooltipShow ? (e) => onTooltipShow(e, itemData.name, itemData.rarity) : undefined}
      onMouseMove={itemData ? onTooltipMove : undefined}
      onMouseLeave={itemData ? onTooltipHide : undefined}
      onContextMenu={
        itemData && onContextMenu
          ? (e) =>
              onContextMenu(e, {
                id: equippedItem.id,
                instanceId: equippedItem.instanceId,
                source: "character",
                slotId: slot.id
              })
          : undefined
      }
    >
      {itemData ? (
        <img 
          src={itemData.icon} 
          alt={itemData.name} 
          className="character-slot__icon" 
          draggable="false" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        />
      ) : (
        <span className="character-slot__label">{slot.label}</span>
      )}
    </div>
  );
}

export function CharacterSlotColumn({
  slots,
  side,
  equippedItems,
  currencies,
  onEquipmentDrop,
  onEquipmentDragStart,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide
}) {
  if (!slots) return null;
  return (
    <div className={`character-column character-column--${side}`}>
      {slots.map((slot) => (
        <CharacterSlot
          key={slot.id}
          slot={slot}
          equippedItem={equippedItems?.[slot.id]}
          currencies={currencies}
          onDrop={onEquipmentDrop}
          onDragStart={onEquipmentDragStart}
          onContextMenu={onContextMenu}
          onTooltipShow={onTooltipShow}
          onTooltipMove={onTooltipMove}
          onTooltipHide={onTooltipHide}
        />
      ))}
    </div>
  );
}

export function CharacterStatsPanel({
  onOpenDetails,
  onOpenBloodline,
  onOpenPerks
}) {
  return (
    <div className="character-stats">
      <div className="character-stats__title">Stats</div>
      <div className="character-stats__body" />
      <div className="character-stats-actions">
        <button className="character-stats-more" type="button" onClick={onOpenPerks}>Perks</button>
        <button className="character-stats-more" type="button" onClick={onOpenDetails}>Stats</button>
        <button className="character-stats-more" type="button" onClick={onOpenBloodline}>Bloodline</button>
      </div>
    </div>
  );
}

export function CharacterWeaponBar({
  weaponSlots,
  isOuterLayer,
  onToggleLayer,
  equippedItems,
  currencies,
  onEquipmentDrop,
  onEquipmentDragStart,
  onContextMenu,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide
}) {
  if (!weaponSlots) return null;
  return (
    <div className="character-weapon-row">
      <button className="character-layer-toggle" type="button" onClick={onToggleLayer}>
        {isOuterLayer ? "Outer" : "Inner"}
      </button>
      <div className="character-weapon-bar">
        {weaponSlots.map((slot) => (
          <CharacterSlot
            key={slot.id}
            slot={slot}
            equippedItem={equippedItems?.[slot.id]}
            currencies={currencies}
            onDrop={onEquipmentDrop}
            onDragStart={onEquipmentDragStart}
            onContextMenu={onContextMenu}
            onTooltipShow={onTooltipShow}
            onTooltipMove={onTooltipMove}
            onTooltipHide={onTooltipHide}
          />
        ))}
      </div>
    </div>
  );
}

export function CharacterPanelContent({
  gearLayer,
  onToggleLayer,
  onOpenDetails,
  onOpenBloodline,
  onOpenPerks,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide,
  onContextMenu,
  onEquipmentDrop,
  onEquipmentDragStart,
  equippedItems,
  currencies
}) {
  const { isOuterLayer, leftSlots, rightSlots, weaponSlots } = useCharacterSlots({ gearLayer });

  return (
    <div className="character-panel__body">
      <div className="character-layout">
        <CharacterSlotColumn
          slots={leftSlots}
          side="left"
          equippedItems={equippedItems}
          currencies={currencies}
          onEquipmentDrop={onEquipmentDrop}
          onEquipmentDragStart={onEquipmentDragStart}
          onContextMenu={onContextMenu}
          onTooltipShow={onTooltipShow}
          onTooltipMove={onTooltipMove}
          onTooltipHide={onTooltipHide}
        />
        <div className="character-center">
          <CharacterStatsPanel
            onOpenDetails={onOpenDetails}
            onOpenBloodline={onOpenBloodline}
            onOpenPerks={onOpenPerks}
          />
        </div>
        <CharacterSlotColumn
          slots={rightSlots}
          side="right"
          equippedItems={equippedItems}
          currencies={currencies}
          onEquipmentDrop={onEquipmentDrop}
          onEquipmentDragStart={onEquipmentDragStart}
          onContextMenu={onContextMenu}
          onTooltipShow={onTooltipShow}
          onTooltipMove={onTooltipMove}
          onTooltipHide={onTooltipHide}
        />
      </div>
      
      <div className="character-footer">
        <CharacterWeaponBar
          weaponSlots={weaponSlots}
          isOuterLayer={isOuterLayer}
          onToggleLayer={onToggleLayer}
          equippedItems={equippedItems}
          currencies={currencies}
          onEquipmentDrop={onEquipmentDrop}
          onEquipmentDragStart={onEquipmentDragStart}
          onContextMenu={onContextMenu}
          onTooltipShow={onTooltipShow}
          onTooltipMove={onTooltipMove}
          onTooltipHide={onTooltipHide}
        />
      </div>
    </div>
  );
}
