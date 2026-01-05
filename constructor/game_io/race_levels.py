from pathlib import Path
import re

from game_io.parse_utils import extract_field, extract_number


def parse_race_levels(levels_root: Path) -> list[dict]:
    levels: list[dict] = []
    if not levels_root.exists():
        return levels

    for file_path in levels_root.iterdir():
        if not file_path.is_file() or file_path.suffix != ".js":
            continue
        if file_path.name == "index.js":
            continue
        text = file_path.read_text(encoding="utf-8")
        level_id = extract_field(text, "id") or file_path.stem
        level_number = extract_number(text, "level") or 1
        label = extract_field(text, "label")
        stat_budget = extract_number(text, "statBudget")
        stat_budget_range = _extract_range(text, "statBudgetRange")
        perk_range = _extract_perk_range(text)
        notes = _extract_notes(text)
        levels.append(
            {
                "id": level_id,
                "level": level_number,
                "label": label,
                "statBudget": stat_budget,
                "statBudgetRange": stat_budget_range,
                "perkRange": perk_range,
                "notes": notes
            }
        )

    levels.sort(key=lambda item: item["level"])
    return levels


def _extract_perk_range(text: str) -> dict | None:
    return _extract_range(text, "perkRange")


def _extract_range(text: str, field: str) -> dict | None:
    match = re.search(rf"{re.escape(field)}\s*:\s*\{{(.*?)\}}", text, re.S)
    if not match:
        return None
    body = match.group(1)
    min_value = extract_number(body, "min")
    max_value = extract_number(body, "max")
    if min_value is None and max_value is None:
        return None
    return {"min": min_value, "max": max_value}


def _extract_notes(text: str) -> list[str]:
    list_match = re.search(r"notes\s*:\s*\[(.*?)\]", text, re.S)
    if list_match:
        return re.findall(r"\"([^\"]+)\"", list_match.group(1))
    single = extract_field(text, "notes")
    if single:
        return [single]
    return []


def save_race_level(levels_root: Path, level: dict) -> None:
    levels_root.mkdir(parents=True, exist_ok=True)
    level_id = level["id"]
    const_name = _level_const_name(level_id)
    lines = [
        f"export const {const_name} = {{",
        f"  id: \"{level_id}\",",
        f"  level: {level.get('level', 1)},"
    ]
    label = level.get("label")
    if label:
        lines.append(f"  label: \"{label}\",")
    stat_range = level.get("statBudgetRange")
    if stat_range:
        lines.extend(
            [
                "  statBudgetRange: {",
                f"    min: {stat_range.get('min')},",
                f"    max: {stat_range.get('max')}",
                "  },"
            ]
        )
    stat_budget = level.get("statBudget")
    if stat_budget is not None and not stat_range:
        lines.append(f"  statBudget: {stat_budget},")
    perk_range = level.get("perkRange")
    if perk_range:
        lines.extend(
            [
                "  perkRange: {",
                f"    min: {perk_range.get('min')},",
                f"    max: {perk_range.get('max')}",
                "  },"
            ]
        )
    notes = level.get("notes") or []
    if notes:
        notes_blob = ", ".join(f"\"{note}\"" for note in notes)
        lines.append(f"  notes: [{notes_blob}]")
    lines.append("};")
    (levels_root / f"{level_id}.js").write_text("\n".join(lines), encoding="utf-8")
    write_race_level_index(levels_root)


def delete_race_level(levels_root: Path, level_id: str) -> None:
    target = levels_root / f"{level_id}.js"
    if target.exists():
        target.unlink()
    write_race_level_index(levels_root)


def write_race_level_index(levels_root: Path) -> None:
    levels = parse_race_levels(levels_root)
    imports = []
    export_names = []
    for level in levels:
        const_name = _level_const_name(level["id"])
        imports.append(f"import {{ {const_name} }} from \"./{level['id']}.js\";")
        export_names.append(const_name)

    lines = [*imports, "", f"export const RACE_LEVELS = [{', '.join(export_names)}];", ""]
    lines.extend(
        [
            "const LEVEL_BY_ID = Object.fromEntries(",
            "  RACE_LEVELS.map((level) => [level.id, level])",
            ");",
            "",
            "const LEVEL_BY_NUMBER = Object.fromEntries(",
            "  RACE_LEVELS.map((level) => [level.level, level])",
            ");",
            "",
            "export function getRaceLevelById(id) {",
            "  if (!id) {",
            "    return null;",
            "  }",
            "  return LEVEL_BY_ID[id] ?? null;",
            "}",
            "",
            "export function getRaceLevelByNumber(levelNumber) {",
            "  if (levelNumber === null || levelNumber === undefined) {",
            "    return null;",
            "  }",
            "  return LEVEL_BY_NUMBER[levelNumber] ?? null;",
            "}",
            ""
        ]
    )
    (levels_root / "index.js").write_text("\n".join(lines), encoding="utf-8")


def _level_const_name(level_id: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "_", level_id).upper()
    if cleaned and cleaned[0].isdigit():
        cleaned = f"LEVEL_{cleaned}"
    return f"RACE_{cleaned}"
