import re
import json
from pathlib import Path
from game_io.parse_utils import extract_field

def to_constant_name(perk_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", perk_id).upper().strip("_")
    if not cleaned: return "PERK"
    if cleaned[0].isdigit(): return f"PERK_{cleaned}"
    if cleaned.endswith("_PERK"): return cleaned
    return f"{cleaned}_PERK"

def _extract_list_field(text: str, field_name: str) -> list[str]:
    match = re.search(rf"{field_name}\s*:\s*\[(.*?)\]", text, re.S)
    if not match: return []
    inner = match.group(1)
    return [p.strip().strip('"').strip("'") for p in inner.split(",") if p.strip()]

def _extract_stats_block(text: str) -> str | None:
    match = re.search(r"stats\s*:\s*\{", text)
    if not match: return None
    start = match.end(); level = 1; index = start
    while index < len(text):
        char = text[index]
        if char == "{": level += 1
        elif char == "}":
            level -= 1
            if level == 0: return text[start:index]
        index += 1
    return None

def _parse_stats_map(stats_body: str) -> dict:
    stats = {}
    for key, value in re.findall(r"([A-Za-z0-9_]+)\s*:\s*([0-9.+-]+)", stats_body):
        try: stats[key] = float(value)
        except: continue
    return stats

def parse_perks(perks_path: Path) -> list[dict]:
    perks_root = perks_path.parent
    if not perks_root.exists(): return []
    perks = []
    # perks_path might be index.js, we want the directory
    for file_path in perks_root.iterdir():
        if not file_path.is_file() or file_path.name == "index.js" or file_path.suffix != ".js":
            continue
        text = file_path.read_text(encoding="utf-8")
        perk_id = extract_field(text, "id")
        name = extract_field(text, "name")
        stats_body = _extract_stats_block(text)
        stats = _parse_stats_map(stats_body) if stats_body else {}
        unlock_resources = _extract_list_field(text, "unlockResources")
        if perk_id and name:
            perks.append({
                "id": perk_id,
                "name": name,
                "stats": stats,
                "unlockResources": unlock_resources
            })
    return perks

def save_perk(perks_path: Path, perk: dict) -> None:
    perks_root = perks_path.parent
    if not perks_root.exists(): perks_root.mkdir(parents=True)
    perk_id = perk["id"]
    const_name = to_constant_name(perk_id)
    file_path = perks_root / f"{perk_id}.js"
    
    stats_lines = []
    for k, v in perk.get("stats", {}).items():
        stats_lines.append(f"    {k}: {v}")
    stats_content = "{\n" + ",\n".join(stats_lines) + "\n  }" if stats_lines else "{}"
    
    unlock_res = perk.get("unlockResources", [])
    unlock_str = ", ".join([f'"{r}"' for r in unlock_res])
    unlock_line = f'  unlockResources: [{unlock_str}],' if unlock_res else ""
    
    content = (
        f'export const {const_name} = {{\n'
        f'  id: "{perk_id}",\n'
        f'  name: "{perk["name"]}",\n'
        f'  stats: {stats_content},\n'
        f'  {unlock_line}\n'
        f'}};\n'
    ).replace(",\n  \n", ",\n").replace("{\n  \n", "{\n")
    
    file_path.write_text(content, encoding="utf-8")
    _update_perks_index(perks_root)

def delete_perk(perks_path: Path, perk_id: str) -> None:
    perks_root = perks_path.parent
    file_path = perks_root / f"{perk_id}.js"
    if file_path.exists():
        file_path.unlink()
    _update_perks_index(perks_root)

def _update_perks_index(perks_root: Path) -> None:
    files = [f for f in perks_root.iterdir() if f.is_file() and f.suffix == ".js" and f.name != "index.js"]
    perk_info = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        pid = extract_field(text, "id")
        if pid: perk_info.append({"id": pid, "file": f.name})
    perk_info.sort(key=lambda x: x["id"])
    
    imports = [f'import {{ {to_constant_name(p["id"])} }} from "./{p["file"]}";' for p in perk_info]
    exports = [to_constant_name(p["id"]) for p in perk_info]
    
    lines = imports + ["", "export const PERKS = ["] + [f"  {exp}," for exp in exports] + ["];", ""]
    lines.append("const PERK_BY_ID = Object.fromEntries(PERKS.map((perk) => [perk.id, perk]));")
    lines.append("\nexport function getPerkById(id) { if (!id) return null; return PERK_BY_ID[id] ?? null; }")
    lines.append(f"\nexport {{ {', '.join(exports)} }};")
    
    (perks_root / "index.js").write_text("\n".join(lines), encoding="utf-8")
