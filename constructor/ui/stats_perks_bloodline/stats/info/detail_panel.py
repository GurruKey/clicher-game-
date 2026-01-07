import tkinter as tk

def create_detail_panel(parent: tk.Frame) -> dict:
    detail_title = tk.Label(parent, text="Select a stat", font=("Segoe UI", 12, "bold"))
    detail_title.pack(anchor="nw")

    detail_text = tk.Label(parent, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw", pady=(12, 0))

    return {
        "title": detail_title,
        "text": detail_text
    }

def update_detail_view(widgets: dict, stat: dict, get_label_func: callable):
    effects = stat.get("effects") or []
    modifiers = stat.get("modifiers") or []
    lines = [f"ID: {stat['id']}", f"Label: {stat['label']}", ""]
    
    if modifiers:
        lines.append("Modifiers (Logic):")
        for mod in modifiers:
            tname = get_label_func(mod["targetStatId"])
            val = mod["value"]
            sign = "+" if val >= 0 else ""
            lines.append(f"- Modifies {tname}: {sign}{val}")
        lines.append("")
    
    if effects:
        lines.append("Description:")
        lines.extend([f"- {e}" for e in effects])
    elif not modifiers:
        lines.append("No effects or modifiers.")
        
    widgets["title"].config(text=stat["label"])
    widgets["text"].config(text="\n".join(lines))
