import tkinter as tk
from tkinter import ttk, messagebox
from typing import Callable
import re

from ...theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    BUTTON_BG,
    ScrollableFrame,
    ModernPanedWindow,
    ModernButton
)
from ...common import StandardLeftList


def create_locations_view(
    parent: tk.Frame,
    locations: list[dict],
    item_names: dict[str, str],
    resource_list: list[dict] | None = None,
    on_save: Callable[[dict], None] | None = None,
    on_delete: Callable[[str], None] | None = None,
    on_refresh: Callable[[], list[dict]] | None = None
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    list_view = StandardLeftList(paned)
    paned.add(list_view, minsize=280)

    detail_frame = tk.Frame(paned)
    paned.add(detail_frame, minsize=400)

    inner = list_view.inner

    # UPDATED: Use ModernButton
    btn_create_edit = ModernButton(list_view.bottom_frame, text="Create/Edit", fg="#b8f5b8")
    btn_create_edit.pack(side="left", fill="x", expand=True, padx=(0, 5))

    btn_exit_edit = ModernButton(list_view.bottom_frame, text="Exit", state="disabled")
    btn_exit_edit.pack(side="left", fill="x", expand=True, padx=(5, 0))

    detail_title = tk.Label(detail_frame, text="Select a location", font=("Segoe UI", 12, "bold"))
    detail_title.pack(anchor="nw")

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw", pady=(12, 0))

    edit_frame = tk.Frame(detail_frame)
    
    tk.Label(edit_frame, text="Location Name:").pack(anchor="w")
    entry_name = tk.Entry(edit_frame)
    entry_name.pack(fill="x", pady=(0, 10))

    coords_row = tk.Frame(edit_frame)
    coords_row.pack(fill="x", pady=(0, 10))
    tk.Label(coords_row, text="X:").pack(side="left")
    entry_x = tk.Entry(coords_row, width=8)
    entry_x.pack(side="left", padx=(5, 15))
    tk.Label(coords_row, text="Y:").pack(side="left")
    entry_y = tk.Entry(coords_row, width=8)
    entry_y.pack(side="left", padx=(5, 0))

    res_row = tk.Frame(edit_frame)
    res_row.pack(fill="x", pady=(0, 10))
    tk.Label(res_row, text="Required Resource:").pack(anchor="w")
    res_var = tk.StringVar()
    combo_res = ttk.Combobox(res_row, textvariable=res_var, state="readonly")
    combo_res.pack(fill="x", pady=(2, 5))
    
    cost_row = tk.Frame(edit_frame)
    cost_row.pack(fill="x", pady=(0, 10))
    tk.Label(cost_row, text="Click Cost:").pack(side="left")
    entry_cost = tk.Entry(cost_row, width=10)
    entry_cost.pack(side="left", padx=(5, 0))
    entry_cost.insert(0, "1")

    # --- Loot Editor UI ---
    tk.Label(edit_frame, text="Loot Table:", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(15, 5))
    
    loot_header = tk.Frame(edit_frame)
    loot_header.pack(fill="x")
    tk.Label(loot_header, text="Item", width=25, anchor="w").pack(side="left", padx=(0, 5))
    tk.Label(loot_header, text="Chance %", width=10, anchor="w").pack(side="left")
    
    loot_list_frame = tk.Frame(edit_frame)
    loot_list_frame.pack(fill="x", pady=(0, 10))

    def add_loot_row():
        add_loot_item()

    btn_add_loot = ModernButton(edit_frame, text="+ Add Item", command=add_loot_row)
    btn_add_loot.pack(anchor="w", pady=(0, 15))

    btn_save_row = tk.Frame(edit_frame)
    btn_save_row.pack(fill="x", pady=(15, 0))

    # UPDATED: Use ModernButton
    btn_save = ModernButton(btn_save_row, text="Save Location", bg="#1f3b1f", fg="#b8f5b8")
    btn_save.pack(side="left")
    btn_delete = ModernButton(btn_save_row, text="Delete", bg="#5a2a2a", fg="#ffcccc")
    btn_delete.pack(side="right")

    row_entries: list[dict] = []
    selected_loc_id: str | None = None
    hovered_loc_id: str | None = None
    is_editing = False
    current_locations = list(locations)
    resources = resource_list if resource_list else []
    
    # State for loot editing
    current_loot: list[dict] = []
    loot_rows: list[dict] = []

    # Prepare item list for combobox
    # Sort items by name
    sorted_items = sorted(item_names.items(), key=lambda x: x[1])
    item_display_list = [f"{name} ({iid})" for iid, name in sorted_items]
    item_map = {f"{name} ({iid})": iid for iid, name in sorted_items}
    # Reverse map for populating
    id_to_display = {iid: f"{name} ({iid})" for iid, name in sorted_items}

    def render_loot_editor():
        for child in loot_list_frame.winfo_children(): child.destroy()
        loot_rows.clear()
        
        for i, entry in enumerate(current_loot):
            row = tk.Frame(loot_list_frame, bg=ROW_BG)
            row.pack(fill="x", pady=1)
            
            # Item Combobox
            item_var = tk.StringVar()
            iid = entry.get("id")
            if iid in id_to_display:
                item_var.set(id_to_display[iid])
            elif iid:
                item_var.set(iid)
                
            cb = ttk.Combobox(row, textvariable=item_var, values=item_display_list, width=25, state="readonly")
            cb.pack(side="left", padx=(0, 5))
            
            # Chance Entry
            chance_var = tk.StringVar(value=str(entry.get("chance", 0)))
            entry_chance = tk.Entry(row, textvariable=chance_var, width=10)
            entry_chance.pack(side="left", padx=(0, 5))
            
            # Delete Button
            def delete_row(idx=i):
                current_loot.pop(idx)
                render_loot_editor()
            
            btn_del = ModernButton(row, text="x", command=delete_row, bg="#3a1a1a", fg="#ff8888", padx=5, pady=0)
            btn_del.pack(side="left")
            
            loot_rows.append({
                "item_var": item_var,
                "chance_var": chance_var
            })

    def add_loot_item():
        # Add empty item
        current_loot.append({"id": "", "chance": 10})
        render_loot_editor()

    def update_row_styles() -> None:
        for entry in row_entries:
            loc_id = entry["id"]
            widgets = entry["widgets"]
            color = ROW_BG
            if loc_id == selected_loc_id:
                color = ROW_SELECTED_HOVER_BG if loc_id == hovered_loc_id else ROW_SELECTED_BG
            elif loc_id == hovered_loc_id:
                color = ROW_HOVER_BG
            for widget in widgets: widget.configure(bg=color)

    def populate_edit_fields(loc: dict) -> None:
        entry_name.delete(0, "end")
        entry_name.insert(0, loc["name"])
        
        coords = loc.get("coords", {"x": 0, "y": 0})
        entry_x.delete(0, "end")
        entry_x.insert(0, str(coords.get("x", 0)))
        entry_y.delete(0, "end")
        entry_y.insert(0, str(coords.get("y", 0)))
        
        entry_cost.delete(0, "end")
        entry_cost.insert(0, str(loc.get("resourceCost", 1)))
        
        res_names = [r["label"] for r in resources]
        combo_res["values"] = res_names
        
        curr_res_id = loc.get("requiredResourceId")
        curr_res = next((r for r in resources if r["id"] == curr_res_id), None)
        if curr_res:
            res_var.set(curr_res["label"])
        elif res_names:
            combo_res.current(0)
            
        # Populate loot
        current_loot.clear()
        if "loot" in loc:
            import copy
            current_loot.extend(copy.deepcopy(loc["loot"]))
        render_loot_editor()

    def show_location(loc: dict) -> None:
        nonlocal selected_loc_id
        selected_loc_id = loc["id"]
        
        coords = loc.get("coords", {"x": 0, "y": 0})
        res_id = loc.get("requiredResourceId", "max_stamina")
        res_label = next((r["label"] for r in resources if r["id"] == res_id), res_id)
        cost = loc.get("resourceCost", 1)
        
        lines = [
            f"ID: {loc['id']}",
            f"Coords: {coords.get('x', 0)}, {coords.get('y', 0)}",
            f"Required Resource: {res_label}",
            f"Interaction Cost: {cost}",
            "",
            "Drops:"
        ]
        
        loot = loc.get("loot", [])
        if loot:
            for entry in loot:
                name = item_names.get(entry["id"], entry["id"])
                lines.append(f"- {name} ({entry['chance']}%)")
        else:
            lines.append("- None")
            
        detail_title.config(text=loc["name"])
        detail_text.config(text="\n".join(lines))
        
        if is_editing: populate_edit_fields(loc)
        update_row_styles()

    def render_list():
        for child in inner.winfo_children(): child.destroy()
        row_entries.clear()
        for loc in current_locations:
            row, row_inner = list_view.create_row_frame()
            
            lbl = tk.Label(row_inner, text=loc["name"], anchor="w", bg=ROW_BG)
            lbl.pack(side="left", fill="x", expand=True)
            
            row_widgets = [row, row_inner, lbl]
            row_entries.append({"id": loc["id"], "widgets": row_widgets})
            
            def bind_ev(w, obj=loc):
                w.bind("<Enter>", lambda e: [nonlocal_set_hover(obj["id"]), update_row_styles()])
                w.bind("<Leave>", lambda e: [nonlocal_set_hover(None), update_row_styles()])
                w.bind("<Button-1>", lambda e: show_location(obj))
            
            for w in row_widgets: bind_ev(w)
        update_row_styles()

    def nonlocal_set_hover(lid):
        nonlocal hovered_loc_id
        hovered_loc_id = lid

    def toggle_edit_mode():
        nonlocal is_editing
        is_editing = True
        btn_create_edit.config(text="Creating/Editing...", state="disabled")
        btn_exit_edit.config(state="normal")
        detail_title.pack_forget()
        detail_text.pack_forget()
        edit_frame.pack(fill="both", expand=True, anchor="nw")
        if selected_loc_id:
            loc = next((l for l in current_locations if l["id"] == selected_loc_id), None)
            if loc: populate_edit_fields(loc)
        else:
            entry_name.delete(0, "end")
            entry_x.delete(0, "end")
            entry_x.insert(0, "0")
            entry_y.delete(0, "end")
            entry_y.insert(0, "0")
            entry_cost.delete(0, "end")
            entry_cost.insert(0, "1")
            if resources: combo_res.current(0)
            current_loot.clear()
            render_loot_editor()

    def exit_edit_mode():
        nonlocal is_editing
        is_editing = False
        btn_create_edit.config(text="Create/Edit", state="normal")
        btn_exit_edit.config(state="disabled")
        edit_frame.pack_forget()
        detail_title.pack(anchor="nw")
        detail_text.pack(anchor="nw", pady=(12, 0))
        if selected_loc_id:
            loc = next((l for l in current_locations if l["id"] == selected_loc_id), None)
            if loc: show_location(loc)

    def save_changes():
        nonlocal current_locations
        name = entry_name.get().strip()
        if not name or not on_save: return
        
        try:
            x = float(entry_x.get())
            y = float(entry_y.get())
            cost = float(entry_cost.get())
        except ValueError:
            messagebox.showerror("Error", "Invalid numeric values")
            return
            
        res_label = res_var.get()
        res_id = next((r["id"] for r in resources if r["label"] == res_label), "max_stamina")
        
        # Collect loot
        final_loot = []
        for row in loot_rows:
            display_name = row["item_var"].get()
            iid = item_map.get(display_name)
            if not iid: continue # Skip empty or invalid items
            
            try:
                chance = float(row["chance_var"].get())
            except ValueError:
                chance = 0.0
            
            final_loot.append({"id": iid, "chance": chance})

        if selected_loc_id:
            loc = next((l for l in current_locations if l["id"] == selected_loc_id), None)
            if loc:
                loc["name"] = name
                loc["coords"] = {"x": x, "y": y}
                loc["requiredResourceId"] = res_id
                loc["resourceCost"] = cost
                loc["loot"] = final_loot
                on_save(loc)
        else:
            nid = re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_")
            new_loc = {
                "id": nid, "name": name,
                "coords": {"x": x, "y": y},
                "requiredResourceId": res_id,
                "resourceCost": cost,
                "loot": final_loot
            }
            current_locations.append(new_loc)
            on_save(new_loc)
            
        if on_refresh:
            current_locations = on_refresh()
        current_locations.sort(key=lambda x: x["name"].lower())
        render_list()
        exit_edit_mode()

    btn_create_edit.config(command=toggle_edit_mode)
    btn_exit_edit.config(command=exit_edit_mode)
    btn_save.config(command=save_changes)
    
    render_list()

