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


def extract_array(block: str, field: str) -> list[str]:
    # Match type: ["a", "b"] or type: 'a'
    match = re.search(rf"{field}\s*:\s*\[(.*?)\]", block, re.DOTALL)
    if match:
        items = match.group(1).split(",")
        return [re.sub(r"[\"'\s]", "", item) for item in items if item.strip()]
    
    # Fallback to single field
    single = extract_field(block, field)
    return [single] if single else []

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
    
    # Support multiple types
    item_types = extract_array(block, "type")
    
    max_stack = extract_number(block, "maxStack") or 0
    accent = extract_field(block, "accent") or "n/a"
    slot = extract_field(block, "slot")
    icon_var = extract_icon_var(block)
    icon_path = import_map.get(icon_var) if icon_var else None
    
    data = {
        "id": item_id,
        "name": name,
        "categoryId": category,
        "rarity": rarity,
        "type": item_types[0] if item_types else "unknown",
        "types": item_types, # Keep as list for easier handling
        "max_stack": max_stack, # consistent with UI
        "maxStack": max_stack,
        "accent": accent,
        "slot": slot,
        "icon": icon_path
    }
    
    # Check for capacity regardless of type name (for custom bag types)
    capacity = extract_number(block, "capacity")
    if capacity is not None:
        data["capacity"] = capacity
        
    return data


def parse_currencies(data_path: Path) -> list[dict]:
    if data_path.is_dir():
        items = []
        for file_path in data_path.iterdir():
            if not file_path.is_file() or file_path.suffix != ".js":
                continue
            if file_path.name == "index.js":
                continue
            try:
                item = parse_currency_file(file_path)
                if item:
                    items.append(item)
            except Exception as e:
                print(f"Error parsing {file_path}: {e}")
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

        item_data = {
            "id": item_id,
            "name": name,
            "categoryId": category,
            "rarity": rarity,
            "type": item_type,
            "maxStack": max_stack,
            "accent": accent,
            "icon": icon_path
        }
        
        if item_type == "bag":
            item_data["capacity"] = extract_number(block, "capacity") or 0
            
        items.append(item_data)

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


