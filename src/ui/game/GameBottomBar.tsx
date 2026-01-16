import AbilitiesPanel from "../AbilitiesPanel";
import InventoryPanel from "../InventoryPanel";
import bagIcon from "../../assets/ui/bag.png";
import abilitiesIcon from "../../assets/ui/abilities.png";
import mapIcon from "../../assets/ui/map.png";
import type { TooltipState } from "../../hooks/ui/useTooltip";
import type { DragState, StartDragFn } from "./types";

export default function GameBottomBar(props: {
  isSpellsOpen: boolean;
  isInventoryOpen: boolean;
  showAbilitiesButton: boolean;
  knownAbilityIds: string[];
  newTypesCount: number;
  newAbilitiesCount: number;
  equippedBagIconSrc?: string | null;
  equippedBagLabel?: string | null;
  drag: DragState;
  tooltip: TooltipState;
  onStartDrag: StartDragFn;
  onTooltipShow: (event: { clientX: number; clientY: number }, text: string, rarity?: string) => void;
  onTooltipMove: (event: { clientX: number; clientY: number }) => void;
  onTooltipHide: () => void;
  onOpenContextMenu: (
    event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number },
    payload: any
  ) => void;
  onToggleMap: () => void;
  onToggleSpells: () => void;
  onToggleInventory: () => void;
}) {
  const resolvedBagIcon = props.equippedBagIconSrc ? String(props.equippedBagIconSrc) : bagIcon;
  const resolvedBagAlt = props.equippedBagLabel ? String(props.equippedBagLabel) : "Inventory";

  return (
    <div className="bottom-bar">
      <button className="map-button" type="button" onClick={props.onToggleMap}>
        <img src={mapIcon} alt="Map" draggable={false} />
      </button>

      {props.showAbilitiesButton ? (
        <aside className={`abilities ${props.isSpellsOpen ? "abilities--open" : "abilities--closed"}`}>
          <button
            className="book-button"
            type="button"
            aria-label="Abilities"
            aria-expanded={props.isSpellsOpen}
            onClick={props.onToggleSpells}
          >
            <img src={abilitiesIcon} alt="Abilities" draggable={false} />
            {props.newAbilitiesCount > 0 ? <span className="bag__badge">{props.newAbilitiesCount}</span> : null}
          </button>

          {props.isSpellsOpen ? (
            <AbilitiesPanel
              drag={props.drag?.source === "ability" ? (props.drag as any) : null}
              knownAbilityIds={props.knownAbilityIds}
              onStartDrag={(payload, iconSrc, event, meta) => props.onStartDrag(payload as any, iconSrc, event, meta)}
            />
          ) : null}
        </aside>
      ) : null}

      <aside className={`bag ${props.isInventoryOpen ? "bag--open" : "bag--closed"}`}>
        <button className="bag__toggle" type="button" onClick={props.onToggleInventory} aria-expanded={props.isInventoryOpen}>
          <span className="bag__icon" aria-hidden="true">
            <img src={resolvedBagIcon} alt={resolvedBagAlt} draggable={false} />
          </span>
          <span className="bag__label">Inventory</span>
          {props.newTypesCount > 0 ? <span className="bag__badge">{props.newTypesCount}</span> : null}
        </button>
        {props.isInventoryOpen ? (
          <InventoryPanel
            drag={props.drag as any}
            onStartDrag={props.onStartDrag as any}
            tooltip={props.tooltip}
            onTooltipShow={props.onTooltipShow}
            onTooltipMove={props.onTooltipMove}
            onTooltipHide={props.onTooltipHide}
            onOpenContextMenu={props.onOpenContextMenu as any}
          />
        ) : null}
      </aside>
    </div>
  );
}
