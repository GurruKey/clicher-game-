import { useCallback, useEffect, useRef, useState } from "react";

export default function useClickWork(params: {
  durationMs: number;
  onComplete?: () => void;
}) {
  const { durationMs, onComplete } = params;
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const startWork = useCallback(() => {
    if (isWorking) {
      return false;
    }
    setProgress(0);
    setIsWorking(true);
    return true;
  }, [isWorking]);

  useEffect(() => {
    if (!isWorking) {
      return;
    }

    const start = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const ratio = Math.min(1, (now - start) / durationMs);
      setProgress(ratio);

      if (ratio < 1) {
        rafId = requestAnimationFrame(step);
        return;
      }

      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      setProgress(0);
      setIsWorking(false);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, isWorking]);

  const remainingSeconds = isWorking
    ? Math.max(0, (1 - progress) * (durationMs / 1000))
    : 0;

  return {
    isWorking,
    progress,
    remainingSeconds,
    startWork
  };
}