def to_constant_name(item_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", item_id).upper().strip("_")
    if not cleaned:
        return "ITEM"
    return cleaned


def save_item(currencies_path: Path, item: dict) -> None:
    if not currencies_path.exists():
        currencies_path.mkdir(parents=True)
    
    item_id = item["id"]
    const_name = to_constant_name(item_id)
    file_path = currencies_path / f"{item_id}.js"
    
    # Handle icon import
    icon_import = ""
    icon_val = "null"
    if item.get("icon"):
        icon_path = Path(item["icon"])
        # Calculate relative path from src/assets/items
        # currencies_path is src/data/currencies
        # assets_root is src/assets/items
        assets_root = (currencies_path.parent.parent / "assets" / "items").resolve()
        try:
            rel_icon_path = icon_path.resolve().relative_to(assets_root)
            # Use forward slashes for JS imports
            rel_icon_str = str(rel_icon_path).replace("\\", "/")
            icon_import = f'import {item_id}Icon from "../../assets/items/{rel_icon_str}";\n\n'
            icon_val = f"{item_id}Icon"
        except ValueError:
            # Fallback to name if not under assets_root
            icon_name = icon_path.name
            icon_import = f'import {item_id}Icon from "../../assets/items/{icon_name}";\n\n'
            icon_val = f"{item_id}Icon"

    # Handle types
    item_types = item.get("types", [])
    if not item_types and item.get("type"):
        item_types = [item["type"]] if isinstance(item["type"], str) else item["type"]
    
    # Always keep 'type' as a primary string for engine compatibility
    primary_type = item_types[0] if item_types else "unknown"
    types_list_str = "[" + ", ".join([f'"{t}"' for t in item_types]) + "]"

    capacity_field = ""
    if "capacity" in item:
        capacity_field = f'  capacity: {item.get("capacity", 0)},\n'
        
    slot_field = ""
    if item.get("slot"):
        slot_field = f'  slot: "{item["slot"]}",\n'

    content = (
        f"{icon_import}"
        f"export const {const_name} = {{\n"
        f'  id: "{item_id}",\n'
        f'  categoryId: "{item.get("categoryId", "misc")}",\n'
        f'  name: "{item.get("name", "Unknown")}",\n'
        f'  type: "{primary_type}",\n'
        f'  types: {types_list_str},\n'
        f'  maxStack: {item.get("maxStack", 1)},\n'
        f'  rarity: "{item.get("rarity", "common")}",\n'
        f'  accent: "{item.get("accent", "#ffffff")}",\n'
        f'  icon: {icon_val},\n'
        f"{slot_field}"
        f"{capacity_field}"
        f"}};\n"
    )
    # Fix trailing comma in icon if capacity is not there
    if not capacity_field:
        content = content.replace(f'  icon: {icon_val},\n', f'  icon: {icon_val}\n')
    
    file_path.write_text(content, encoding="utf-8")
    _update_currencies_index(currencies_path)
    
    if item.get("type") == "bag":
        _update_bags_definition(currencies_path)


def delete_item(currencies_path: Path, item_id: str) -> None:
    # Check if it was a bag before deleting
    item_file = currencies_path / f"{item_id}.js"
    is_bag = False
    if item_file.exists():
        item_data = parse_currency_file(item_file)
        is_bag = item_data and item_data.get("type") == "bag"
    
    if item_file.exists():
        item_file.unlink()
    
    _update_currencies_index(currencies_path)
    if is_bag:
        _update_bags_definition(currencies_path)


def _update_bags_definition(currencies_path: Path) -> None:
    bags_js_path = currencies_path.parent / "bags.js"
    if not bags_js_path.exists():
        return
        
    # Generate bags.js using the data directly from CURRENCIES
    lines = [
        'import { CURRENCIES } from "./currencies/index.js";',
        'import { ITEM_TYPES } from "./items/presets/types/index.js";',
        "",
        "export const BAGS = Object.fromEntries(",
        "  Object.values(CURRENCIES)",
        '    .filter(item => {',
        '      const types = item.types || (Array.isArray(item.type) ? item.type : [item.type]);',
        '      return types.some(t => t === "bag" || ITEM_TYPES[t]?.is_bag);',
        '    })',
        "    .map(item => [",
        "      item.id,",
        "      {",
        "        id: item.id,",
        "        itemId: item.id,",
        "        capacity: item.capacity || 0,",
        "        name: item.name,",
        "        icon: item.icon",
        "      }",
        "    ])",
        ");",
        ""
    ]
    
    bags_js_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _update_currencies_index(currencies_path: Path) -> None:
    files = [f for f in currencies_path.iterdir() if f.is_file() and f.suffix == ".js" and f.name != "index.js"]
    items_info = []
    for f in files:
        item = parse_currency_file(f)
        if item:
            items_info.append({"id": item["id"], "const": to_constant_name(item["id"]), "file": f.name})
    
    items_info.sort(key=lambda x: x["id"])
    
    imports = [f'import {{ {i["const"]} }} from "./{i["file"]}";' for i in items_info]
    
    lines = imports + ["", "export const CURRENCIES = {"]
    for i in items_info:
        lines.append(f'  [{i["const"]}.id]: {i["const"]},')
    
    # Remove trailing comma for last item if any
    if len(items_info) > 0:
        lines[-1] = lines[-1].rstrip(",")
        
    lines.append("};")
    lines.append("")
    lines.append("export {")
    for i in items_info:
        lines.append(f'  {i["const"]},')
    if len(items_info) > 0:
        lines[-1] = lines[-1].rstrip(",")
    lines.append("};")
    
    (currencies_path / "index.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
