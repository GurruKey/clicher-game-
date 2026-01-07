import tkinter as tk
from tkinter import ttk
from ....theme import ROW_BG, BUTTON_BG

def create_edit_panel(parent: tk.Frame, handlers: dict) -> dict:
    frame = tk.Frame(parent)
    
    # Name Header
    name_header = tk.Frame(frame)
    name_header.pack(fill="x")
    tk.Label(name_header, text="Stat Label (Name):").pack(side="left")
    
    btn_new = tk.Button(name_header, text="New", command=handlers["on_new"], bg=BUTTON_BG, fg="#b8f5b8", padx=4, pady=0)
    btn_new.pack(side="right")

    entry_label = tk.Entry(frame)
    entry_label.pack(fill="x", pady=(0, 10))

    # Modifiers
    tk.Label(frame, text="Modifiers (Logic):").pack(anchor="w", pady=(5, 0))
    modifiers_container = tk.Frame(frame, bg=ROW_BG, bd=1, relief="solid")
    modifiers_container.pack(fill="x", pady=(5, 10))
    modifiers_list_frame = tk.Frame(modifiers_container, bg=ROW_BG)
    modifiers_list_frame.pack(fill="x", padx=5, pady=5)

    # Modifiers Add Form
    val_frame = tk.Frame(frame)
    val_frame.pack(fill="x", pady=(0, 5))
    tk.Label(val_frame, text="Value for new modifier:").pack(side="left")
    entry_val = tk.Entry(val_frame, width=5)
    entry_val.pack(side="left", padx=(5, 0))
    entry_val.insert(0, "1")

    # Add Stat
    stat_row = tk.Frame(frame)
    stat_row.pack(fill="x", pady=(0, 5))
    tk.Label(stat_row, text="Add Stat Mod:", width=12, anchor="w").pack(side="left")
    stat_var = tk.StringVar()
    combo_stat = ttk.Combobox(stat_row, textvariable=stat_var, state="readonly", width=18)
    combo_stat.pack(side="left", padx=(5, 0))
    btn_add_stat = tk.Button(stat_row, text="+", width=3, command=handlers["on_add_stat"])
    btn_add_stat.pack(side="left", padx=(10, 0))

    # Add Res
    res_row = tk.Frame(frame)
    res_row.pack(fill="x", pady=(0, 10))
    tk.Label(res_row, text="Add Res Mod:", width=12, anchor="w").pack(side="left")
    res_var = tk.StringVar()
    combo_res = ttk.Combobox(res_row, textvariable=res_var, state="readonly", width=18)
    combo_res.pack(side="left", padx=(5, 0))
    btn_add_res = tk.Button(res_row, text="+", width=3, command=handlers["on_add_res"])
    btn_add_res.pack(side="left", padx=(10, 0))

    # Description
    tk.Label(frame, text="Description / Manual Effects (One per line):").pack(anchor="w", pady=(10, 0))
    text_effects = tk.Text(frame, height=4)
    text_effects.pack(fill="x", pady=(0, 10))

    # Save/Delete Actions
    btn_save_frame = tk.Frame(frame)
    btn_save_frame.pack(fill="x", pady=(15, 0))
    btn_save = tk.Button(btn_save_frame, text="Save Changes", bg="#1f3b1f", fg="#b8f5b8", command=handlers["on_save"])
    btn_save.pack(side="left")
    
    btn_reassign = tk.Button(btn_save_frame, text="Reassign", command=handlers["on_reassign"])
    btn_reassign.pack(side="left", padx=(10, 0))

    btn_replace = tk.Button(btn_save_frame, text="Rename/Merge", command=handlers["on_replace"])
    btn_replace.pack(side="left", padx=(10, 0))

    btn_delete = tk.Button(btn_save_frame, text="Delete", bg="#5a2a2a", fg="#ffcccc", command=handlers["on_delete"])
    btn_delete.pack(side="right")

    return {
        "frame": frame,
        "entry_label": entry_label,
        "modifiers_list_frame": modifiers_list_frame,
        "entry_val": entry_val,
        "stat_var": stat_var,
        "combo_stat": combo_stat,
        "res_var": res_var,
        "combo_res": combo_res,
        "text_effects": text_effects,
        "btn_reassign": btn_reassign,
        "btn_replace": btn_replace
    }
