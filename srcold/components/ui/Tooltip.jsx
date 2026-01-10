import React, { useLayoutEffect, useRef, useState } from "react";

const OFFSET = 12;
const PADDING = 8;

export default function Tooltip({ tooltip }) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!tooltip || !ref.current) {
      setPosition(null);
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const rawX = tooltip.x + OFFSET;
    const rawY = tooltip.y + OFFSET;
    const maxX = window.innerWidth - rect.width - PADDING;
    const maxY = window.innerHeight - rect.height - PADDING;

    const nextX = Math.min(Math.max(PADDING, rawX), maxX);
    const nextY = Math.min(Math.max(PADDING, rawY), maxY);

    setPosition({ x: nextX, y: nextY });
  }, [tooltip]);

  if (!tooltip) {
    return null;
  }

  const style = {
    left: position?.x ?? tooltip.x + OFFSET,
    top: position?.y ?? tooltip.y + OFFSET
  };

  return (
    <div
      className="tooltip"
      data-rarity={tooltip.rarity || undefined}
      style={style}
      ref={ref}
      role="tooltip"
    >
      {tooltip.text}
    </div>
  );
}
