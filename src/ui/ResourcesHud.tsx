import { useAppSelector } from "../app/hooks";
import { selectResourcesView } from "../state/resourcesSelectors";

const TOTAL_HEIGHT = 90;
const GAP = 2;

export default function ResourcesHud() {
  const resources = useAppSelector(selectResourcesView);
  if (!resources.length) return null;

  const count = resources.length;
  const totalGap = Math.max(0, count - 1) * GAP;
  const barHeight = Math.max(0, (TOTAL_HEIGHT - totalGap) / count);

  return (
    <div className="character-resources">
      {resources.map((res) => {
        const max = res.max > 0 ? res.max : 0;
        const value = Math.max(0, res.value);
        const ratio = max > 0 ? Math.min(1, value / max) : 0;
        const label = res.label ?? res.id;
        const valueLabel = `${Math.floor(value)}/${Math.floor(max)}`;
        return (
          <div
            key={res.id}
            className="stamina-panel"
            title={label}
            aria-label={`${label}: ${valueLabel}`}
          >
            <div
              className="stamina-bar"
              style={{
                width: 286,
                height: barHeight
              }}
            >
              <div
                className="stamina-bar__fill"
                style={{
                  width: `${(ratio * 100).toFixed(1)}%`,
                  backgroundColor: res.color ?? "#4caf50"
                }}
              />
              <span className="stamina-bar__text" style={{ color: res.textColor ?? "#ffffff" }}>
                {valueLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
