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


def _extract_string_list(block: str, field: str) -> list[str]:
    match = re.search(rf"{field}\s*:\s*\[(.*?)\]", block, re.S)
    if not match:
        return []
    inner = match.group(1)
    return re.findall(r"\"([^\"]+)\"", inner)


def parse_stats(stats_path: Path) -> list[dict]:
    if not stats_path.exists():
        return []
    text = stats_path.read_text(encoding="utf-8")
    body = _extract_array_body(text, "STATS")
    if body is None:
        return []
    stats: list[dict] = []
    for block in _parse_object_blocks(body):
        stat_id = extract_field(block, "id")
        label = extract_field(block, "label")
        if not stat_id or not label:
            continue
        sources = _extract_string_list(block, "sources")
        effects = _extract_string_list(block, "effects")
        stats.append(
            {
                "id": stat_id,
                "label": label,
                "sources": sources,
                "effects": effects
            }
        )
    return stats
