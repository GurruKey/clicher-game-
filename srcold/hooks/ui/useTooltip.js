import { useCallback, useState } from "react";

export default function useTooltip() {
  const [tooltip, setTooltip] = useState(null);

  const showTooltip = useCallback((event, text, rarity) => {
    setTooltip({ text, rarity, x: event.clientX, y: event.clientY });
  }, []);

  const moveTooltip = useCallback((event) => {
    setTooltip((prev) =>
      prev ? { ...prev, x: event.clientX, y: event.clientY } : prev
    );
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return {
    tooltip,
    showTooltip,
    moveTooltip,
    hideTooltip
  };
}
