import re
from pathlib import Path

from game_io.parse_utils import extract_field


def _extract_array_body(text: str, name: str) -> str | None:
    match = re.search(rf"export\s+const\s+{name}\s*=\s*\[", text)
    if not match:
        return None
    start = match.end()
    level = 1
    index = start
    while index < len(text):
        char = text[index]
        if char == "[":
            level += 1
        elif char == "]":
            level -= 1
            if level == 0:
                return text[start:index]
        index += 1
    return None


def _parse_object_blocks(body: str) -> list[str]:
    blocks: list[str] = []
    index = 0
    length = len(body)
    while index < length:
        while index < length and body[index] in " \t\r\n,":
            index += 1
        if index >= length:
            break
        if body[index] != "{":
            index += 1
            continue
        level = 0
        start = index
        while index < length:
            if body[index] == "{":
                level += 1
            elif body[index] == "}":
                level -= 1
                if level == 0:
                    blocks.append(body[start + 1 : index])
                    index += 1
                    break
            index += 1
    return blocks


def _extract_stats_block(block: str) -> str | None:
    match = re.search(r"stats\s*:\s*\{", block)
    if not match:
        return None
    start = match.end()
    level = 1
    index = start
    while index < len(block):
        char = block[index]
        if char == "{":
            level += 1
        elif char == "}":
            level -= 1
            if level == 0:
                return block[start:index]
        index += 1
    return None


def _parse_stats_map(stats_body: str) -> dict:
    stats: dict[str, float] = {}
    for key, value in re.findall(r"([A-Za-z0-9_]+)\s*:\s*([0-9.+-]+)", stats_body):
        try:
            stats[key] = float(value)
        except ValueError:
            continue
    return stats


def parse_perks(perks_path: Path) -> list[dict]:
    if not perks_path.exists():
        return []
    text = perks_path.read_text(encoding="utf-8")
    body = _extract_array_body(text, "PERKS")
    if body is None:
        return []
    perks: list[dict] = []
    for block in _parse_object_blocks(body):
        perk_id = extract_field(block, "id")
        name = extract_field(block, "name")
        stats_body = _extract_stats_block(block)
        stats = _parse_stats_map(stats_body) if stats_body else {}
        if not perk_id or not name:
            continue
        perks.append({"id": perk_id, "name": name, "stats": stats})
    return perks
