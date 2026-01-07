import { useEffect, useRef, useState } from "react";

export default function useLootEngine({
  location,
  consumeResource,
  durationMs,
  onLoot
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  const resourceId = location?.requiredResourceId || "max_stamina";
  const resourceCost = location?.resourceCost ?? 1;

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (isWorking) return;

    if (!consumeResource(resourceId, resourceCost)) {
      return;
    }

    setIsWorking(true);
    setProgress(0);
    startTimeRef.current = performance.now();

    const update = (now) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / durationMs); // Progress as 0...1
      setProgress(p);

      if (p < 1) {
        timerRef.current = requestAnimationFrame(update);
      } else {
        setIsWorking(false);
        setProgress(0);
        if (onLoot) onLoot();
      }
    };

    timerRef.current = requestAnimationFrame(update);
  };

  const remainingMs = isWorking
    ? Math.max(0, durationMs - progress * durationMs)
    : durationMs;

  return {
    isWorking,
    progress,
    remainingSeconds: remainingMs / 1000,
    handleClick
  };
}
