from pathlib import Path
import re

from game_io.parse_utils import extract_field, extract_number


def parse_race_variants(variants_root: Path) -> list[dict]:
    variants: list[dict] = []
    if not variants_root.exists():
        return variants

    for file_path in variants_root.rglob("*.js"):
        parts = file_path.relative_to(variants_root).parts
        if "races" in parts or "levels" in parts or "tags" in parts:
            continue
        if file_path.name == "index.js":
            continue
        text = file_path.read_text(encoding="utf-8")
        variant_id = extract_field(text, "id") or file_path.stem
        race_id = extract_field(text, "raceId") or "unknown"
        level = extract_number(text, "level") or 1
        level_id = extract_field(text, "levelId")
        if not level_id:
            level_id = f"level_{level}"
        description = extract_field(text, "description")
        dev_note = extract_field(text, "devNote")
        stats = _extract_stats(text)
        perks = _extract_perks(text)
        variants.append(
            {
                "id": variant_id,
                "raceId": race_id,
                "level": level,
                "levelId": level_id,
                "stats": stats,
                "perks": perks,
                "description": description,
                "devNote": dev_note
            }
        )

    variants.sort(key=lambda item: item["id"].lower())
    return variants


def _extract_stats(text: str) -> dict:
    match = re.search(r"stats\s*:\s*\{(.*?)\}", text, re.S)
    if not match:
        return {}
    body = match.group(1)
    stats: dict[str, float] = {}
    for key, value in re.findall(r"([A-Za-z0-9_]+)\s*:\s*([0-9.+-]+)", body):
        try:
            num = float(value)
        except ValueError:
            continue
        stats[key] = int(num) if num.is_integer() else num
    return stats


def _extract_perks(text: str) -> list[str]:
    match = re.search(r"perks\s*:\s*\[(.*?)\]", text, re.S)
    if not match:
        return []
    body = match.group(1)
    return re.findall(r"\"([^\"]+)\"", body)
