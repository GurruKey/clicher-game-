
import tkinter as tk
from tkinter import ttk, colorchooser
from typing import Callable
from pathlib import Path
import re

from ...theme import (
    DIVIDER_COLOR, ROW_BG, ROW_BORDER, ROW_HOVER_BG, ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG, BUTTON_BG, ScrollableFrame, ModernPanedWindow, ModernButton,
    ENTRY_BG, BG_COLOR, ACCENT_COLOR, TEXT_MUTED
)

ERROR_BG = "#4a1a1a"
from ...common import StandardLeftList
from .icon_selector import IconSelectorDialog
from game_io.character_slots import get_all_character_slots

def create_item_editor_view(
    parent: tk.Frame,
    item: dict | None,
    rarity_colors: dict[str, str],
    available_types: list[dict],
    available_max_stacks: list[int],
    on_save: Callable[[dict], None],
    on_cancel: Callable[[], None],
    on_delete: Callable[[str], bool] | None = None,
    assets_root: Path = None,
    currencies_root: Path = None,
    existing_names: list[str] = None,
    existing_categories: list[str] = None,
    existing_ids: list[str] = None
) -> None:
    # Clear parent to prevent duplication if called multiple times
    for child in parent.winfo_children():
        child.destroy()

    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    # Title
    title_text = "Create New Item" if item is None else f"Edit Item: {item.get('name', 'Unknown')}"
    tk.Label(container, text=title_text, font=("Segoe UI", 14, "bold")).pack(anchor="nw", pady=(0, 15))

    # Form Frame
    form_frame = tk.Frame(container)
    form_frame.pack(fill="both", expand=True)
    form_frame.columnconfigure(1, weight=1)

    # Item ID (read-only for existing items, or generated for new)
    tk.Label(form_frame, text="ID:", width=15, anchor="w").grid(row=0, column=0, sticky="w", pady=2)
    id_var = tk.StringVar(value=item["id"] if item else "(auto-generated)")
    id_entry = tk.Entry(form_frame, textvariable=id_var, state="readonly", width=40)
    id_entry.grid(row=0, column=1, sticky="ew", pady=2)

    # Name
    tk.Label(form_frame, text="Name:", width=15, anchor="w").grid(row=1, column=0, sticky="w", pady=2)
    name_var = tk.StringVar(value=item["name"] if item else "")
    name_entry = tk.Entry(form_frame, textvariable=name_var, width=40)
    name_entry.grid(row=1, column=1, sticky="ew", pady=2)

    # Category (Combobox with typing support)
    tk.Label(form_frame, text="Category:", width=15, anchor="w").grid(row=2, column=0, sticky="w", pady=2)
    category_var = tk.StringVar(value=item["categoryId"] if item else "")
    
    category_values = existing_categories or []
    category_entry = ttk.Combobox(form_frame, textvariable=category_var, values=category_values, width=37)
    category_entry.grid(row=2, column=1, sticky="ew", pady=2)

    # Type (Support multiple)
    tk.Label(form_frame, text="Types:", width=15, anchor="w").grid(row=3, column=0, sticky="nw", pady=2)
    
    # Redesigned types area with 4 vertical columns
    types_container = tk.Frame(form_frame, height=180, bd=1, relief="solid", highlightthickness=1, highlightbackground=BG_COLOR)
    types_container.grid(row=3, column=1, sticky="ew", pady=2)
    types_container.grid_propagate(False)
    
    # Grid layout for 4 columns
    for i in range(4):
        types_container.columnconfigure(i*2, weight=1, uniform="types_cols")
        if i < 3: # Vertical dividers
            types_container.columnconfigure(i*2 + 1, weight=0)
            tk.Frame(types_container, width=1, bg=ROW_BORDER).grid(row=0, column=i*2 + 1, sticky="ns")

    # Zone 1: Selection
    zone1 = tk.Frame(types_container, bd=0)
    zone1.grid(row=0, column=0, sticky="nsew")
    tk.Label(zone1, text="1. Selection", font=("Segoe UI", 8, "bold"), fg=ACCENT_COLOR).pack(anchor="nw", padx=5, pady=(2, 0))

    # Zone 2: Dynamic Options
    zone2 = tk.Frame(types_container, bd=0)
    zone2.grid(row=0, column=2, sticky="nsew")
    tk.Label(zone2, text="2. Options", font=("Segoe UI", 8, "bold"), fg=ACCENT_COLOR).pack(anchor="nw", padx=5, pady=(2, 0))
    dynamic_options_inner = tk.Frame(zone2)
    dynamic_options_inner.pack(fill="both", expand=True, padx=5)

    # Zone 3: Description
    zone3 = tk.Frame(types_container, bd=0)
    zone3.grid(row=0, column=4, sticky="nsew")
    tk.Label(zone3, text="3. Info", font=("Segoe UI", 8, "bold"), fg=ACCENT_COLOR).pack(anchor="nw", padx=5, pady=(2, 0))
    
    type_info_var = tk.StringVar(value="Select types...")
    type_info_label = tk.Label(zone3, textvariable=type_info_var, justify="left", anchor="nw", font=("Segoe UI", 8), fg="#aaaaaa", wraplength=140)
    type_info_label.pack(fill="both", expand=True, padx=8, pady=2)

    # Zone 4: Extra / Placeholder
    zone4 = tk.Frame(types_container, bd=0)
    zone4.grid(row=0, column=6, sticky="nsew")
    tk.Label(zone4, text="4. Summary", font=("Segoe UI", 8, "bold"), fg=ACCENT_COLOR).pack(anchor="nw", padx=5, pady=(2, 0))
    
    type_summary_var = tk.StringVar(value="-")
    tk.Label(zone4, textvariable=type_summary_var, justify="left", anchor="nw", font=("Segoe UI", 8), fg="#888888").pack(fill="both", expand=True, padx=8)

    # Disable auto_hide to prevent horizontal jittering when scrollbar appears/disappears
    scrollable_types = ScrollableFrame(zone1, auto_hide=False)
    scrollable_types.pack(fill="both", expand=True)

    # Store mapping of id to label
    type_id_to_label = {t["id"]: t["full_label"] for t in available_types}
    
    # Current types (could be string or list)
    initial_types = item.get("types", []) if item else []
    if not initial_types and item and item.get("type"):
        initial_types = [item["type"]]
    if isinstance(initial_types, str):
        initial_types = [initial_types]

    type_vars = {}
    for t in available_types:
        var = tk.BooleanVar(value=t["id"] in initial_types)
        type_vars[t["id"]] = var
        cb = tk.Checkbutton(
            scrollable_types.inner_frame, 
            text=t["full_label"], 
            variable=var,
            anchor="w"
        )
        cb.pack(fill="x", padx=5)

    def get_selected_types():
        return [tid for tid, var in type_vars.items() if var.get()]

    # Rarity
    tk.Label(form_frame, text="Rarity:", width=15, anchor="w").grid(row=4, column=0, sticky="w", pady=2)
    rarity_var = tk.StringVar(value=item["rarity"] if item else "common")
    
    rarity_values = list(rarity_colors.keys())
    if item and item["rarity"] not in rarity_values:
        rarity_values.append(item["rarity"])
    
    rarity_combo = ttk.Combobox(form_frame, textvariable=rarity_var, values=rarity_values, width=37, state="readonly")
    rarity_combo.grid(row=4, column=1, sticky="ew", pady=2)
    
    def update_rarity_color_preview(*_):
        color = rarity_colors.get(rarity_var.get(), ENTRY_BG) # Default to ENTRY_BG if not found
        rarity_color_preview.config(bg=color)

    rarity_color_preview = tk.Frame(form_frame, width=20, height=20, bd=1, relief="solid", bg=rarity_colors.get(rarity_var.get(), ENTRY_BG))
    rarity_color_preview.grid(row=4, column=2, padx=5)
    rarity_var.trace_add("write", update_rarity_color_preview)

    # Max Stack
    tk.Label(form_frame, text="Max Stack:", width=15, anchor="w").grid(row=5, column=0, sticky="w", pady=2)
    max_stack_var = tk.StringVar(value=str(item["maxStack"]) if item else "1")
    
    # Sort and convert to strings for the combobox
    stack_values = sorted(list(set(available_max_stacks + ([item["maxStack"]] if item else [1]))))
    stack_values_str = [str(v) for v in stack_values]
    
    max_stack_combo = ttk.Combobox(form_frame, textvariable=max_stack_var, values=stack_values_str, width=37)
    max_stack_combo.grid(row=5, column=1, sticky="ew", pady=2)

    # Accent Color
    tk.Label(form_frame, text="Accent Color:", width=15, anchor="w").grid(row=6, column=0, sticky="w", pady=2)
    accent_var = tk.StringVar(value=item["accent"] if item else "#FFFFFF")
    accent_entry = tk.Entry(form_frame, textvariable=accent_var, width=40)
    accent_entry.grid(row=6, column=1, sticky="ew", pady=2)
    
    def update_accent_color_preview(*_):
        color = accent_var.get()
        # Basic validation for hex color
        if re.fullmatch(r"^#([0-9a-fA-F]{3}){1,2}$", color):
            accent_color_preview.config(bg=color)
        else:
            accent_color_preview.config(bg=ENTRY_BG) # Default to ENTRY_BG for invalid input

    accent_color_preview = tk.Frame(form_frame, width=20, height=20, bd=1, relief="solid", bg=accent_var.get() if accent_var.get() else ENTRY_BG)
    accent_color_preview.grid(row=6, column=2, padx=5)
    accent_var.trace_add("write", update_accent_color_preview)

    # Icon Path
    tk.Label(form_frame, text="Icon:", width=15, anchor="w").grid(row=7, column=0, sticky="w", pady=2)
    icon_var = tk.StringVar(value=str(item["icon"]) if item and item.get("icon") else "")
    
    icon_entry_frame = tk.Frame(form_frame)
    icon_entry_frame.grid(row=7, column=1, sticky="ew", pady=2)
    
    icon_entry = tk.Entry(icon_entry_frame, textvariable=icon_var, width=30)
    icon_entry.pack(side="left", fill="x", expand=True)
    
    def open_icon_selector():
        if assets_root and currencies_root:
            current = Path(icon_var.get()) if icon_var.get() else None
            dialog = IconSelectorDialog(parent.winfo_toplevel(), assets_root, currencies_root, current)
            parent.wait_window(dialog)
            if dialog.selected_icon:
                # We want the relative path or just the filename?
                # game_io/items.py expects the full path but then extracts the name
                # Actually, IconSelectorDialog returns the full Path to the image.
                icon_var.set(str(dialog.selected_icon))

    choose_icon_btn = ModernButton(icon_entry_frame, text="Select...", command=open_icon_selector, padx=5, pady=2)
    choose_icon_btn.pack(side="left", padx=(5, 0))

    # Dynamic Options (Zone 2)
    # Bag Capacity
    bag_capacity_var = tk.StringVar(value=str(item["capacity"]) if item and "capacity" in item else "")
    bag_capacity_label = tk.Label(dynamic_options_inner, text="Bag Capacity:", anchor="w")
    bag_capacity_entry = tk.Entry(dynamic_options_inner, textvariable=bag_capacity_var, width=15)

    # Target Slot
    tk.Label(dynamic_options_inner, text="Target Slot:", anchor="w").pack(anchor="w", pady=(5, 0))
    slot_var = tk.StringVar(value=item.get("slot", "") if item else "")
    available_slots = [""] + get_all_character_slots()
    slot_combo = ttk.Combobox(dynamic_options_inner, textvariable=slot_var, values=available_slots, width=13)
    slot_combo.pack(fill="x", pady=2)

    bag_capacity_state = {"visible": None}

    def update_type_info(*_):
        selected_ids = get_selected_types()
        selected_data = [t for t in available_types if t["id"] in selected_ids]
        
        # Update Slot automatically if not set or just changed
        if selected_data and not slot_var.get():
            # Find first type that has a slot
            for t in selected_data:
                if t.get("slot"):
                    slot_var.set(t["slot"])
                    break

        # Update Description (Zone 3)
        if not selected_data:
            type_info_var.set("No types selected.")
        else:
            lines = []
            for t in selected_data:
                desc = t.get("full_label", t["id"])
                if t.get("is_equipment"):
                    desc += f" (Slot: {t.get('slot', 'any')})"
                if t.get("is_bag"):
                    desc += " [Inventory Container]"
                lines.append(f"- {desc}")
            type_info_var.set("\n".join(lines))
            
        # Update Summary (Zone 4)
        count = len(selected_ids)
        type_summary_var.set(f"Selected: {count}\nPrimary: {selected_ids[0] if count > 0 else 'None'}")

    def toggle_bag_capacity_field(*_):
        selected_types = get_selected_types()
        # Find if any selected type is 'bag' or has is_bag feature
        is_bag = "bag" in selected_types or any(t.get("is_bag") for t in available_types if t["id"] in selected_types)
        
        if is_bag != bag_capacity_state["visible"]:
            bag_capacity_state["visible"] = is_bag
            if is_bag:
                bag_capacity_label.pack(anchor="w", pady=(5, 0))
                bag_capacity_entry.pack(fill="x", pady=2)
            else:
                bag_capacity_label.pack_forget()
                bag_capacity_entry.pack_forget()
    
    # Trace changes in all type checkboxes
    for var in type_vars.values():
        var.trace_add("write", lambda *_: (toggle_bag_capacity_field(), update_type_info(), validate()))
        
    toggle_bag_capacity_field() # Initialize visibility
    update_type_info() # Initialize info zone

    # Error message (Fixed height to prevent jumping)
    error_var = tk.StringVar()
    error_label = tk.Label(form_frame, textvariable=error_var, fg="#ff4444", anchor="nw", height=2, justify="left")
    error_label.grid(row=9, column=1, sticky="new", pady=(5, 0))

    # Action Buttons
    button_frame = tk.Frame(container)
    button_frame.pack(fill="x", pady=(20, 0))

    save_button = ModernButton(button_frame, text="Save", command=lambda: on_save_click(item is not None), bg=BUTTON_BG, fg="#b8f5b8")
    save_button.pack(side="left", padx=(0, 10))

    cancel_button = ModernButton(button_frame, text="Cancel", command=on_cancel)
    cancel_button.pack(side="left")

    if item and on_delete:
        delete_button = ModernButton(button_frame, text="Delete", command=lambda: on_delete(item["id"]), bg="#5a2a2a", fg="#ffcccc")
        delete_button.pack(side="right")

    # Tracking current state to avoid redundant UI updates (flickering)
    validation_state = {"is_valid": None, "missing_fields": None, "error_msg": None}

    def validate(*_):
        is_valid = True
        missing_fields = []
        error_msg = ""

        # Name
        name = name_var.get().strip()
        if not name:
            if name_entry.cget("bg") != ERROR_BG:
                name_entry.config(bg=ERROR_BG)
            is_valid = False
            missing_fields.append("Name")
        elif existing_names and name in [n for n in existing_names if not item or n != item.get("name")]:
            if name_entry.cget("bg") != ERROR_BG:
                name_entry.config(bg=ERROR_BG)
            error_msg = "Name already exists"
            is_valid = False
        else:
            if name_entry.cget("bg") != ENTRY_BG:
                name_entry.config(bg=ENTRY_BG)

        # Category
        if not category_var.get().strip():
            is_valid = False
            missing_fields.append("Category")

        # Types
        selected_types = get_selected_types()
        if not selected_types:
            if types_container.cget("highlightbackground") != "#ff4444":
                types_container.config(highlightbackground="#ff4444")
            is_valid = False
            missing_fields.append("Type")
        else:
            if types_container.cget("highlightbackground") != BG_COLOR:
                types_container.config(highlightbackground=BG_COLOR)

        # Icon
        if not icon_var.get().strip():
            if icon_entry.cget("bg") != ERROR_BG:
                icon_entry.config(bg=ERROR_BG)
            is_valid = False
            missing_fields.append("Icon")
        else:
            if icon_entry.cget("bg") != ENTRY_BG:
                icon_entry.config(bg=ENTRY_BG)

        if not is_valid and not error_msg and missing_fields:
            error_msg = f"Missing: {', '.join(missing_fields)}"

        # Update button and error message ONLY if state changed
        if (is_valid != validation_state["is_valid"] or 
            error_msg != validation_state["error_msg"]):
            
            validation_state["is_valid"] = is_valid
            validation_state["error_msg"] = error_msg
            
            if is_valid:
                save_button.config(state="normal", bg=BUTTON_BG, fg="#b8f5b8")
                error_var.set("")
            else:
                save_button.config(state="disabled", bg="#555555", fg="#aaaaaa")
                error_var.set(error_msg)

    # Add traces for validation
    name_var.trace_add("write", validate)
    category_var.trace_add("write", validate)
    icon_var.trace_add("write", validate)

    # Initial validation
    validate()

    def on_save_click(is_editing_existing: bool) -> None:
        name = name_var.get().strip()
        selected_types = get_selected_types()
        
        data = {
            "name": name,
            "categoryId": category_var.get().strip(),
            "types": selected_types,
            "type": selected_types[0] if selected_types else "unknown",
            "rarity": rarity_var.get().strip(),
            "maxStack": int(max_stack_var.get() or 1),
            "accent": accent_var.get().strip(),
            "slot": slot_var.get().strip(),
            "icon": Path(icon_var.get().strip()) if icon_var.get().strip() else None
        }
        
        is_bag = "bag" in selected_types or any(t.get("is_bag") for t in available_types if t["id"] in selected_types)
        if is_bag:
            data["capacity"] = int(bag_capacity_var.get() or 0)

        if is_editing_existing:
            data["id"] = item["id"]
            on_save(data)
        else:
            base_id = re.sub(r"[^a-z0-9_]+", "_", data["name"].lower()).strip("_")
            if not base_id:
                base_id = "item"
            
            new_id = base_id
            counter = 1
            # Ensure unique ID
            while existing_ids and new_id in existing_ids:
                new_id = f"{base_id}_{counter}"
                counter += 1
                
            data["id"] = new_id
            on_save(data)

    # Initial update for color previews
    update_rarity_color_preview()
    update_accent_color_preview()
