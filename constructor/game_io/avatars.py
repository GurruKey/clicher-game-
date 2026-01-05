from pathlib import Path
import os
import re

from constants import IMPORT_RE
from game_io.parse_utils import (
    extract_asset_var,
    extract_export_block,
    extract_field,
    extract_float,
    extract_icon_var,
    extract_number
)


def parse_avatar_file(
    file_path: Path,
    race_variants: dict[str, dict] | None = None,
    races: dict[str, dict] | None = None
) -> dict | None:
    text = file_path.read_text(encoding="utf-8")
    import_map = {
        name: (file_path.parent / path).resolve()
        for name, path in IMPORT_RE.findall(text)
    }

    block = extract_export_block(text)
    if not block:
        return None

    avatar_id = extract_field(block, "id") or file_path.stem
    name = extract_field(block, "name") or avatar_id
    race_variant_id = extract_field(block, "raceVariantId")
    race = extract_field(block, "race") or "Unknown"
    race_level = extract_number(block, "raceLevel") or 1
    subrace_variant_id = extract_field(block, "subraceVariantId")
    subrace = extract_field(block, "subrace") or "Unknown"
    subrace_level = extract_number(block, "subraceLevel") or 1
    gender = extract_field(block, "gender") or "Unknown"
    origin = extract_field(block, "origin") or "Unknown"
    origin_level = extract_number(block, "originLevel") or 1
    faction = extract_field(block, "faction") or "Unknown"
    faction_level = extract_number(block, "factionLevel") or 1
    subfaction = extract_field(block, "subfaction") or "Unknown"
    subfaction_level = extract_number(block, "subfactionLevel") or 1
    faction_subtype = extract_field(block, "factionSubtype") or "Unknown"
    faction_subtype_level = extract_number(block, "factionSubtypeLevel") or 1
    icon_scale = extract_float(block, "iconScale") or 1
    bg_scale = extract_float(block, "bgScale") or 1
    icon_var = extract_icon_var(block)
    bg_var = extract_asset_var(block, "bg")
    icon_path = import_map.get(icon_var) if icon_var else None
    bg_path = import_map.get(bg_var) if bg_var else None

    icon_offset = {"x": 0, "y": 0}
    offset_match = re.search(
        r"iconOffset\s*:\s*\{\s*x\s*:\s*([0-9.+-]+)\s*,\s*y\s*:\s*([0-9.+-]+)\s*\}",
        block
    )
    if offset_match:
        icon_offset = {
            "x": float(offset_match.group(1)),
            "y": float(offset_match.group(2))
        }

    bg_offset = {"x": 0, "y": 0}
    bg_offset_match = re.search(
        r"bgOffset\s*:\s*\{\s*x\s*:\s*([0-9.+-]+)\s*,\s*y\s*:\s*([0-9.+-]+)\s*\}",
        block
    )
    if bg_offset_match:
        bg_offset = {
            "x": float(bg_offset_match.group(1)),
            "y": float(bg_offset_match.group(2))
        }

    if race_variant_id and race_variants:
        variant = race_variants.get(race_variant_id)
        if variant:
            race_id = variant.get("raceId")
            if race_id and races:
                race = races.get(race_id, {}).get("name", race_id)
            elif race_id:
                race = race_id
            race_level = variant.get("level", race_level)

    if subrace_variant_id and race_variants:
        variant = race_variants.get(subrace_variant_id)
        if variant:
            subrace_id = variant.get("raceId")
            if subrace_id and races:
                subrace = races.get(subrace_id, {}).get("name", subrace_id)
            elif subrace_id:
                subrace = subrace_id
            subrace_level = variant.get("level", subrace_level)

    return {
        "id": avatar_id,
        "name": name,
        "race": race,
        "raceLevel": race_level,
        "raceVariantId": race_variant_id,
        "subrace": subrace,
        "subraceLevel": subrace_level,
        "subraceVariantId": subrace_variant_id,
        "gender": gender,
        "origin": origin,
        "originLevel": origin_level,
        "faction": faction,
        "factionLevel": faction_level,
        "subfaction": subfaction,
        "subfactionLevel": subfaction_level,
        "factionSubtype": faction_subtype,
        "factionSubtypeLevel": faction_subtype_level,
        "iconOffset": icon_offset,
        "iconScale": icon_scale,
        "bgOffset": bg_offset,
        "bgScale": bg_scale,
        "icon": icon_path,
        "bg": bg_path,
        "iconVar": icon_var,
        "bgVar": bg_var,
        "file": file_path
    }


