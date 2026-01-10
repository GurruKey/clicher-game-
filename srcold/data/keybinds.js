export const DEFAULT_KEYBINDS = {
  resetProgress: "BracketRight",
  openMap: "KeyM",
  toggleBag: "KeyB"
};

export const KEYBIND_ACTIONS = [
  {
    id: "resetProgress",
    label: "Delete Progress"
  },
  {
    id: "openMap",
    label: "Map"
  },
  {
    id: "toggleBag",
    label: "Bag"
  }
];

const KEYBIND_LABELS = {
  BracketRight: "]",
  BracketLeft: "[",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Space: "Space",
  Escape: "Esc",
  Enter: "Enter",
  Tab: "Tab",
  Backspace: "Backspace"
};

const CHAR_TO_CODE = {
  "]": "BracketRight",
  "[": "BracketLeft",
  "\\": "Backslash",
  ";": "Semicolon",
  "'": "Quote",
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  "`": "Backquote",
  "-": "Minus",
  "=": "Equal",
  " ": "Space"
};

export const formatKeybind = (code) => {
  if (!code) {
    return "Unbound";
  }
  if (KEYBIND_LABELS[code]) {
    return KEYBIND_LABELS[code];
  }
  if (code.startsWith("Key")) {
    return code.slice(3);
  }
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }
  if (code.startsWith("Numpad")) {
    return `Num ${code.slice(6)}`;
  }
  return code;
};

export const normalizeKeybind = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  if (value.length === 1) {
    if (CHAR_TO_CODE[value]) {
      return CHAR_TO_CODE[value];
    }
    if (value >= "a" && value <= "z") {
      return `Key${value.toUpperCase()}`;
    }
    if (value >= "A" && value <= "Z") {
      return `Key${value}`;
    }
    if (value >= "0" && value <= "9") {
      return `Digit${value}`;
    }
  }
  if (value === "Esc") {
    return "Escape";
  }
  if (value === "Spacebar") {
    return "Space";
  }
  if (
    value.startsWith("Key") ||
    value.startsWith("Digit") ||
    value.startsWith("Numpad") ||
    KEYBIND_LABELS[value]
  ) {
    return value;
  }
  return value;
};
