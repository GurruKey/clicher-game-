from pathlib import Path
import re

from game_io.parse_utils import extract_field


def parse_race_tags(tags_root: Path) -> list[dict]:
    tags: list[dict] = []
    if not tags_root.exists():
        return tags

    for file_path in tags_root.iterdir():
        if not file_path.is_file() or file_path.suffix != ".js":
            continue
        if file_path.name == "index.js":
            continue
        text = file_path.read_text(encoding="utf-8")
        tag_id = extract_field(text, "id") or file_path.stem
        label = extract_field(text, "label") or tag_id
        tags.append({"id": tag_id, "label": label})

    tags.sort(key=lambda item: item["label"].lower())
    return tags


def save_race_tag(tags_root: Path, tag_id: str, label: str | None = None) -> None:
    tags_root.mkdir(parents=True, exist_ok=True)
    tag_label = label or _to_label(tag_id)
    const_name = _tag_const_name(tag_id)
    content = (
        f"export const {const_name} = {{\n"
        f"  id: \"{tag_id}\",\n"
        f"  label: \"{tag_label}\"\n"
        f"}};\n"
    )
    (tags_root / f"{tag_id}.js").write_text(content, encoding="utf-8")
    write_race_tag_index(tags_root)


def write_race_tag_index(tags_root: Path) -> None:
    tags = parse_race_tags(tags_root)
    imports = []
    export_names = []
    for tag in tags:
        const_name = _tag_const_name(tag["id"])
        imports.append(f"import {{ {const_name} }} from \"./{tag['id']}.js\";")
        export_names.append(const_name)

    lines = [*imports, "", f"export const RACE_TAGS = [{', '.join(export_names)}];", ""]
    lines.extend(
        [
            "const TAG_BY_ID = Object.fromEntries(",
            "  RACE_TAGS.map((tag) => [tag.id, tag])",
            ");",
            "",
            "export function getRaceTagById(id) {",
            "  if (!id) {",
            "    return null;",
            "  }",
            "  return TAG_BY_ID[id] ?? null;",
            "}",
            ""
        ]
    )
    (tags_root / "index.js").write_text("\n".join(lines), encoding="utf-8")


def _tag_const_name(tag_id: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "_", tag_id).upper()
    if cleaned and cleaned[0].isdigit():
        cleaned = f"TAG_{cleaned}"
    return f"{cleaned}_TAG"


def _to_label(tag_id: str) -> str:
    return tag_id.replace("_", " ").title()
