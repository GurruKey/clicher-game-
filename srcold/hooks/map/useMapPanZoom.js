import { useLayoutEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function useMapPanZoom({ isOpen, onDragStart, focusOffset }) {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const boundsRef = useMapBounds({
    isOpen,
    mapRef,
    canvasRef,
    zoom,
    setOffset
  });
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useMapDrag({
    mapRef,
    boundsRef,
    offset,
    setOffset,
    onDragStart
  });
  const { handleWheel, handleRecenter } = useMapZoom({
    zoom,
    setZoom,
    setOffset,
    onDragStart,
    focusOffset
  });

  return {
    mapRef,
    canvasRef,
    offset,
    zoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleRecenter
  };
}

function useMapBounds({ isOpen, mapRef, canvasRef, zoom, setOffset }) {
  const boundsRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const mapEl = mapRef.current;
    const canvasEl = canvasRef.current;
    if (!mapEl || !canvasEl) {
      return;
    }

    const updateBounds = () => {
      const mapWidth = mapEl.offsetWidth;
      const mapHeight = mapEl.offsetHeight;
      const canvasWidth = canvasEl.offsetWidth * zoom;
      const canvasHeight = canvasEl.offsetHeight * zoom;
      const maxX = Math.max(0, (canvasWidth - mapWidth) / 2);
      const maxY = Math.max(0, (canvasHeight - mapHeight) / 2);
      boundsRef.current = {
        minX: -maxX,
        maxX,
        minY: -maxY,
        maxY
      };
      setOffset((prev) => ({
        x: clamp(prev.x, -maxX, maxX),
        y: clamp(prev.y, -maxY, maxY)
      }));
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [isOpen, zoom, mapRef, canvasRef, setOffset]);

  return boundsRef;
}

function useMapDrag({ mapRef, boundsRef, offset, setOffset, onDragStart }) {
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0
  });

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (onDragStart) {
      onDragStart();
    }

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y
    };
    mapRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current.active) {
      return;
    }

    const { startX, startY, baseX, baseY } = dragRef.current;
    const nextX = clamp(
      baseX + (event.clientX - startX),
      boundsRef.current.minX,
      boundsRef.current.maxX
    );
    const nextY = clamp(
      baseY + (event.clientY - startY),
      boundsRef.current.minY,
      boundsRef.current.maxY
    );
    setOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event) => {
    dragRef.current.active = false;
    mapRef.current?.releasePointerCapture(event.pointerId);
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}

function useMapZoom({ zoom, setZoom, setOffset, onDragStart, focusOffset }) {
  const handleWheel = (event) => {
    event.preventDefault();
    if (onDragStart) {
      onDragStart();
    }
    const delta = event.deltaY;
    const nextZoom = clamp(zoom + (delta > 0 ? -0.1 : 0.1), 0.6, 1.6);
    if (nextZoom === zoom) {
      return;
    }
    setZoom(nextZoom);
  };

  const handleRecenter = () => {
    const target = focusOffset ?? { x: 0, y: 0 };
    setOffset({ x: target.x ?? 0, y: target.y ?? 0 });
    setZoom(1);
  };

  return {
    handleWheel,
    handleRecenter
  };
}
