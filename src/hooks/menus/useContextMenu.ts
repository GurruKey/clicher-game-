import { useEffect, useLayoutEffect, useRef, useState } from "react";

type ContextMenuBase = { x: number; y: number } & Record<string, unknown>;

/**
 * Mirrors legacy logic.
 */
export default function useContextMenu<T extends ContextMenuBase>() {
  const [contextMenu, setContextMenu] = useState<T | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openContextMenu = (
    event: {
      preventDefault: () => void;
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    },
    payload: Record<string, unknown>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, ...(payload as any) } as T);
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      // Only close on primary button / tap. Right-click is used to open menus.
      if (typeof event.button === "number" && event.button !== 0) return;
      const el = menuRef.current;
      if (el && event.target && el.contains(event.target as Node)) {
        return;
      }
      // Проверяем, не является ли нажатие попыткой открыть новое меню (правой кнопкой)
      // Хотя этот обработчик на pointerdown, обычно контекстное меню открывается по contextmenu
      closeContextMenu();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeContextMenu();
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true } as any);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    const nextX = contextMenu.x > maxX ? Math.max(padding, maxX) : contextMenu.x;
    const nextY = contextMenu.y > maxY ? Math.max(padding, maxY) : contextMenu.y;

    if (Math.abs(nextX - contextMenu.x) < 1 && Math.abs(nextY - contextMenu.y) < 1) return;

    setContextMenu((prev) => (prev ? ({ ...prev, x: nextX, y: nextY } as T) : prev));
  }, [contextMenu]);

  return { contextMenu, menuRef, openContextMenu, closeContextMenu };
}
