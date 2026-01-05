from pathlib import Path
import re

from constants import IMPORT_RE
from game_io.parse_utils import (
    extract_export_block,
    extract_field,
    extract_icon_var,
    extract_number,
    parse_item_blocks
)


def parse_currency_file(file_path: Path) -> dict | None:
    text = file_path.read_text(encoding="utf-8")
    import_map = {
        name: (file_path.parent / path).resolve()
        for name, path in IMPORT_RE.findall(text)
    }

    block = extract_export_block(text)
    if not block:
        return None
    item_id = extract_field(block, "id") or file_path.stem
    name = extract_field(block, "name") or item_id
    category = extract_field(block, "categoryId") or "misc"
    rarity = extract_field(block, "rarity") or "common"
    item_type = extract_field(block, "type") or "unknown"
    max_stack = extract_number(block, "maxStack") or 0
    accent = extract_field(block, "accent") or "n/a"
    icon_var = extract_icon_var(block)
    icon_path = import_map.get(icon_var) if icon_var else None

    return {
        "id": item_id,
        "name": name,
        "categoryId": category,
        "rarity": rarity,
        "type": item_type,
        "maxStack": max_stack,
        "accent": accent,
        "icon": icon_path
    }


def parse_currencies(data_path: Path) -> list[dict]:
    if data_path.is_dir():
        items = []
        for file_path in data_path.iterdir():
            if not file_path.is_file() or file_path.suffix != ".js":
                continue
            if file_path.name == "index.js":
                continue
            item = parse_currency_file(file_path)
            if item:
                items.append(item)
        return items

    text = data_path.read_text(encoding="utf-8")
    import_map = {
        name: (data_path.parent / path).resolve()
        for name, path in IMPORT_RE.findall(text)
    }

    start = text.find("export const CURRENCIES")
    if start == -1:
        return []
    brace_start = text.find("{", start)
    if brace_start == -1:
        return []

    level = 0
    end = None
    for index, char in enumerate(text[brace_start:]):
        if char == "{":
            level += 1
        elif char == "}":
            level -= 1
            if level == 0:
                end = brace_start + index
                break
    if end is None:
        return []

    body = text[brace_start + 1 : end]
    items = []
    for key, block in parse_item_blocks(body):
        item_id = extract_field(block, "id") or key
        name = extract_field(block, "name") or item_id
        category = extract_field(block, "categoryId") or "misc"
        rarity = extract_field(block, "rarity") or "common"
        item_type = extract_field(block, "type") or "unknown"
        max_stack = extract_number(block, "maxStack") or 0
        accent = extract_field(block, "accent") or "n/a"
        icon_var = extract_icon_var(block)
        icon_path = import_map.get(icon_var) if icon_var else None

        items.append(
            {
                "id": item_id,
                "name": name,
                "categoryId": category,
                "rarity": rarity,
                "type": item_type,
                "maxStack": max_stack,
                "accent": accent,
                "icon": icon_path
            }
        )

    return items


def parse_bag_capacities(bags_path: Path) -> dict[str, int]:
    if not bags_path.exists():
        return {}
    text = bags_path.read_text(encoding="utf-8")
    results: dict[str, int] = {}
    for match in re.finditer(
        r'(\w+)\s*:\s*\{\s*id\s*:\s*"[^"]+"\s*,\s*itemId\s*:\s*"([^"]+)"\s*,\s*capacity\s*:\s*([0-9]+)\s*\}',
        text
    ):
        item_id = match.group(2)
        capacity = int(match.group(3))
        results[item_id] = capacity
    return results
