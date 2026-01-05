import { useCallback, useEffect, useState } from "react";

const useDragState = () => {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);
  const [dragItemInstanceId, setDragItemInstanceId] = useState(null);
  const [dragSource, setDragSource] = useState(null);

  const resetDrag = useCallback(() => {
    setDragIndex(null);
    setDragItemId(null);
    setDragItemInstanceId(null);
    setDragSource(null);
  }, []);

  return {
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSource,
    setDragIndex,
    setDragItemId,
    setDragItemInstanceId,
    setDragSource,
    resetDrag
  };
};

const useDragHandlers = ({
  onClearTooltip,
  setDragIndex,
  setDragItemId,
  setDragItemInstanceId,
  setDragSource
}) => {
  const handleInventoryDragStart = useCallback(
    (event, index, itemId, itemInstanceId) => {
      setDragIndex(index);
      setDragItemId(itemId ?? null);
      setDragItemInstanceId(itemInstanceId ?? null);
      setDragSource("inventory");
      if (onClearTooltip) {
        onClearTooltip();
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },
    [
      onClearTooltip,
      setDragIndex,
      setDragItemId,
      setDragItemInstanceId,
      setDragSource
    ]
  );

  const handleEquippedDragStart = useCallback(
    (event, itemId, itemInstanceId) => {
      if (!itemId) {
        return;
      }
      setDragIndex(null);
      setDragItemId(itemId);
      setDragItemInstanceId(itemInstanceId ?? null);
      setDragSource("equipped");
      if (onClearTooltip) {
        onClearTooltip();
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "equipped-bag");
    },
    [
      onClearTooltip,
      setDragIndex,
      setDragItemId,
      setDragItemInstanceId,
      setDragSource
    ]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return {
    handleInventoryDragStart,
    handleEquippedDragStart,
    handleDragOver
  };
};

const useDragGlobalListeners = ({ dragSource, resetDrag }) => {
  useEffect(() => {
    if (!dragSource) {
      return;
    }

    const handleGlobalDragOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };

    const handleGlobalDrop = (event) => {
      event.preventDefault();
      resetDrag();
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, [dragSource, resetDrag]);
};

export const useInventoryDragState = ({ onClearTooltip }) => {
  const {
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSource,
    setDragIndex,
    setDragItemId,
    setDragItemInstanceId,
    setDragSource,
    resetDrag
  } = useDragState();
  const {
    handleInventoryDragStart,
    handleEquippedDragStart,
    handleDragOver
  } = useDragHandlers({
    onClearTooltip,
    setDragIndex,
    setDragItemId,
    setDragItemInstanceId,
    setDragSource
  });

  useDragGlobalListeners({ dragSource, resetDrag });

  return {
    dragIndex,
    dragItemId,
    dragItemInstanceId,
    dragSource,
    resetDrag,
    handleInventoryDragStart,
    handleEquippedDragStart,
    handleDragOver
  };
};

export const useInventoryDragCallbacks = ({
  visibleBagSlots,
  equippedBagId,
  equippedBagItemId,
  handleInventoryDragStart,
  handleEquippedDragStart,
  resetDrag
}) => {
  const handleDragStart = useCallback(
    (event, index) => {
      handleInventoryDragStart(
        event,
        index,
        visibleBagSlots[index]?.id ?? null,
        visibleBagSlots[index]?.instanceId ?? null
      );
    },
    [handleInventoryDragStart, visibleBagSlots]
  );

  const handleDragEnd = useCallback(() => {
    resetDrag();
  }, [resetDrag]);

  const handleEquippedBagDragStart = useCallback(
    (event) => {
      handleEquippedDragStart(event, equippedBagItemId, equippedBagId);
    },
    [handleEquippedDragStart, equippedBagItemId, equippedBagId]
  );

  return {
    handleDragStart,
    handleDragEnd,
    handleEquippedBagDragStart
  };
};
