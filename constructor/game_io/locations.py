from pathlib import Path
import re


def parse_locations(location_root: Path) -> dict[str, list[str]]:
    results: dict[str, list[str]] = {}
    if not location_root.exists():
        return results

    for location_dir in location_root.iterdir():
        if not location_dir.is_dir():
            continue

        name = location_dir.name
        index_path = location_dir / "index.js"
        loot_path = location_dir / "loot.js"

        if index_path.exists():
            index_text = index_path.read_text(encoding="utf-8")
            name_match = re.search(r'name\s*:\s*"([^"]+)"', index_text)
            if name_match:
                name = name_match.group(1)

        if not loot_path.exists():
            continue

        loot_text = loot_path.read_text(encoding="utf-8")
        for match in re.finditer(
            r'\{\s*id\s*:\s*"([^"]+)"\s*,\s*chance\s*:\s*([0-9.]+)\s*\}',
            loot_text
        ):
            item_id, chance = match.group(1), match.group(2)
            results.setdefault(item_id, []).append(f"{name} ({chance}%)")

    return results


def parse_location_catalog(location_root: Path) -> list[dict]:
    locations: list[dict] = []
    if not location_root.exists():
        return locations

    for location_dir in location_root.iterdir():
        if not location_dir.is_dir():
            continue

        location_id = location_dir.name
        location_name = location_dir.name
        index_path = location_dir / "index.js"
        loot_path = location_dir / "loot.js"

        coords = {"x": 0.0, "y": 0.0}
        req_res_id = "max_stamina"
        req_res_cost = 1.0

        if index_path.exists():
            index_text = index_path.read_text(encoding="utf-8")
            id_match = re.search(r'id\s*:\s*"([^"]+)"', index_text)
            name_match = re.search(r'name\s*:\s*"([^"]+)"', index_text)
            coords_match = re.search(
                r'coords\s*:\s*\{\s*x\s*:\s*([0-9.+-]+)\s*,\s*y\s*:\s*([0-9.+-]+)\s*\}',
                index_text,
                re.S
            )
            res_id_match = re.search(r'requiredResourceId\s*:\s*"([^"]+)"', index_text)
            res_cost_match = re.search(r'resourceCost\s*:\s*([0-9.]+)', index_text)

            if id_match:
                location_id = id_match.group(1)
            if name_match:
                location_name = name_match.group(1)
            if coords_match:
                coords = {
                    "x": float(coords_match.group(1)),
                    "y": float(coords_match.group(2))
                }
            if res_id_match:
                req_res_id = res_id_match.group(1)
            if res_cost_match:
                try:
                    req_res_cost = float(res_cost_match.group(1))
                    if req_res_cost.is_integer(): req_res_cost = int(req_res_cost)
                except ValueError:
                    pass

        loot = []
        if loot_path.exists():
            loot_text = loot_path.read_text(encoding="utf-8")
            for match in re.finditer(
                r'\{\s*id\s*:\s*"([^"]+)"\s*,\s*chance\s*:\s*([0-9.]+)\s*\}',
                loot_text
            ):
                item_id, chance = match.group(1), match.group(2)
                loot.append({"id": item_id, "chance": chance})

        locations.append(
            {
                "id": location_id,
                "name": location_name,
                "loot": loot,
                "coords": coords,
                "requiredResourceId": req_res_id,
                "resourceCost": req_res_cost
            }
        )

    locations.sort(key=lambda item: item["name"].lower())
    return locations

def save_location(location_root: Path, location: dict) -> None:
    loc_id = location["id"]
    loc_dir = location_root / loc_id
    if not loc_dir.exists():
        loc_dir.mkdir(parents=True)
        
    # 1. Save index.js
    const_name = loc_id.upper().replace("-", "_")
    loot_const = f"{const_name}_LOOT"
    
    coords = location.get("coords", {"x": 0.0, "y": 0.0})
    res_id = location.get("requiredResourceId", "max_stamina")
    res_cost = location.get("resourceCost", 1)
    
    index_content = (
        f'import {{ {loot_const} }} from "./loot.js";\n\n'
        f'export const {const_name} = {{\n'
        f'  id: "{loc_id}",\n'
        f'  name: "{location["name"]}",\n'
        f'  coords: {{ x: {coords["x"]}, y: {coords["y"]} }},\n'
        f'  requiredResourceId: "{res_id}",\n'
        f'  resourceCost: {res_cost},\n'
        f'  lootTable: {loot_const}\n'
        f'}};\n'
    )
    (loc_dir / "index.js").write_text(index_content, encoding="utf-8")
    
    # 2. Save loot.js
    loot_entries = []
    for item in location.get("loot", []):
        loot_entries.append(f'  {{ id: "{item["id"]}", chance: {item["chance"]} }}')
    
    loot_content = (
        f'export const {loot_const} = [\n'
        + ",\n".join(loot_entries) + "\n"
        f'];\n'
    )
    (loc_dir / "loot.js").write_text(loot_content, encoding="utf-8")
    
    _update_locations_index(location_root)

def _update_locations_index(location_root: Path) -> None:
    dirs = [d for d in location_root.iterdir() if d.is_dir()]
    
    loc_info = []
    for d in dirs:
        index_file = d / "index.js"
        if index_file.exists():
            text = index_file.read_text(encoding="utf-8")
            id_match = re.search(r'id\s*:\s*"([^"]+)"', text)
            if id_match:
                loc_info.append({"id": id_match.group(1), "dir": d.name})
                
    loc_info.sort(key=lambda x: x["id"])
    
    imports = []
    exports = []
    
    for info in loc_info:
        const_name = info["id"].upper().replace("-", "_")
        imports.append(f'import {{ {const_name} }} from "./{info["dir"]}/index.js";')
        exports.append(const_name)
        
    lines = []
    lines.extend(imports)
    lines.append("")
    lines.append(f"export const LOCATIONS = {{")
    for exp in exports:
        lines.append(f"  [{exp}.id]: {exp},")
    lines.append(f"}};")
    lines.append("")
    lines.append(f"export const DEFAULT_LOCATION_ID = \"{loc_info[0]['id'] if loc_info else ''}\";")
    
    (location_root / "index.js").write_text("\n".join(lines), encoding="utf-8")
