import React from "react";
import useCharacterSlots from "../../hooks/character/useCharacterSlots.js";

export function CharacterSlotColumn({ slots, side }) {
  return (
    <div className={`character-column character-column--${side}`}>
      {slots.map((slot) => (
        <div className="character-slot" key={slot.id}>
          <span className="character-slot__label">{slot.label}</span>
        </div>
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
        <button
          className="character-stats-more"
          type="button"
          onClick={onOpenPerks}
        >
          Perks
        </button>
        <button
          className="character-stats-more"
          type="button"
          onClick={onOpenDetails}
        >
          Stats
        </button>
        <button
          className="character-stats-more"
          type="button"
          onClick={onOpenBloodline}
        >
          Bloodline
        </button>
      </div>
    </div>
  );
}

export function CharacterWeaponBar({
  weaponSlots,
  isOuterLayer,
  onToggleLayer
}) {
  return (
    <div className="character-weapon-row">
      <button
        className="character-layer-toggle"
        type="button"
        onClick={onToggleLayer}
      >
        {isOuterLayer ? "Outer" : "Inner"}
      </button>
      <div className="character-weapon-bar">
        {weaponSlots.map((slot) => (
          <div className="character-weapon-slot" key={slot.id}>
            <span className="character-slot__label">{slot.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CharacterBagSlot({
  hasBag,
  bagIcon,
  bagName,
  bagRarity,
  onBagDrop,
  onBagDragOver,
  onBagDragStart,
  onTooltipShow,
  onTooltipMove,
  onTooltipHide
}) {
  return (
    <button
      className={`character-bag-slot${hasBag ? "" : " character-bag-slot--empty"}`}
      type="button"
      draggable={hasBag}
      onDragStart={hasBag ? onBagDragStart : undefined}
      onDragOver={onBagDragOver}
      onDrop={onBagDrop}
      onMouseEnter={
        hasBag && onTooltipShow
          ? (event) => onTooltipShow(event, bagName, bagRarity)
          : undefined
      }
      onMouseMove={hasBag ? onTooltipMove : undefined}
      onMouseLeave={hasBag ? onTooltipHide : undefined}
    >
      {bagIcon ? <img src={bagIcon} alt={bagName} draggable="false" /> : null}
    </button>
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
  bagRarity,
  bagIcon,
  bagName,
  hasBag,
  onBagDrop,
  onBagDragOver,
  onBagDragStart
}) {
  const { isOuterLayer, leftSlots, rightSlots, weaponSlots } =
    useCharacterSlots({ gearLayer });

  return (
    <div className="character-panel__body">
      <div className="character-layout">
        <CharacterSlotColumn slots={leftSlots} side="left" />
        <div className="character-center">
          <CharacterStatsPanel
            onOpenDetails={onOpenDetails}
            onOpenBloodline={onOpenBloodline}
            onOpenPerks={onOpenPerks}
          />
        </div>
        <CharacterSlotColumn slots={rightSlots} side="right" />
      </div>
      <CharacterWeaponBar
        weaponSlots={weaponSlots}
        isOuterLayer={isOuterLayer}
        onToggleLayer={onToggleLayer}
      />
      {isOuterLayer ? (
        <CharacterBagSlot
          hasBag={hasBag}
          bagIcon={bagIcon}
          bagName={bagName}
          bagRarity={bagRarity}
          onBagDrop={onBagDrop}
          onBagDragOver={onBagDragOver}
          onBagDragStart={onBagDragStart}
          onTooltipShow={onTooltipShow}
          onTooltipMove={onTooltipMove}
          onTooltipHide={onTooltipHide}
        />
      ) : null}
    </div>
  );
}
