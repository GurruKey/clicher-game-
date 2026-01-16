import json
import re
from pathlib import Path


def parse_stats_config(stats_dir: Path) -> list[dict]:
    config_file = stats_dir / "display_config.js"
    if not config_file.exists():
        return []

    text = config_file.read_text(encoding="utf-8")

    # Regex used to extract the exported config array.
    match = re.search(r"export const STATS_DISPLAY_CONFIG = (\[.*\]);", text, re.S)
    if not match:
        return []

    try:
        # Simplified parsing of JS-like JSON.
        content = match.group(1)

        # Replace unquoted keys to make it compatible with json.loads if needed.
        cleaned = re.sub(r"(\w+):", r'"\1":', content)
        cleaned = cleaned.replace("'", '"')

        # Remove trailing commas before closing brackets.
        cleaned = re.sub(r",\s*([\]\}])", r"\1", cleaned)
        return json.loads(cleaned)
    except Exception:
        return []


def save_stats_config(stats_dir: Path, config: list[dict]) -> None:
    config_file = stats_dir / "display_config.js"

    json_str = json.dumps(config, indent=2, ensure_ascii=False)

    # Convert back to a JS export format.
    js_content = f"export const STATS_DISPLAY_CONFIG = {json_str};\n"

    config_file.write_text(js_content, encoding="utf-8")