def parse_avatars(
    avatars_root: Path,
    race_variants: dict[str, dict] | None = None,
    races: dict[str, dict] | None = None
) -> list[dict]:
    avatars: list[dict] = []
    if not avatars_root.exists():
        return avatars

    for file_path in avatars_root.iterdir():
        if not file_path.is_file() or file_path.suffix != ".js":
            continue
        if file_path.name in ("index.js", "defaults.js"):
            continue

        avatar = parse_avatar_file(
            file_path,
            race_variants=race_variants,
            races=races
        )
        if avatar:
            avatars.append(avatar)

    avatars.sort(key=lambda item: item["name"].lower())
    return avatars


def update_avatar_asset(avatar_file: Path, asset_var: str | None, new_path: Path) -> bool:
    if not avatar_file.exists() or not asset_var:
        return False
    text = avatar_file.read_text(encoding="utf-8")
    rel_path = os.path.relpath(new_path, avatar_file.parent).replace("\\", "/")
    if not rel_path.startswith("."):
        rel_path = f"./{rel_path}"
    pattern = rf'(import\s+{re.escape(asset_var)}\s+from\s+\")([^\"]+)(\")'
    updated, count = re.subn(pattern, rf"\1{rel_path}\3", text)
    if count == 0:
        return False
    avatar_file.write_text(updated, encoding="utf-8")
    return True


def update_avatar_offset(avatar_file: Path, field: str, offset: dict) -> bool:
    if not avatar_file.exists():
        return False
    text = avatar_file.read_text(encoding="utf-8")
    def format_number(value: float) -> str:
        try:
            number = float(value)
        except (TypeError, ValueError):
            number = 0.0
        formatted = f"{number:.6f}".rstrip("0").rstrip(".")
        if formatted in ("", "-0"):
            return "0"
        return formatted

    x_value = format_number(offset.get("x", 0))
    y_value = format_number(offset.get("y", 0))
    pattern = rf"({re.escape(field)}\s*:\s*\{{\s*x\s*:\s*)([0-9.+-]+)(\s*,\s*y\s*:\s*)([0-9.+-]+)(\s*\}})"
    replacement = rf"\g<1>{x_value}\g<3>{y_value}\g<5>"
    updated, count = re.subn(pattern, replacement, text)
    if count == 0:
        fallback_pattern = rf"{re.escape(field)}\s*:\s*\{{[^}}]*\}}"
        fallback_replacement = f"{field}: {{ x: {x_value}, y: {y_value} }}"
        updated, count = re.subn(fallback_pattern, fallback_replacement, text)
    if count == 0:
        return False
    avatar_file.write_text(updated, encoding="utf-8")
    return True


def update_avatar_scale(avatar_file: Path, field: str, value: float) -> bool:
    if not avatar_file.exists():
        return False
    text = avatar_file.read_text(encoding="utf-8")
    def format_number(value: float) -> str:
        try:
            number = float(value)
        except (TypeError, ValueError):
            number = 0.0
        formatted = f"{number:.6f}".rstrip("0").rstrip(".")
        if formatted in ("", "-0"):
            return "0"
        return formatted

    value_text = format_number(value)
    pattern = rf"({re.escape(field)}\s*:\s*)([0-9.+-]+)"
    replacement = rf"\g<1>{value_text}"
    updated, count = re.subn(pattern, replacement, text)
    if count == 0:
        fallback_pattern = rf"{re.escape(field)}\s*:\s*[^,\n]+"
        updated, count = re.subn(fallback_pattern, f"{field}: {value_text}", text)
    if count == 0:
        return False
    avatar_file.write_text(updated, encoding="utf-8")
    return True
