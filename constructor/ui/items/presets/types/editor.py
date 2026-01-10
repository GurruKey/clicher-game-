import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path

from ....theme import BG_COLOR, TEXT_COLOR, ModernButton, PANEL_BG_ALT
from game_io.types import delete_type, save_type, sanitize_type_id
from game_io.character_slots import get_all_character_slots

def create_types_editor(
    parent: tk.Frame,
    types_root: Path,
    item_types: list[dict],
    on_change: callable
) -> tuple[tk.Frame, callable]:
    detail_frame = tk.Frame(parent, bg=BG_COLOR)
    
    header_frame = tk.Frame(detail_frame, bg=BG_COLOR)
    header_frame.pack(fill="x", padx=10, pady=(0, 10))

    detail_title = tk.Label(
        header_frame, text="Select a type", font=("Segoe UI", 12, "bold"), bg=BG_COLOR, fg=TEXT_COLOR
    )
    detail_title.pack(side="left")

    mode_var = tk.StringVar(value="Mode: New")
    mode_label = tk.Label(header_frame, textvariable=mode_var, bg=BG_COLOR, fg=TEXT_COLOR, font=("Segoe UI", 9, "italic"))
    mode_label.pack(side="right")

    # Scrollable container for the editor
    scroll_container = tk.Frame(detail_frame, bg=BG_COLOR)
    scroll_container.pack(fill="both", expand=True)

    add_id_var = tk.StringVar()
    add_label_var = tk.StringVar()
    add_category_var = tk.StringVar()
    add_is_bag_var = tk.BooleanVar()
    add_is_equip_var = tk.BooleanVar()
    add_slot_var = tk.StringVar()
    error_var = tk.StringVar()
    selected_id = {"value": None}
    id_conflict_var = tk.StringVar()

    # --- Identification Group ---
    id_frame = tk.LabelFrame(scroll_container, text=" Identification ", bg=BG_COLOR, fg=TEXT_COLOR, padx=10, pady=10)
    id_frame.pack(fill="x", padx=10, pady=5)

    # Collect existing values for Comboboxes
    existing_labels = sorted(list({item.get("label", "") for item in item_types if item.get("label")}))
    existing_categories = sorted(list({item.get("category", "") for item in item_types if item.get("category")}))

    tk.Label(id_frame, text="ID", bg=BG_COLOR, fg=TEXT_COLOR).grid(row=0, column=0, sticky="w")
    id_entry = tk.Entry(id_frame, textvariable=add_id_var, width=20)
    id_entry.grid(row=0, column=1, sticky="w", padx=(10, 20), pady=5)
    
    tk.Label(id_frame, text="Label", bg=BG_COLOR, fg=TEXT_COLOR).grid(row=0, column=2, sticky="w")
    label_combo = ttk.Combobox(id_frame, textvariable=add_label_var, values=existing_labels, width=20)
    label_combo.grid(row=0, column=3, sticky="w", padx=(10, 0), pady=5)
    
    tk.Label(id_frame, text="Category", bg=BG_COLOR, fg=TEXT_COLOR).grid(row=1, column=0, sticky="w")
    category_combo = ttk.Combobox(id_frame, textvariable=add_category_var, values=existing_categories, width=20)
    category_combo.grid(row=1, column=1, sticky="w", padx=(10, 20), pady=5)

    # --- Properties Group ---
    prop_frame = tk.LabelFrame(scroll_container, text=" Properties ", bg=BG_COLOR, fg=TEXT_COLOR, padx=10, pady=10)
    prop_frame.pack(fill="x", padx=10, pady=5)

    tk.Checkbutton(
        prop_frame, 
        text="Is Bag", 
        variable=add_is_bag_var,
        bg=BG_COLOR, 
        fg=TEXT_COLOR,
        selectcolor=BG_COLOR,
        activebackground=BG_COLOR,
        activeforeground=TEXT_COLOR
    ).grid(row=0, column=0, sticky="w", pady=5)

    tk.Checkbutton(
        prop_frame, 
        text="Is Equipment", 
        variable=add_is_equip_var,
        bg=BG_COLOR, 
        fg=TEXT_COLOR,
        selectcolor=BG_COLOR,
        activebackground=BG_COLOR,
        activeforeground=TEXT_COLOR
    ).grid(row=1, column=0, sticky="w", pady=5)

    tk.Label(prop_frame, text="Equip Slot", bg=BG_COLOR, fg=TEXT_COLOR).grid(row=1, column=1, sticky="w", padx=(20, 10))
    
    dynamic_slots = [""] + get_all_character_slots()
    slot_combo = ttk.Combobox(prop_frame, textvariable=add_slot_var, values=dynamic_slots, width=20)
    slot_combo.grid(row=1, column=2, sticky="w", pady=5)

    # --- Actions ---
    action_frame = tk.Frame(scroll_container, bg=BG_COLOR)
    action_frame.pack(fill="x", padx=10, pady=15)

    error_label = tk.Label(action_frame, textvariable=error_var, fg="#ff6666", bg=BG_COLOR, font=("Segoe UI", 9, "bold"))
    error_label.pack(side="left")

    conflict_label = tk.Label(action_frame, textvariable=id_conflict_var, fg="#ff6666", bg=BG_COLOR)
    conflict_label.pack(side="left", padx=(8, 0))

    btn_row = tk.Frame(action_frame, bg=BG_COLOR)
    btn_row.pack(side="right")

    new_button = ModernButton(btn_row, text="New", width=8)
    new_button.pack(side="left", padx=4)

    delete_button = ModernButton(btn_row, text="Delete", width=8)
    delete_button.pack(side="left", padx=4)

    save_button = ModernButton(btn_row, text="Save", width=12)
    save_button.pack(side="left", padx=(10, 0))

    # --- Info Display ---
    info_frame = tk.LabelFrame(scroll_container, text=" Info ", bg=BG_COLOR, fg=TEXT_COLOR, padx=10, pady=10)
    info_frame.pack(fill="both", expand=True, padx=10, pady=5)

    detail_text = tk.Label(info_frame, text="", justify="left", anchor="nw", bg=BG_COLOR, fg=TEXT_COLOR)
    detail_text.pack(fill="both", expand=True)

    def set_edit_mode(item: dict | None) -> None:
        if item:
            selected_id["value"] = item["id"]
            add_id_var.set(item["id"])
            add_label_var.set(item["label"])
            add_category_var.set(item.get("category", ""))
            add_is_bag_var.set(item.get("is_bag", False))
            add_is_equip_var.set(item.get("is_equipment", False))
            add_slot_var.set(item.get("slot", ""))
            mode_var.set(f"Editing: {item['id']}")
            
            detail_title.config(text=item["label"])
            info_lines = [
                f"• ID: {item['id']}",
                f"• Label: {item['label']}",
                f"• Category: {item.get('category', 'None')}"
            ]
            if item.get("is_bag"):
                info_lines.append("• Feature: Bag (Increases carrying capacity)")
            if item.get("is_equipment"):
                slot_name = item.get("slot") or "Any compatible"
                info_lines.append(f"• Feature: Equipment (Fits into '{slot_name}' slot)")
            detail_text.config(text="\n".join(info_lines))
            
            # Disable ID editing if editing existing
            # id_entry.config(state="disabled") # Actually in this app we allow rename by delete+save
        else:
            selected_id["value"] = None
            add_id_var.set("")
            add_label_var.set("")
            add_category_var.set("")
            add_is_bag_var.set(False)
            add_is_equip_var.set(False)
            add_slot_var.set("")
            mode_var.set("New Type")
            
            detail_title.config(text="Select a type")
            detail_text.config(text="")

    def handle_save() -> None:
        raw_id = add_id_var.get().strip()
        label = add_label_var.get().strip() or raw_id
        category = add_category_var.get().strip()
        is_bag = add_is_bag_var.get()
        is_equip = add_is_equip_var.get()
        slot = add_slot_var.get().strip()
        
        if not raw_id:
            error_var.set("Error: Id is required.")
            return
        type_id = sanitize_type_id(raw_id)
        if not type_id:
            error_var.set("Error: Invalid characters in Id.")
            return
        error_var.set("")
        existing_ids = {item["id"] for item in item_types}
        current_id = selected_id["value"]
        if current_id and current_id != type_id and type_id in existing_ids:
            error_var.set("Error: Id already exists.")
            return
        if not current_id and type_id in existing_ids:
            error_var.set("Error: Id already exists.")
            return

        if current_id and current_id != type_id:
            delete_type(types_root, current_id)

        save_type(
            types_root,
            {
                "id": type_id, 
                "label": label, 
                "category": category,
                "is_bag": is_bag,
                "is_equipment": is_equip,
                "slot": slot
            }
        )
        on_change()

    save_button.config(command=handle_save)
    new_button.config(command=lambda: set_edit_mode(None))

    def handle_delete() -> None:
        current_id = selected_id["value"]
        if not current_id:
            error_var.set("Select a type to delete.")
            return
        if not messagebox.askyesno(
            "Confirm Delete", f"Are you sure you want to delete type '{current_id}'?"
        ):
            return
        delete_type(types_root, current_id)
        on_change()

    delete_button.config(command=handle_delete)

    def update_conflict(*_args: object) -> None:
        raw_id = add_id_var.get().strip()
        if not raw_id:
            id_conflict_var.set("")
            save_button.config(state="disabled")
            return
        type_id = sanitize_type_id(raw_id)
        existing_ids = {item["id"] for item in item_types}
        current_id = selected_id["value"]
        if type_id in existing_ids and type_id != current_id:
            id_conflict_var.set("(!) Already exists")
            save_button.config(state="disabled")
        else:
            id_conflict_var.set("")
            save_button.config(state="normal")

    add_id_var.trace_add("write", update_conflict)

    return detail_frame, set_edit_mode
