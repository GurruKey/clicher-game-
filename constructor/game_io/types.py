from pathlib import Path
import re
from game_io.parse_utils import extract_field

def extract_bool(block: str, field: str) -> bool:
    match = re.search(rf"{field}\s*:\s*(true|false)", block)
    if match:
        return match.group(1) == "true"
    return False

def parse_types(types_root: Path) -> list[dict]:
    item_types: list[dict] = []
    if not types_root.exists():
        return item_types

    def walk(current_path: Path):
        for entry in current_path.iterdir():
            if entry.is_dir():
                walk(entry)
            elif entry.is_file() and entry.suffix == ".js" and entry.name != "index.js":
                text = entry.read_text(encoding="utf-8")
                type_id = extract_field(text, "id")
                label = extract_field(text, "label")
                is_bag = extract_bool(text, "is_bag")
                is_equipment = extract_bool(text, "is_equipment")
                slot = extract_field(text, "slot")
                
                if type_id:
                    # Calculate category from path relative to types_root
                    rel_path = entry.relative_to(types_root).parent
                    category = str(rel_path).replace("\\", " / ") if str(rel_path) != "." else ""
                    
                    item_types.append(
                        {
                            "id": type_id,
                            "label": label if label else type_id,
                            "category": category,
                            "full_label": f"{category} > {label}" if category else label,
                            "path": entry,
                            "is_bag": is_bag,
                            "is_equipment": is_equipment,
                            "slot": slot or ""
                        }
                    )
    
    walk(types_root)
    item_types.sort(key=lambda item: item["full_label"].lower())
    return item_types

def sanitize_type_id(raw_value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9_]+", "_", raw_value.lower()).strip("_")
    return cleaned

def to_constant_name(type_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", type_id).upper().strip("_")
    if not cleaned:
        return "TYPE"
    if cleaned[0].isdigit():
        return f"TYPE_{cleaned}"
    return cleaned

def write_type_file(types_root: Path, item_type: dict) -> None:
    type_id = item_type["id"]
    const_name = to_constant_name(type_id)
    
    # Calculate file path based on category
    category = item_type.get("category", "")
    folder_path = types_root
    if category:
        # Convert "Armor / Pants" back to path
        parts = [p.strip() for p in category.split("/")]
        for part in parts:
            folder_path = folder_path / part
    
    folder_path.mkdir(parents=True, exist_ok=True)
    file_path = folder_path / f"{type_id}.js"
    
    lines = [
        f"export const {const_name} = {{",
        f'  id: "{type_id}",',
        f'  label: "{item_type["label"]}",'
    ]
    
    if item_type.get("is_bag"):
        lines.append('  is_bag: true,')
    
    if item_type.get("is_equipment"):
        lines.append('  is_equipment: true,')
        if item_type.get("slot"):
            lines.append(f'  slot: "{item_type["slot"]}",')
            
    # Remove trailing comma from last property if it's not the last line
    if lines[-1].endswith(','):
        lines[-1] = lines[-1].rstrip(',')
        
    lines.append("};")
    lines.append("")
    
    file_path.write_text("\n".join(lines), encoding="utf-8")

def delete_type(types_root: Path, type_id: str) -> None:
    # We need to find where the file is because it might be in a subfolder
    item_types = parse_types(types_root)
    target = next((t for p in [item_types] for t in p if t["id"] == type_id), None)
    if target and target["path"].exists():
        target["path"].unlink()
        
        # Clean up empty parent directories
        parent = target["path"].parent
        while parent != types_root:
            try:
                parent.rmdir() # Only removes if empty
                parent = parent.parent
            except OSError:
                break
    
    write_type_index(types_root)

def write_type_index(types_root: Path) -> None:
    item_types = parse_types(types_root)
    if not item_types:
        return

    lines = []
    exports = []
    for item in item_types:
        const_name = to_constant_name(item["id"])
        # Calculate relative path for import
        rel_path = item["path"].relative_to(types_root)
        import_path = str(rel_path).replace("\\", "/")
        lines.append(f'import {{ {const_name} }} from "./{import_path}";')
        exports.append(const_name)

    lines.append("")
    lines.append("export const ITEM_TYPES = {")
    for item in item_types:
        const_name = to_constant_name(item["id"])
        lines.append(f"  [{const_name}.id]: {const_name},")
    lines.append("};")
    lines.append("")
    lines.append(f"export {{ {', '.join(exports)} }};")
    lines.append("")

    index_path = types_root / "index.js"
    index_path.write_text("\n".join(lines), encoding="utf-8")

def save_type(types_root: Path, item_type: dict) -> None:
    write_type_file(types_root, item_type)
    write_type_index(types_root)
