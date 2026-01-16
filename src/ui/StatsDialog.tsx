import { useAppDispatch, useAppSelector } from "../app/hooks";
import { closeStats } from "../state/uiSlice";
import ModalShell from "./ModalShell";
import { STATS } from "../content/stats/index.js";
import { STATS_DISPLAY_CONFIG } from "../content/stats/display_config.js";
import { selectCalculatedStatsFromRoot } from "../state/statsDerive";

export default function StatsDialog() {
  const dispatch = useAppDispatch();
  const finalStats = useAppSelector(selectCalculatedStatsFromRoot);

  const labelById = new Map<string, string>();
  for (const def of STATS as any[]) {
    if (def && typeof def.id === "string") {
      labelById.set(def.id, String(def.label ?? def.id));
    }
  }

  const categories = (STATS_DISPLAY_CONFIG as any[]).filter((c) => c && typeof c.id === "string");

  const used = new Set<string>();
  const categoryBlocks = categories.map((category) => {
    const ids = (category as any).stats;
    const details: Array<{ id: string; label: string; value: string }> = [];
    if (Array.isArray(ids)) {
      for (const id of ids) {
        if (typeof id !== "string") continue;
        used.add(id);
        details.push({
          id,
          label: labelById.get(id) ?? id,
          value: String((finalStats as any)?.[id] ?? 0)
        });
      }
    }
    return {
      id: String(category.id),
      label: String(category.label ?? category.id),
      details
    };
  });

  const otherIds = Array.from(labelById.keys()).filter((id) => !used.has(id));

  return (
    <ModalShell title="Stats" onClose={() => dispatch(closeStats())} dialogClassName="stats-dialog">
      <div className="stats-dialog__body">
        <div className="stats-dialog__categories">
          {categoryBlocks.map((category) => (
            <div key={category.id} className="stats-dialog__category">
              <div className="stats-dialog__category-header">{category.label}</div>
              <div className="stats-dialog__details">
                {category.details.map((d) => (
                  <div key={d.id} className="stats-dialog__detail">
                    <span className="stats-dialog__detail-label">{d.label}</span>
                    <span className="stats-dialog__detail-value">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {otherIds.length > 0 ? (
            <div className="stats-dialog__category">
              <div className="stats-dialog__category-header">Other</div>
              <div className="stats-dialog__details">
                {otherIds.map((id) => (
                  <div key={id} className="stats-dialog__detail">
                    <span className="stats-dialog__detail-label">{labelById.get(id) ?? id}</span>
                    <span className="stats-dialog__detail-value">{String((finalStats as any)?.[id] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
