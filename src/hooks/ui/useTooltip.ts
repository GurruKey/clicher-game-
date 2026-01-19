import { useCallback, useState } from "react";

export type TooltipState = {
  text: string;
  rarity?: string;
  x: number;
  y: number;
} | null;

/**
 * Mirrors legacy logic.
 */
export default function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const showTooltip = useCallback((event: { clientX: number; clientY: number }, text: string, rarity?: string) => {
    setTooltip({ text, rarity, x: event.clientX, y: event.clientY });
  }, []);

  const moveTooltip = useCallback((event: { clientX: number; clientY: number }) => {
    setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return { tooltip, showTooltip, moveTooltip, hideTooltip };
}
