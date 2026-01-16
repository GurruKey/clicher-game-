import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { getPerkById } from "../content/perks/index.js";
import { RESOURCES } from "../content/resources/index.js";
import { STATS } from "../content/stats/index.js";
import { selectPerkIds } from "../state/playerSlice";
import { selectAvatarMetaFromRoot } from "../state/avatarSelectors";
import { closePerks } from "../state/uiSlice";
import ModalShell from "./ModalShell";

const labelById = (() => {
  const map = new Map<string, string>();
  for (const def of STATS as any[]) {
    if (def && typeof def.id === "string") map.set(def.id, def.label ?? def.id);
  }
  for (const def of RESOURCES as any[]) {
    if (def && typeof def.id === "string") map.set(def.id, def.label ?? def.id);
  }
  return map;
})();

function formatBonuses(stats: unknown): string[] {
  if (!stats || typeof stats !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(stats as Record<string, unknown>)) {
    const num = Number(value);
    if (!Number.isFinite(num) || num === 0) continue;
    const label = labelById.get(key) ?? key;
    const sign = num > 0 ? "+" : "";
    out.push(`${sign}${num} ${label}`);
  }
  return out;
}

export default function PerksDialog() {
  const dispatch = useAppDispatch();
  const perkIds = useAppSelector(selectPerkIds);
  const avatarMeta = useAppSelector(selectAvatarMetaFromRoot) as any;
  const [openById, setOpenById] = useState<Record<string, boolean>>({});

  const perks = useMemo(() => {
    const sourceById = new Map<string, { sourceType?: string; sourceName?: string }>();
    for (const p of (avatarMeta?.perks ?? []) as any[]) {
      if (!p || typeof p.id !== "string") continue;
      sourceById.set(p.id, {
        sourceType: typeof p.sourceType === "string" ? p.sourceType : undefined,
        sourceName: typeof p.sourceName === "string" ? p.sourceName : undefined
      });
    }

    const list: Array<{
      id: string;
      name?: string;
      bonuses: string[];
      unlocks: string[];
      sourceType?: string;
      sourceName?: string;
    }> = [];
    for (const id of perkIds) {
      if (typeof id !== "string") continue;
      const perk = getPerkById(id) as any;
      if (!perk) continue;
      const unlockIds = Array.isArray(perk.unlockResources) ? perk.unlockResources : [];
      const unlocks = unlockIds
        .filter((v: unknown): v is string => typeof v === "string")
        .map((rid: string) => labelById.get(rid) ?? rid);
      const src = sourceById.get(perk.id);
      list.push({
        id: perk.id,
        name: perk.name,
        bonuses: formatBonuses(perk.stats),
        unlocks,
        sourceType: src?.sourceType,
        sourceName: src?.sourceName
      });
    }
    return list;
  }, [perkIds, avatarMeta]);

  return (
    <ModalShell title="Perks" onClose={() => dispatch(closePerks())} dialogClassName="stats-dialog">
      {perks.length === 0 ? (
        <p className="dialog__hint">No perks.</p>
      ) : (
        <div className="stats-dialog__body">
          {perks.map((perk) => (
            <div key={String(perk.id)}>
              <button
                type="button"
                className="stats-dialog__row stats-dialog__row--button"
                onClick={() => setOpenById((prev) => ({ ...prev, [perk.id]: !prev[perk.id] }))}
              >
                <span>{perk.name ?? perk.id}</span>
                <span className="stats-dialog__value">{perk.id}</span>
              </button>

              {openById[perk.id] ? (
                <div className="stats-dialog__details">
                  <div className="stats-dialog__detail">
                    <span className="stats-dialog__detail-label">Source</span>
                    <span className="stats-dialog__detail-value">
                      {perk.sourceType ?? "Unknown"}
                      {perk.sourceName ? ` — ${perk.sourceName}` : ""}
                    </span>
                  </div>
                  <div className="stats-dialog__detail">
                    <span className="stats-dialog__detail-label">Unlocks</span>
                    <span className="stats-dialog__detail-value">
                      {perk.unlocks.length > 0 ? perk.unlocks.join(", ") : "None"}
                    </span>
                  </div>
                  <div className="stats-dialog__detail">
                    <span className="stats-dialog__detail-label">Bonuses</span>
                    <span className="stats-dialog__detail-value">
                      {perk.bonuses.length > 0 ? perk.bonuses.join(", ") : "None"}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
