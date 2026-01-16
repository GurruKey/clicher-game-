import { useLayoutEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function useMapPanZoom(params: {
  isOpen: boolean;
  onDragStart?: () => void;
  focusOffset?: { x?: number; y?: number };
}) {
  const { isOpen, onDragStart, focusOffset } = params;

  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
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

function useMapBounds(params: {
  isOpen: boolean;
  mapRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}) {
  const { isOpen, mapRef, canvasRef, zoom, setOffset } = params;
  const boundsRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

  useLayoutEffect(() => {
    if (!isOpen) return;

    const mapEl = mapRef.current;
    const canvasEl = canvasRef.current;
    if (!mapEl || !canvasEl) return;

    const updateBounds = () => {
      const mapWidth = mapEl.offsetWidth;
      const mapHeight = mapEl.offsetHeight;
      const canvasWidth = canvasEl.offsetWidth * zoom;
      const canvasHeight = canvasEl.offsetHeight * zoom;
      const maxX = Math.max(0, (canvasWidth - mapWidth) / 2);
      const maxY = Math.max(0, (canvasHeight - mapHeight) / 2);
      boundsRef.current = { minX: -maxX, maxX, minY: -maxY, maxY };
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

function useMapDrag(params: {
  mapRef: React.RefObject<HTMLDivElement>;
  boundsRef: React.MutableRefObject<{ minX: number; maxX: number; minY: number; maxY: number }>;
  offset: { x: number; y: number };
  setOffset: (next: { x: number; y: number }) => void;
  onDragStart?: () => void;
}) {
  const { mapRef, boundsRef, offset, setOffset, onDragStart } = params;
  const dragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    onDragStart?.();

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y
    };
    mapRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const { startX, startY, baseX, baseY } = dragRef.current;

    const nextX = clamp(baseX + (event.clientX - startX), boundsRef.current.minX, boundsRef.current.maxX);
    const nextY = clamp(baseY + (event.clientY - startY), boundsRef.current.minY, boundsRef.current.maxY);
    setOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    dragRef.current.active = false;
    mapRef.current?.releasePointerCapture(event.pointerId);
  };

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

function useMapZoom(params: {
  zoom: number;
  setZoom: (next: number) => void;
  setOffset: (next: { x: number; y: number }) => void;
  onDragStart?: () => void;
  focusOffset?: { x?: number; y?: number };
}) {
  const { zoom, setZoom, setOffset, onDragStart, focusOffset } = params;

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    onDragStart?.();

    const nextZoom = clamp(zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.6, 1.6);
    if (nextZoom === zoom) return;
    setZoom(nextZoom);
  };

  const handleRecenter = () => {
    const target = focusOffset ?? { x: 0, y: 0 };
    setOffset({ x: target.x ?? 0, y: target.y ?? 0 });
    setZoom(1);
  };

  return { handleWheel, handleRecenter };
}
