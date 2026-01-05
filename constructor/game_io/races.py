from pathlib import Path
import re

from game_io.parse_utils import extract_field


def parse_races(races_root: Path) -> list[dict]:
    races: list[dict] = []
    if not races_root.exists():
        return races

    for file_path in races_root.iterdir():
        if not file_path.is_file() or file_path.suffix != ".js":
            continue
        if file_path.name == "index.js":
            continue
        text = file_path.read_text(encoding="utf-8")
        race_id = extract_field(text, "id") or file_path.stem
        name = extract_field(text, "name") or race_id
        tag_ids = _extract_tags(text)
        races.append({"id": race_id, "name": name, "tagIds": tag_ids})

    races.sort(key=lambda item: item["name"].lower())
    return races


def _extract_tags(text: str) -> list[str]:
    match = re.search(r"tagIds\s*:\s*\[(.*?)\]", text, re.S)
    if not match:
        return []
    body = match.group(1)
    return re.findall(r"\"([^\"]+)\"", body)


def save_race(
    races_root: Path,
    race_id: str,
    name: str,
    tag_ids: list[str]
) -> None:
    races_root.mkdir(parents=True, exist_ok=True)
    const_name = _race_const_name(race_id)
    lines = [
        f"export const {const_name} = {{",
        f"  id: \"{race_id}\",",
        f"  name: \"{name}\","
    ]
    if tag_ids:
        tags = ", ".join(f"\"{tag}\"" for tag in tag_ids)
        lines.append(f"  tagIds: [{tags}]")
    else:
        lines.append("  tagIds: []")
    lines.append("};")
    (races_root / f"{race_id}.js").write_text("\n".join(lines), encoding="utf-8")
    write_race_index(races_root)


def write_race_index(races_root: Path) -> None:
    races = parse_races(races_root)
    imports = []
    export_names = []
    for race in races:
        const_name = _race_const_name(race["id"])
        imports.append(f"import {{ {const_name} }} from \"./{race['id']}.js\";")
        export_names.append(const_name)

    lines = [*imports, "", f"export const RACES = [{', '.join(export_names)}];", ""]
    lines.extend(
        [
            "const RACE_BY_ID = Object.fromEntries(",
            "  RACES.map((race) => [race.id, race])",
            ");",
            "",
            "export function getRaceById(id) {",
            "  if (!id) {",
            "    return null;",
            "  }",
            "  return RACE_BY_ID[id] ?? null;",
            "}",
            ""
        ]
    )
    (races_root / "index.js").write_text("\n".join(lines), encoding="utf-8")


def _race_const_name(race_id: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "_", race_id).upper()
    if cleaned and cleaned[0].isdigit():
        cleaned = f"RACE_{cleaned}"
    return f"{cleaned}_RACE"
