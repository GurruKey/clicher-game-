import tkinter as tk
from tkinter import ttk, colorchooser
from typing import Callable
import re

from ...theme import (
    DIVIDER_COLOR, ROW_BG, ROW_BORDER, ROW_HOVER_BG, ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG, BUTTON_BG, ScrollableFrame
)

def create_resources_info_view(
    parent: tk.Frame, 
    resources: list[dict], 
    on_save: Callable[[dict], None],
    stat_targets: list[dict] | None = None,
    resource_targets: list[dict] | None = None,
    on_delete: Callable[[str], bool] | None = None,
    on_reassign: Callable[[str], bool] | None = None,
    on_replace: Callable[[str], bool] | None = None,
    on_refresh: Callable[[], tuple[list[dict], list[dict], list[dict]]] | None = None
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    container.columnconfigure(0, weight=0); container.columnconfigure(1, weight=0); container.columnconfigure(2, weight=1); container.rowconfigure(0, weight=1)

    list_frame = tk.Frame(container); list_frame.grid(row=0, column=0, sticky="nsw", padx=(0, 10))
    divider = tk.Frame(container, width=2, bg=DIVIDER_COLOR); divider.grid(row=0, column=1, sticky="ns")
    detail_frame = tk.Frame(container); detail_frame.grid(row=0, column=2, sticky="nsew", padx=(12, 0))

    # --- Search & List ---
    search_row = tk.Frame(list_frame); search_row.pack(side="top", fill="x", pady=(0, 8))
    tk.Label(search_row, text="Search").pack(side="left")
    search_var = tk.StringVar(); search_entry = tk.Entry(search_row, textvariable=search_var, width=22); search_entry.pack(side="left", padx=(8, 0))

    # List container using ScrollableFrame
    scroll_view = ScrollableFrame(list_frame, auto_hide=True, min_width=260)
    scroll_view.pack(side="top", fill="both", expand=True)
    inner = scroll_view.inner_frame

    actions_frame = tk.Frame(list_frame); actions_frame.pack(side="bottom", fill="x", pady=(10, 0))
    btn_create_edit = tk.Button(actions_frame, text="Create/Edit", bg=BUTTON_BG, fg="#b8f5b8"); btn_create_edit.pack(side="left", fill="x", expand=True, padx=(0, 5))
    btn_exit = tk.Button(actions_frame, text="Exit", state="disabled"); btn_exit.pack(side="left", fill="x", expand=True, padx=(5, 0))

    detail_title = tk.Label(detail_frame, text="Select a resource", font=("Segoe UI", 12, "bold")); detail_title.pack(anchor="nw")
    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw"); detail_text.pack(anchor="nw", pady=(12, 0))

    # --- Edit View ---
    edit_frame = tk.Frame(detail_frame)
    name_header = tk.Frame(edit_frame); name_header.pack(fill="x")
    tk.Label(name_header, text="Resource Label (Name):").pack(side="left")
    tk.Button(name_header, text="New", command=lambda: select_resource(None), bg=BUTTON_BG, fg="#b8f5b8", padx=4).pack(side="right")
    entry_label = tk.Entry(edit_frame); entry_label.pack(fill="x", pady=(0, 10))

    vals_row = tk.Frame(edit_frame); vals_row.pack(fill="x", pady=(0, 5))
    tk.Label(vals_row, text="Base Max:", width=10, anchor="w").pack(side="left")
    entry_base = tk.Entry(vals_row, width=8); entry_base.pack(side="left", padx=(5, 15))
    tk.Label(vals_row, text="Regen ms:", width=10, anchor="w").pack(side="left")
    regen_val_var = tk.StringVar(value="0"); entry_regen = tk.Entry(vals_row, width=8, textvariable=regen_val_var); entry_regen.pack(side="left", padx=(5, 0))

    colors_group = tk.LabelFrame(edit_frame, text="Appearance", padx=10, pady=10); colors_group.pack(fill="x", pady=(10, 10))
    bar_color_row = tk.Frame(colors_group); bar_color_row.pack(fill="x", pady=(0, 5))
    tk.Label(bar_color_row, text="Bar Color:", width=12, anchor="w").pack(side="left")
    entry_color = tk.Entry(bar_color_row, width=12); entry_color.pack(side="left", padx=(5, 0))
    preview_color = tk.Frame(bar_color_row, width=20, height=20, bd=1, relief="solid"); preview_color.pack(side="left", padx=(10, 0))
    tk.Button(bar_color_row, text="Pick...", command=lambda: pick_color(entry_color, preview_color)).pack(side="left", padx=(10, 0))

    text_color_row = tk.Frame(colors_group); text_color_row.pack(fill="x", pady=(5, 0))
    tk.Label(text_color_row, text="Text Color:", width=12, anchor="w").pack(side="left")
    entry_text_color = tk.Entry(text_color_row, width=12); entry_text_color.pack(side="left", padx=(5, 0))
    preview_text_color = tk.Frame(text_color_row, width=20, height=20, bd=1, relief="solid"); preview_text_color.pack(side="left", padx=(10, 0))
    tk.Button(text_color_row, text="Pick...", command=lambda: pick_color(entry_text_color, preview_text_color)).pack(side="left", padx=(10, 0))

    btn_save_frame = tk.Frame(edit_frame); btn_save_frame.pack(fill="x", pady=(15, 0))
    btn_save = tk.Button(btn_save_frame, text="Save Changes", bg="#1f3b1f", fg="#b8f5b8"); btn_save.pack(side="left")
    btn_delete = tk.Button(btn_save_frame, text="Delete", bg="#5a2a2a", fg="#ffcccc"); btn_delete.pack(side="right")

    # --- Logic & Data ---
    row_entries = []; selected_res_id = None; hovered_res_id = None; is_editing = False
    current_resources = list(resources); stats_source = stat_targets or []; res_source = resource_targets or resources

    def pick_color(entry, preview):
        c = colorchooser.askcolor(initialcolor=entry.get().strip())[1]
        if c: entry.delete(0, "end"); entry.insert(0, c); preview.config(bg=c)

    def populate_edit_fields(res):
        entry_label.delete(0, "end"); entry_label.insert(0, res["label"])
        entry_base.delete(0, "end"); entry_base.insert(0, str(res.get("base", 0)))
        entry_color.delete(0, "end"); entry_color.insert(0, res.get("color", "#4caf50")); preview_color.config(bg=entry_color.get())
        entry_text_color.delete(0, "end"); entry_text_color.insert(0, res.get("textColor", "#ffffff")); preview_text_color.config(bg=entry_text_color.get())
        regen_val_var.set(str(res.get("regenInterval", 0)))

    def select_resource(res):
        nonlocal selected_res_id; selected_res_id = res["id"] if res else None
        if res:
            detail_title.config(text=res["label"])
            lines = [f"ID: {res['id']}", f"Base Max: {res.get('base', 0)}", f"Regen: {res.get('regenInterval', 0)}ms"]
            detail_text.config(text="\n".join(lines))
            if is_editing: populate_edit_fields(res)
        else:
            detail_title.config(text="Select a resource"); detail_text.config(text="")
            if is_editing: entry_label.delete(0, "end"); entry_base.delete(0, "end"); regen_val_var.set("0")
        update_row_styles()

    def update_row_styles():
        for entry in row_entries:
            color = ROW_BG
            if entry["id"] == selected_res_id: color = ROW_SELECTED_BG
            elif entry["id"] == hovered_res_id: color = ROW_HOVER_BG
            for w in entry["widgets"]: w.configure(bg=color)

    def render_list():
        for child in inner.winfo_children(): child.destroy()
        row_entries.clear()
        q = search_var.get().lower()
        for res in sorted(current_resources, key=lambda x: x["label"].lower()):
            if q and q not in res["id"].lower() and q not in res["label"].lower(): continue
            row = tk.Frame(inner, bg=ROW_BG, highlightthickness=1, highlightbackground=ROW_BORDER); row.pack(fill="x", pady=5)
            lbl = tk.Label(row, text=res["label"], bg=ROW_BG); lbl.pack(side="left", padx=8, pady=6)
            row_widgets = [row, lbl]; entry = {"id": res["id"], "widgets": row_widgets}; row_entries.append(entry)
            def bind_ev(w, r=res):
                w.bind("<Enter>", lambda e: [nonlocal_set_hover(r['id']), update_row_styles()])
                w.bind("<Leave>", lambda e: [nonlocal_set_hover(None), update_row_styles()])
                w.bind("<Button-1>", lambda e: select_resource(r))
            for w in row_widgets: bind_ev(w)
        update_row_styles()

    def nonlocal_set_hover(rid): nonlocal hovered_res_id; hovered_res_id = rid
    search_entry.bind("<KeyRelease>", lambda e: render_list())

    def toggle_edit_mode():
        nonlocal is_editing; is_editing = True
        btn_create_edit.config(text="Create/Edit", bg="#1f3b1f"); btn_exit.config(state="normal")
        edit_frame.pack(fill="both", expand=True); detail_title.pack_forget(); detail_text.pack_forget()
        if selected_res_id:
            res = next((r for r in current_resources if r["id"] == selected_res_id), None)
            if res: populate_edit_fields(res)

    def exit_edit_mode():
        nonlocal is_editing; is_editing = False
        btn_create_edit.config(text="Create/Edit", bg=BUTTON_BG); btn_exit.config(state="disabled")
        edit_frame.pack_forget(); detail_title.pack(anchor="nw"); detail_text.pack(anchor="nw", pady=(12, 0))
        if selected_res_id:
            res = next((r for r in current_resources if r["id"] == selected_res_id), None)
            if res: select_resource(res)

    def save_changes():
        label = entry_label.get().strip()
        if not label: return
        data = {
            "label": label, "base": float(entry_base.get() or 0), "regenInterval": int(regen_val_var.get() or 0),
            "color": entry_color.get(), "textColor": entry_text_color.get(), "is_resource": True
        }
        if selected_res_id:
            res = next((r for r in current_resources if r["id"] == selected_res_id), None)
            if res: res.update(data); on_save(res)
        else:
            nid = re.sub(r"[^a-z0-9_]+", "_", label.lower()).strip("_")
            new_res = {"id": nid, **data}; current_resources.append(new_res); on_save(new_res); select_resource(new_res)
        render_list()

    btn_create_edit.config(command=toggle_edit_mode); btn_exit.config(command=exit_edit_mode); btn_save.config(command=save_changes)
    
    def on_btn_delete():
        if selected_res_id and on_delete and on_delete(selected_res_id):
            nonlocal current_resources; current_resources = [r for r in current_resources if r["id"] != selected_res_id]
            select_resource(None); render_list(); exit_edit_mode()
    btn_delete.config(command=on_btn_delete)
    
    render_list()
