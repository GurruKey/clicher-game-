import re
from pathlib import Path
from game_io.parse_utils import extract_field

def to_constant_name(res_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", res_id).upper().strip("_")
    if not cleaned: return "RESOURCE"
    if cleaned[0].isdigit(): return f"RESOURCE_{cleaned}"
    return cleaned

def parse_resources(resources_path: Path) -> list[dict]:
    resources_root = resources_path.parent
    if not resources_root.exists(): return []
    resources = []
    for file_path in resources_root.iterdir():
        if not file_path.is_file() or file_path.name in ("index.js", "engine.js") or file_path.suffix != ".js":
            continue
        
        text = file_path.read_text(encoding="utf-8")
        res_id = extract_field(text, "id")
        label = extract_field(text, "label")
        
        base_match = re.search(r"base\s*:\s*([\d\.\-]+)", text)
        base_val = 0
        if base_match:
            try:
                base_val = float(base_match.group(1))
                if base_val.is_integer(): base_val = int(base_val)
            except: pass

        regen_match = re.search(r"regenInterval\s*:\s*([\d]+)", text)
        regen_interval = 0
        if regen_match:
            try: regen_interval = int(regen_match.group(1))
            except: pass

        color_match = re.search(r'color\s*:\s*"([^"]+)"', text)
        color = color_match.group(1) if color_match else "#4caf50"
        
        text_color_match = re.search(r'textColor\s*:\s*"([^"]+)"', text)
        text_color = text_color_match.group(1) if text_color_match else "#ffffff"

        if res_id and label:
            resources.append({
                "id": res_id, "label": label, "base": base_val, "regenInterval": regen_interval,
                "color": color, "textColor": text_color, "effects": [], "modifiers": [], "is_resource": True
            })
    return resources

def save_resource(resources_path: Path, resource: dict) -> None:
    resources_root = resources_path.parent
    if not resources_root.exists(): resources_root.mkdir(parents=True)
    res_id = resource["id"]
    const_name = to_constant_name(res_id)
    file_path = resources_root / f"{res_id}.js"
    
    content = (
        f'export const {const_name} = {{\n'
        f'  id: "{res_id}",\n'
        f'  label: "{resource["label"]}",\n'
        f'  base: {resource.get("base", 0)},\n'
        f'  regenInterval: {resource.get("regenInterval", 0)},\n'
        f'  color: "{resource.get("color", "#4caf50")}",\n'
        f'  textColor: "{resource.get("textColor", "#ffffff")}",\n'
        f'  effects: [],\n'
        f'  modifiers: []\n'
        f'}};\n'
    )
    file_path.write_text(content, encoding="utf-8")
    _update_resources_index(resources_root)

def delete_resource(resources_path: Path, res_id: str) -> None:
    resources_root = resources_path.parent
    file_path = resources_root / f"{res_id}.js"
    if file_path.exists(): file_path.unlink()
    _update_resources_index(resources_root)

def _update_resources_index(resources_root: Path) -> None:
    files = [f for f in resources_root.iterdir() if f.is_file() and f.suffix == ".js" and f.name not in ("index.js", "engine.js")]
    res_info = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        sid = extract_field(text, "id")
        if sid: res_info.append({"id": sid, "file": f.name})
    res_info.sort(key=lambda x: x["id"])
    imports = []
    exports = []
    for info in res_info:
        const_name = to_constant_name(info["id"])
        imports.append(f'import {{ {const_name} }} from "./{info["file"]}";')
        exports.append(const_name)
    lines = imports + ["", "export const RESOURCES = ["] + [f"  {exp}," for exp in exports] + ["];", "", f"export {{ {', '.join(exports)} }};", ""]
    (resources_root / "index.js").write_text("\n".join(lines), encoding="utf-8")
