import re
import json
from pathlib import Path

from game_io.parse_utils import extract_field


def _extract_string_list(block: str, field: str) -> list[str]:
    match = re.search(rf"{field}\s*:\s*\[(.*?)\]", block, re.S)
    if not match:
        return []
    inner = match.group(1)
    return re.findall(r"\"([^\"]+)\"", inner)

def _extract_modifiers(block: str) -> list[dict]:
    start = block.find("[")
    end = block.rfind("]")
    if start == -1 or end == -1:
        match = re.search(r"modifiers\s*:\s*\[(.*?)\]", block, re.S)
        if match:
            inner = match.group(1).strip()
        else:
            match = re.search(r"=\s*\[(.*?)\]", block, re.S)
            if match:
                inner = match.group(1).strip()
            else:
                return []
    else:
        inner = block[start+1:end]

    if not inner.strip():
        return []
    
    modifiers = []
    obj_matches = re.findall(r"\{(.*?)\}", inner, re.S)
    
    for obj_str in obj_matches:
        mod = {}
        m_target = re.search(r"targetStatId\s*:\s*\"([^\"]+)\"", obj_str)
        if m_target:
            mod["targetStatId"] = m_target.group(1)
            
        m_val = re.search(r"value\s*:\s*([\d\.\-]+)", obj_str)
        if m_val:
            try:
                mod["value"] = float(m_val.group(1))
                if mod["value"].is_integer():
                    mod["value"] = int(mod["value"])
            except ValueError:
                mod["value"] = 0
                
        m_type = re.search(r"type\s*:\s*\"([^\"]+)\"", obj_str)
        mod["type"] = m_type.group(1) if m_type else "flat"
        
        if "targetStatId" in mod:
            modifiers.append(mod)
            
    return modifiers


def to_constant_name(stat_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", stat_id).upper().strip("_")
    if not cleaned:
        return "STAT"
    if cleaned[0].isdigit():
        return f"STAT_{cleaned}"
    return cleaned


def parse_stats(stats_path: Path) -> list[dict]:
    stats_root = stats_path.parent
    if not stats_root.exists():
        return []
    
    logic_root = stats_root / "logic"

    stats: list[dict] = []
    
    for file_path in stats_root.iterdir():
        if not file_path.is_file():
            continue
        # IGNORE display_config.js
        if file_path.name in ("index.js", "engine.js", "display_config.js") or file_path.suffix != ".js":
            continue
        
        text = file_path.read_text(encoding="utf-8")
        
        stat_id = extract_field(text, "id")
        label = extract_field(text, "label")
        
        if not stat_id or not label:
            continue
            
        sources = _extract_string_list(text, "sources")
        effects = _extract_string_list(text, "effects")
        
        modifiers = []
        logic_file = logic_root / file_path.name
        
        if logic_file.exists():
            logic_text = logic_file.read_text(encoding="utf-8")
            modifiers = _extract_modifiers(logic_text)
        else:
            modifiers = _extract_modifiers(text)
        
        stats.append(
            {
                "id": stat_id,
                "label": label,
                "sources": sources,
                "effects": effects,
                "modifiers": modifiers,
                "is_resource": False
            }
        )
        
    return stats


def save_stat(stats_path: Path, stat: dict) -> None:
    if stat.get("is_resource"):
        return 

    stats_root = stats_path.parent
    logic_root = stats_root / "logic"
    if not logic_root.exists():
        logic_root.mkdir(parents=True)

    stat_id = stat["id"]
    const_name = to_constant_name(stat_id)
    
    modifiers = stat.get("modifiers", [])
    logic_file = logic_root / f"{stat_id}.js"
    
    if modifiers:
        mod_lines = []
        for mod in modifiers:
            val = mod.get("value", 0)
            target = mod.get("targetStatId", "")
            mtype = mod.get("type", "flat")
            mod_lines.append(f'{{ targetStatId: "{target}", value: {val}, type: "{mtype}" }}')
        
        mods_str = ",\n    ".join(mod_lines)
        modifiers_block = f'[\n    {mods_str}\n]'
    else:
        modifiers_block = "[]"
        
    logic_content = f"export const {const_name}_MODIFIERS = {modifiers_block};\n"
    logic_file.write_text(logic_content, encoding="utf-8")
    
    file_path = stats_root / f"{stat_id}.js"
    
    effects_str = ",\n    ".join([f'"{e}"' for e in stat.get("effects", [])])
    if effects_str:
        effects_block = f'[\n    {effects_str}\n  ]'
    else:
        effects_block = "[]"
    
    main_content = (
        f'import {{ {const_name}_MODIFIERS }} from "./logic/{stat_id}.js";\n\n'
        f'export const {const_name} = {{\n'
        f'  id: "{stat_id}",\n'
        f'  label: "{stat["label"]}",\n'
        f'  effects: {effects_block},\n'
        f'  modifiers: {const_name}_MODIFIERS\n'
        f'}};\n'
    )
    
    file_path.write_text(main_content, encoding="utf-8")
    _update_stats_index(stats_root)


def delete_stat(stats_path: Path, stat_id: str) -> None:
    stats_root = stats_path.parent
    logic_root = stats_root / "logic"
    
    logic_file = logic_root / f"{stat_id}.js"
    if logic_file.exists():
        logic_file.unlink()
        
    main_file = stats_root / f"{stat_id}.js"
    if main_file.exists():
        main_file.unlink()
        
    _update_stats_index(stats_root)


def _update_stats_index(stats_root: Path) -> None:
    files = [
        f for f in stats_root.iterdir() 
        if f.is_file() 
        and f.suffix == ".js" 
        # IGNORE display_config.js
        and f.name not in ("index.js", "engine.js", "display_config.js")
    ]
    
    stats_info = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        sid = extract_field(text, "id")
        if sid:
            stats_info.append({"id": sid, "file": f.name})
            
    stats_info.sort(key=lambda x: x["id"])
    
    imports = []
    exports = []
    
    for info in stats_info:
        const_name = to_constant_name(info["id"])
        imports.append(f'import {{ {const_name} }} from "./{info["file"]}";')
        exports.append(const_name)
        
    lines = []
    lines.extend(imports)
    lines.append("")
    lines.append("export const STATS = [")
    for exp in exports:
        lines.append(f"  {exp},")
    lines.append("];")
    lines.append("")
    lines.append(f"export {{ {', '.join(exports)} }};")
    lines.append("")
    lines.append("export function buildStatDetails(statValues = null, fallbackValue = 0) {")
    lines.append("  return STATS.map((stat) => {")
    lines.append("    const value = statValues?.[stat.id] ?? fallbackValue;")
    lines.append("    return { id: stat.id, label: stat.label, value: String(value) };")
    lines.append("  });")
    lines.append("}")
    lines.append("")
    lines.append("export function getStatValue(statValues, id, fallbackValue = 0) {")
    lines.append("  const raw = statValues?.[id];")
    lines.append("  const num = Number(raw);")
    lines.append("  return Number.isFinite(num) ? num : fallbackValue;")
    lines.append("}")
    
    (stats_root / "index.js").write_text("\n".join(lines), encoding="utf-8")
