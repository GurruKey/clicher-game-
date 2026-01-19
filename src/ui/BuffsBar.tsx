import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  selectAbilityBuffsById,
  selectAbilityToggledById,
  setAbilityToggled
} from "../state/playerSlice";
import { removeBuff } from "../state/abilitiesThunks";
import { ABILITIES } from "../content/abilities/index.js";
import useTooltip from "../hooks/ui/useTooltip";
import Tooltip from "./Tooltip";

export default function BuffsBar() {
  const buffsById = useAppSelector(selectAbilityBuffsById);
  const toggledById = useAppSelector(selectAbilityToggledById) as Record<string, boolean>;
  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTooltip();

  const activeEffects = ABILITIES.map(ability => {
    const id = String(ability.id);
    const kind = String((ability as any).kind);
    let isActive = false;
    let stacks = 0;
    let type = kind; // 'buff', 'debuff', 'aura'
    let expiresAtMs = 0;

    if (kind === 'aura') {
      if (toggledById[id]) {
        isActive = true;
        stacks = 1;
        type = "aura";
      }
    } else if (kind === 'buff' || kind === 'debuff') {
      const entry = buffsById[id];
      if (entry) {
        const s = Number(entry.stacks ?? 0);
        const expires = Number(entry.expiresAtMs ?? 0);
        if (s > 0 && expires > Date.now()) {
          isActive = true;
          stacks = s;
          type = kind;
          expiresAtMs = expires;
        }
      }
    }

    if (!isActive) return null;

    return {
      id,
      name: ability.name,
      icon: ability.icon,
      stacks,
      type,
      expiresAtMs
    };
  }).filter(Boolean);

  if (activeEffects.length === 0) return null;

  const auras = activeEffects.filter(e => e?.type === "aura");
  const buffs = activeEffects.filter(e => e?.type === "buff");
  const debuffs = activeEffects.filter(e => e?.type === "debuff");

  return (
    <>
      <div className="buffs-container">
        {auras.length > 0 && (
          <div className="buffs-row">
            {auras.map((effect: any) => (
              <BuffIcon
                key={effect.id}
                effect={effect}
                showTooltip={showTooltip}
                moveTooltip={moveTooltip}
                hideTooltip={hideTooltip}
              />
            ))}
          </div>
        )}
        {buffs.length > 0 && (
          <div className="buffs-row">
            {buffs.map((effect: any) => (
              <BuffIcon
                key={effect.id}
                effect={effect}
                showTooltip={showTooltip}
                moveTooltip={moveTooltip}
                hideTooltip={hideTooltip}
              />
            ))}
          </div>
        )}
        {debuffs.length > 0 && (
          <div className="buffs-row">
            {debuffs.map((effect: any) => (
              <BuffIcon
                key={effect.id}
                effect={effect}
                showTooltip={showTooltip}
                moveTooltip={moveTooltip}
                hideTooltip={hideTooltip}
              />
            ))}
          </div>
        )}
      </div>
      <Tooltip tooltip={tooltip} />
    </>
  );
}

function BuffIcon({
  effect,
  showTooltip,
  moveTooltip,
  hideTooltip
}: {
  effect: any;
  showTooltip: any;
  moveTooltip: any;
  hideTooltip: any;
}) {
  const dispatch = useAppDispatch();

  let borderClass = "";
  if (effect.type === "aura") borderClass = "buffs-bar__icon--aura";
  else if (effect.type === "debuff") borderClass = "buffs-bar__icon--debuff";
  else borderClass = "buffs-bar__icon--buff";

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (effect.type === "aura") {
      dispatch(setAbilityToggled({ abilityId: effect.id, enabled: false }));
    } else if (effect.type === "buff") {
      dispatch(removeBuff({ buffId: effect.id }));
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    let text = effect.name;
    if (effect.expiresAtMs > 0) {
      const remainingMs = effect.expiresAtMs - Date.now();
      if (remainingMs > 0) {
        const seconds = Math.ceil(remainingMs / 1000);
        if (seconds >= 60) {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          text += ` (${m}m ${s}s)`;
        } else {
          text += ` (${seconds}s)`;
        }
      }
    }
    showTooltip(e, text, effect.type);
  };

  return (
    <div
      className={`buffs-bar__icon ${borderClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={moveTooltip}
      onMouseLeave={hideTooltip}
      onContextMenu={handleContextMenu}
    >
      <img src={effect.icon} alt="" draggable={false} />
      {effect.stacks > 1 && <span className="buffs-bar__stacks">{effect.stacks}</span>}
    </div>
  );
}
