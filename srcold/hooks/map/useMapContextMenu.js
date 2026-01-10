import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function useMapContextMenu({ isOpen }) {
  const [mapMenu, setMapMenu] = useState(null);
  const menuRef = useRef(null);

  const openMenu = (event, payload) => {
    if (!isOpen) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setMapMenu({
      x: event.clientX,
      y: event.clientY,
      ...payload
    });
  };

  const closeMenu = () => setMapMenu(null);

  useEffect(() => {
    if (!mapMenu) {
      return;
    }

    const handleClose = () => closeMenu();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeMenu();
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
  }, [mapMenu]);

  useLayoutEffect(() => {
    if (!mapMenu || !menuRef.current) {
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    const nextX = mapMenu.x > maxX ? Math.max(padding, maxX) : mapMenu.x;
    const nextY = mapMenu.y > maxY ? Math.max(padding, maxY) : mapMenu.y;

    if (nextX === mapMenu.x && nextY === mapMenu.y) {
      return;
    }

    setMapMenu((prev) =>
      prev
        ? {
            ...prev,
            x: nextX,
            y: nextY
          }
        : prev
    );
  }, [mapMenu]);

  return {
    mapMenu,
    menuRef,
    openMenu,
    closeMenu
  };
}
