export const DEFAULT_KEYBINDS = {
  resetProgress: "BracketRight",
  openMap: "KeyM",
  toggleBag: "KeyB",
  toggleFullscreen: "F10",
  useSkill1: "Digit1",
  useSkill2: "Digit2",
  useSkill3: "Digit3",
  useSkill4: "Digit4",
  useSkill5: "Digit5",
  useSkill6: "Digit6",
  useSkill7: "Digit7",
  useSkill8: "Digit8",
  useSkill9: "Digit9",
  useSkill10: "Digit0",
  useSkill2_1: "",
  useSkill2_2: "",
  useSkill2_3: "",
  useSkill2_4: "",
  useSkill2_5: "",
  useSkill2_6: "",
  useSkill2_7: "",
  useSkill2_8: "",
  useSkill2_9: "",
  useSkill2_10: ""
};

export const KEYBIND_ACTIONS = [
  { id: "resetProgress", label: "Delete Progress" },
  { id: "openMap", label: "Map" },
  { id: "toggleBag", label: "Bag" },
  { id: "toggleFullscreen", label: "Fullscreen" },
  { id: "useSkill1", label: "Skill 1" },
  { id: "useSkill2", label: "Skill 2" },
  { id: "useSkill3", label: "Skill 3" },
  { id: "useSkill4", label: "Skill 4" },
  { id: "useSkill5", label: "Skill 5" },
  { id: "useSkill6", label: "Skill 6" },
  { id: "useSkill7", label: "Skill 7" },
  { id: "useSkill8", label: "Skill 8" },
  { id: "useSkill9", label: "Skill 9" },
  { id: "useSkill10", label: "Skill 0" },
  { id: "useSkill2_1", label: "Skill Bar 2 - 1" },
  { id: "useSkill2_2", label: "Skill Bar 2 - 2" },
  { id: "useSkill2_3", label: "Skill Bar 2 - 3" },
  { id: "useSkill2_4", label: "Skill Bar 2 - 4" },
  { id: "useSkill2_5", label: "Skill Bar 2 - 5" },
  { id: "useSkill2_6", label: "Skill Bar 2 - 6" },
  { id: "useSkill2_7", label: "Skill Bar 2 - 7" },
  { id: "useSkill2_8", label: "Skill Bar 2 - 8" },
  { id: "useSkill2_9", label: "Skill Bar 2 - 9" },
  { id: "useSkill2_10", label: "Skill Bar 2 - 0" }
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
  if (!code) return "Unbound";
  if (KEYBIND_LABELS[code]) return KEYBIND_LABELS[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num ${code.slice(6)}`;
  return code;
};

export const normalizeKeybind = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.length === 1) {
    if (CHAR_TO_CODE[value]) return CHAR_TO_CODE[value];
    if (value >= "a" && value <= "z") return `Key${value.toUpperCase()}`;
    if (value >= "A" && value <= "Z") return `Key${value}`;
    if (value >= "0" && value <= "9") return `Digit${value}`;
  }
  if (value === "Esc") return "Escape";
  if (value === "Spacebar") return "Space";
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
