import { useAppSelector } from "../app/hooks";
import { selectResourcesView } from "../state/resourcesSelectors";

export default function ResourcesHud() {
  const resources = useAppSelector(selectResourcesView);
  if (!resources.length) return null;

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
                width: 170,
                height: Math.round(22 * 1.2)
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
