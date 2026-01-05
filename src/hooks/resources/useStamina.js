import { useEffect, useState } from "react";

export default function useStamina({ max, regenIntervalMs, initialStamina }) {
  const [stamina, setStamina] = useState(() => {
    const initial = Number.isFinite(Number(initialStamina))
      ? Number(initialStamina)
      : max;
    return Math.min(max, Math.max(0, initial));
  });

  useEffect(() => {
    setStamina((prev) => Math.min(max, prev));
  }, [max]);

  useEffect(() => {
    const regenId = setInterval(() => {
      setStamina((prev) => Math.min(max, prev + 1));
    }, regenIntervalMs);

    return () => clearInterval(regenId);
  }, [max, regenIntervalMs]);

  const consumeStamina = (cost) => {
    if (stamina < cost) {
      return false;
    }
    setStamina((prev) => Math.max(0, prev - cost));
    return true;
  };

  return { stamina, consumeStamina };
}
