import React from "react";
import { CharacterPanelContent } from "./CharacterPanelParts.jsx";

export default function CharacterPanel({
  isOpen,
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
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="character-panel" aria-label="Character menu">
      <h3 className="character-panel__title">Character</h3>
      <CharacterPanelContent
        gearLayer={gearLayer}
        onToggleLayer={onToggleLayer}
        onOpenDetails={onOpenDetails}
        onOpenBloodline={onOpenBloodline}
        onOpenPerks={onOpenPerks}
        onTooltipShow={onTooltipShow}
        onTooltipMove={onTooltipMove}
        onTooltipHide={onTooltipHide}
        bagRarity={bagRarity}
        bagIcon={bagIcon}
        bagName={bagName}
        hasBag={hasBag}
        onBagDrop={onBagDrop}
        onBagDragOver={onBagDragOver}
        onBagDragStart={onBagDragStart}
      />
    </aside>
  );
}
