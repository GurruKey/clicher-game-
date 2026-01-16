import type { TooltipState } from "../hooks/ui/useTooltip";
import { useLayoutEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function Tooltip(props: { tooltip: TooltipState }) {
  const t = props.tooltip;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!t) {
      setPosition(null);
      return;
    }

    const el = tooltipRef.current;
    if (!el) return;

    const recompute = () => {
      const offset = 12;
      const padding = 8;
      const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;

      const rect = el.getBoundingClientRect();

      const desiredLeft = t.x + offset;
      const desiredTop = t.y + offset;

      const maxLeft = Math.max(padding, viewportWidth - rect.width - padding);
      const maxTop = Math.max(padding, viewportHeight - rect.height - padding);

      const clampedLeft = clamp(desiredLeft, padding, maxLeft);
      const clampedTop = clamp(desiredTop, padding, maxTop);

      setPosition((prev) =>
        prev && prev.left === clampedLeft && prev.top === clampedTop ? prev : { left: clampedLeft, top: clampedTop }
      );
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [t?.text, t?.rarity, t?.x, t?.y]);

  if (!t) return null;

  return (
    <div
      ref={tooltipRef}
      className="tooltip"
      data-rarity={t.rarity ?? undefined}
      style={{
        left: position?.left ?? t.x + 12,
        top: position?.top ?? t.y + 12,
        maxWidth: "min(420px, calc(100vw - 16px))",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {t.text}
    </div>
  );
}
