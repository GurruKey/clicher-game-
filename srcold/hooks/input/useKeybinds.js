import { useEffect, useState } from "react";
import { DEFAULT_KEYBINDS, normalizeKeybind } from "../../data/keybinds.js";
import { loadKeybinds, saveKeybinds } from "../../utils/keybindStorage.js";

const normalizeSavedKeybinds = (saved) => {
  if (!saved || typeof saved !== "object") {
    return null;
  }
  const normalized = {};
  Object.keys(DEFAULT_KEYBINDS).forEach((actionId) => {
    const value = normalizeKeybind(saved[actionId]);
    if (value) {
      normalized[actionId] = value;
    }
  });
  return Object.keys(normalized).length ? normalized : null;
};

const mergeKeybinds = (saved) => {
  const normalized = normalizeSavedKeybinds(saved);
  if (!normalized) {
    return { ...DEFAULT_KEYBINDS };
  }
  return {
    ...DEFAULT_KEYBINDS,
    ...normalized
  };
};

export default function useKeybinds() {
  const [keybinds, setKeybinds] = useState(() => mergeKeybinds(loadKeybinds()));

  useEffect(() => {
    saveKeybinds(keybinds);
  }, [keybinds]);

  const updateKeybind = (actionId, key) => {
    setKeybinds((prev) => ({
      ...prev,
      [actionId]: key
    }));
  };

  return {
    keybinds,
    updateKeybind
  };
}
