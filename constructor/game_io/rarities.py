from pathlib import Path
import re

from constants import RARITY_ORDER_FALLBACK
from game_io.parse_utils import extract_field


def parse_rarities(rarity_root: Path) -> list[dict]:
    rarities: list[dict] = []
    if not rarity_root.exists():
        return rarities

    for file_path in rarity_root.iterdir():
        if not file_path.is_file():
            continue
        if file_path.name == "index.js" or file_path.suffix != ".js":
            continue

        text = file_path.read_text(encoding="utf-8")
        id_match = re.search(r'id\s*:\s*"([^"]+)"', text)
        label = extract_field(text, "label")
        color_match = re.search(r'color\s*:\s*"([^"]+)"', text)
        if id_match and color_match:
            rarities.append(
                {
                    "id": id_match.group(1),
                    "label": label if label else id_match.group(1),
                    "color": color_match.group(1)
                }
            )

    order_index = {key: index for index, key in enumerate(RARITY_ORDER_FALLBACK)}
    rarities.sort(key=lambda item: order_index.get(item["id"], 999))
    return rarities


def load_rarity_colors(rarity_root: Path) -> dict[str, str]:
    return {item["id"]: item["color"] for item in parse_rarities(rarity_root)}


def sanitize_rarity_id(raw_value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9_]+", "_", raw_value.lower()).strip("_")
    return cleaned


def to_constant_name(rarity_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", rarity_id).upper().strip("_")
    if not cleaned:
        return "RARITY"
    if cleaned[0].isdigit():
        return f"RARITY_{cleaned}"
    return cleaned


def write_rarity_file(rarity_root: Path, rarity: dict) -> None:
    rarity_id = rarity["id"]
    const_name = to_constant_name(rarity_id)
    file_path = rarity_root / f"{rarity_id}.js"
    file_path.write_text(
        "\n".join(
            [
                f"export const {const_name} = {{",
                f'  id: "{rarity_id}",',
                f'  label: "{rarity["label"]}",',
                f'  color: "{rarity["color"]}"',
                "};",
                ""
            ]
        ),
        encoding="utf-8"
    )


def write_rarity_index(rarity_root: Path) -> None:
    rarities = parse_rarities(rarity_root)
    if not rarities:
        return

    lines = []
    exports = []
    for item in rarities:
        const_name = to_constant_name(item["id"])
        lines.append(f'import {{ {const_name} }} from "./{item["id"]}.js";')
        exports.append(const_name)

    lines.append("")
    lines.append("export const RARITIES = {")
    for item in rarities:
        const_name = to_constant_name(item["id"])
        lines.append(f"  [{const_name}.id]: {const_name},")
    lines.append("};")
    lines.append("")
    lines.append("export const RARITY_ORDER = [")
    for item in rarities:
        const_name = to_constant_name(item["id"])
        lines.append(f"  {const_name}.id,")
    lines.append("];")
    lines.append("")
    lines.append(f"export {{ {', '.join(exports)} }};")
    lines.append("")

    index_path = rarity_root / "index.js"
    index_path.write_text("\n".join(lines), encoding="utf-8")


def save_rarity(rarity_root: Path, rarity: dict) -> None:
    write_rarity_file(rarity_root, rarity)
    write_rarity_index(rarity_root)


def delete_rarity(rarity_root: Path, rarity_id: str) -> None:
    file_path = rarity_root / f"{rarity_id}.js"
    if file_path.exists():
        file_path.unlink()
    write_rarity_index(rarity_root)
