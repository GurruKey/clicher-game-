import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  const openContextMenu = (event, payload) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      ...payload
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const handleClose = () => closeContextMenu();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("contextmenu", handleClose);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("contextmenu", handleClose);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) {
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    const nextX =
      contextMenu.x > maxX ? Math.max(padding, maxX) : contextMenu.x;
    const nextY =
      contextMenu.y > maxY ? Math.max(padding, maxY) : contextMenu.y;

    if (nextX === contextMenu.x && nextY === contextMenu.y) {
      return;
    }

    setContextMenu((prev) =>
      prev
        ? {
            ...prev,
            x: nextX,
            y: nextY
          }
        : prev
    );
  }, [contextMenu]);

  return {
    contextMenu,
    menuRef,
    openContextMenu,
    closeContextMenu
  };
}
