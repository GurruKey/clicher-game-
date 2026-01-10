import { useState } from "react";

const useBasicDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close };
};

export const useCharacterDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [gearLayer, setGearLayer] = useState("outer");

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);
  const toggleLayer = () => {
    setGearLayer((prev) => (prev === "outer" ? "inner" : "outer"));
  };

  return {
    isOpen,
    open,
    close,
    toggle,
    gearLayer,
    toggleLayer
  };
};

export const useLocationDialog = () => useBasicDialog();

export const useMapDialog = () => useBasicDialog();

export const useSettingsDialog = () => useBasicDialog();

export const useStatsDialog = () => useBasicDialog();

export const useBloodlineDialog = () => useBasicDialog();

export const usePerksDialog = () => useBasicDialog();

export const useKeybindsDialog = () => useBasicDialog();
