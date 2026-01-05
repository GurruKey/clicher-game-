import re


IMPORT_RE = re.compile(r'import\s+(\w+)\s+from\s+"([^"]+)"')

DEFAULT_RARITY_COLORS = {
  "common": "#a39a8d",
  "uncommon": "#6fb86d",
  "rare": "#6da3d6",
  "epic": "#d08a4b",
  "legendary": "#f5d36b"
}

RARITY_ORDER_FALLBACK = ["common", "uncommon", "rare", "epic", "legendary"]

TOOLTIP_BG = "#0f0c09"
TOOLTIP_BORDER = "#caa44a"
SLOT_BG = "#0f0c09"
SLOT_BORDER = "#3a3328"

AVATAR_FOCUS_BASE = 160
