import { useCallback, useEffect, useRef, useState } from "react";

const useLootNoticeTimers = ({ hideDelayMs, clearDelayMs, onHide, onClear }) => {
  const timersRef = useRef(new Map());

  const clearNotice = useCallback((noticeId) => {
    const timers = timersRef.current.get(noticeId);
    if (!timers) {
      return;
    }
    clearTimeout(timers.hide);
    clearTimeout(timers.clear);
    timersRef.current.delete(noticeId);
  }, []);

  const scheduleNotice = useCallback(
    (notice) => {
      const hideTimer = setTimeout(() => {
        if (onHide) {
          onHide(notice.id);
        }
      }, hideDelayMs);

      const clearTimer = setTimeout(() => {
        if (onClear) {
          onClear(notice.id);
        }
        clearNotice(notice.id);
      }, clearDelayMs);

      timersRef.current.set(notice.id, {
        hide: hideTimer,
        clear: clearTimer
      });
    },
    [hideDelayMs, clearDelayMs, onHide, onClear, clearNotice]
  );

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timers) => {
      clearTimeout(timers.hide);
      clearTimeout(timers.clear);
    });
    timersRef.current.clear();
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  return {
    scheduleNotice,
    clearNotice,
    clearAll
  };
};

export default function useLootNotices({
  max = 5,
  hideDelayMs = 2500,
  clearDelayMs = 3000
} = {}) {
  const [lootNotices, setLootNotices] = useState([]);

  const handleHide = useCallback((noticeId) => {
    setLootNotices((prev) =>
      prev.map((item) =>
        item.id === noticeId ? { ...item, visible: false } : item
      )
    );
  }, []);

  const handleClear = useCallback((noticeId) => {
    setLootNotices((prev) => prev.filter((item) => item.id !== noticeId));
  }, []);

  const { scheduleNotice, clearNotice } = useLootNoticeTimers({
    hideDelayMs,
    clearDelayMs,
    onHide: handleHide,
    onClear: handleClear
  });

  const addNotice = useCallback(
    (notice) => {
      setLootNotices((prev) => {
        const next = [notice, ...prev];
        if (next.length <= max) {
          return next;
        }

        const trimmed = next.slice(0, max);
        const removed = next.slice(max);
        removed.forEach((item) => {
          clearNotice(item.id);
        });
        return trimmed;
      });
      scheduleNotice(notice);
    },
    [max, scheduleNotice, clearNotice]
  );

  return { lootNotices, addNotice };
}
