import re
from pathlib import Path
import os

def extract_array_objects(text: str, array_name: str) -> list[dict]:
    # Find the export const ARRAY_NAME = [ ... ];
    pattern = rf"export\s+const\s+{array_name}\s*=\s*\["
    match = re.search(pattern, text)
    if not match:
        return []
    
    start = match.end() - 1
    level = 0
    end = None
    for i in range(start, len(text)):
        if text[i] == "[":
            level += 1
        elif text[i] == "]":
            level -= 1
            if level == 0:
                end = i
                break
    
    if end is None:
        return []
    
    array_content = text[start+1:end]
    
    # Parse individual objects { id: "...", label: "..." }
    objects = []
    # Find all { ... } blocks
    obj_pattern = r"\{([^{}]*)\}"
    for obj_match in re.finditer(obj_pattern, array_content):
        obj_text = obj_match.group(1)
        obj_data = {}
        
        # Extract id and label
        id_m = re.search(r"id\s*:\s*([\"'])(.*?)\1", obj_text)
        label_m = re.search(r"label\s*:\s*([\"'])(.*?)\1", obj_text)
        
        if id_m:
            obj_data["id"] = id_m.group(2)
        if label_m:
            obj_data["label"] = label_m.group(2)
            
        if obj_data:
            objects.append(obj_data)
            
    return objects

def find_project_root() -> Path:
    # Start from current working directory
    current = Path(os.getcwd())
    # Try to find a directory that contains both 'src' and 'constructor'
    while current.parent != current:
        if (current / "src").exists() and (current / "constructor").exists():
            return current
        current = current.parent
    # Fallback to current if not found
    return Path(os.getcwd())

def get_all_character_slots(slots_file: Path | None = None) -> list[str]:
    if slots_file is None:
        root = find_project_root()
        slots_file = root / "src" / "data" / "characterSlots.js"
        
    if not slots_file.exists():
        print(f"DEBUG: Slots file not found at {slots_file.absolute()}")
        return []
    
    try:
        text = slots_file.read_text(encoding="utf-8")
        
        # Names of arrays in src/data/characterSlots.js
        array_names = [
            "CHARACTER_OUTER_LEFT",
            "CHARACTER_OUTER_RIGHT",
            "CHARACTER_INNER_LEFT",
            "CHARACTER_INNER_RIGHT",
            "CHARACTER_WEAPON_OUTER",
            "CHARACTER_WEAPON_INNER"
        ]
        
        all_slots = []
        for name in array_names:
            slots = extract_array_objects(text, name)
            for s in slots:
                if s.get("id") and s["id"] not in all_slots:
                    all_slots.append(s["id"])
                    
        return all_slots
    except Exception as e:
        print(f"DEBUG: Error reading slots file: {e}")
        return []
