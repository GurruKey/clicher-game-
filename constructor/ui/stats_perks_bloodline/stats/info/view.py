import tkinter as tk
from tkinter import ttk, messagebox
from typing import Callable
import re

from .list_panel import create_list_panel
from .detail_panel import create_detail_panel, update_detail_view
from .edit_panel import create_edit_panel
from ....theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    BUTTON_BG,
    TEXT_COLOR,
    ModernPanedWindow,
    ModernButton
)

def create_stats_info_view(
    parent: tk.Frame, 
    stats: list[dict], 
    on_save: Callable[[dict], None],
    stat_targets: list[dict] | None = None,
    resource_targets: list[dict] | None = None,
    on_delete: Callable[[str], bool] | None = None,
    on_reassign: Callable[[str], bool] | None = None,
    on_replace: Callable[[str], bool] | None = None,
    on_refresh: Callable[[], tuple[list[dict], list[dict], list[dict]]] | None = None
) -> None:
    # --- State ---
    current_stats = list(stats)
    stats_source = stat_targets if stat_targets is not None else stats
    res_source = resource_targets if resource_targets is not None else []
    
    selected_stat_id = [None]
    hovered_stat_id = [None]
    is_editing = [False]
    current_modifiers = []
    row_entries = []
    search_index = []

    # --- Main Layout ---
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    # UPDATED: Use ModernPanedWindow
    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    left_frame = tk.Frame(paned)
    paned.add(left_frame, minsize=280)

    right_frame = tk.Frame(paned)
    paned.add(right_frame, minsize=400)

    # --- UI Helpers ---
    def get_stat_label(sid: str) -> str:
        all_sources = stats_source + res_source
        s = next((x for x in all_sources if x["id"] == sid), None)
        return s["label"] if s else sid

    def update_row_styles() -> None:
        for entry in row_entries:
            sid = entry["id"]
            widgets = entry["widgets"]
            color = ROW_BG
            if sid == selected_stat_id[0]:
                color = ROW_SELECTED_HOVER_BG if sid == hovered_stat_id[0] else ROW_SELECTED_BG
            elif sid == hovered_stat_id[0]:
                color = ROW_HOVER_BG
            for w in widgets: w.configure(bg=color)

    def refresh_search_index():
        nonlocal search_index
        stats_sorted = sorted(current_stats, key=lambda item: item["label"].lower())
        search_index = [(s, f"{s['id']} {s['label']}".lower()) for s in stats_sorted]

    # --- Panel Handlers ---
    def render_modifiers():
        frame = edit_widgets["modifiers_list_frame"]
        for child in frame.winfo_children(): child.destroy()
        if not current_modifiers:
            tk.Label(frame, text="No modifiers added", bg=ROW_BG, fg="#888").pack(anchor="w"); return
        for idx, mod in enumerate(current_modifiers):
            row = tk.Frame(frame, bg=ROW_BG); row.pack(fill="x", pady=2)
            target_name = get_stat_label(mod["targetStatId"])
            val = mod['value']; sign = "+" if val >= 0 else ""
            color = "#ff8888" if val < 0 else "#b8f5b8"
            tk.Label(row, text=f"{target_name}: {sign}{val}", bg=ROW_BG, fg=color).pack(side="left")
            def rm(i=idx): current_modifiers.pop(i); render_modifiers()
            ModernButton(row, text="x", command=rm, bg="#3a1a1a", fg="#ff8888", bd=0, padx=4).pack(side="right")

    def populate_edit_fields(stat: dict):
        edit_widgets["entry_label"].delete(0, "end"); edit_widgets["entry_label"].insert(0, stat["label"])
        edit_widgets["text_effects"].delete("1.0", "end"); edit_widgets["text_effects"].insert("1.0", "\n".join(stat.get("effects", [])))
        current_modifiers.clear()
        current_modifiers.extend([m.copy() for m in stat.get("modifiers", [])])
        render_modifiers()
        
        self_id = stat["id"]
        sl = sorted([s["label"] for s in stats_source if s["id"] != self_id])
        edit_widgets["combo_stat"]["values"] = sl
        if sl: edit_widgets["combo_stat"].current(0)
        rl = sorted([s["label"] for s in res_source if s["id"] != self_id])
        edit_widgets["combo_res"]["values"] = rl
        if rl: edit_widgets["combo_res"].current(0)

    def select_stat(stat: dict | None):
        selected_stat_id[0] = stat["id"] if stat else None
        if stat:
            update_detail_view(detail_widgets, stat, get_stat_label)
            if is_editing[0]: populate_edit_fields(stat)
        else:
            detail_widgets["title"].config(text="Select a stat"); detail_widgets["text"].config(text="")
            if is_editing[0]:
                edit_widgets["entry_label"].delete(0, "end")
                edit_widgets["text_effects"].delete("1.0", "end")
                current_modifiers.clear(); render_modifiers()
        update_row_styles()

    def on_row_enter(sid: str):
        hovered_stat_id[0] = sid
        update_row_styles()

    def on_row_leave(sid: str):
        if hovered_stat_id[0] == sid:
            hovered_stat_id[0] = None
            update_row_styles()

    def render_list(filtered: list[dict]):
        inner = list_widgets["inner"]
        list_view = list_widgets["list_view"]
        for child in inner.winfo_children(): child.destroy()
        row_entries.clear()
        for stat in filtered:
            row, row_inner = list_view.create_row_frame(bg=ROW_BG, border=ROW_BORDER)
            row_widgets = [row, row_inner]
            lbl = tk.Label(row_inner, text=stat["label"], anchor="w", bg=ROW_BG); lbl.pack(side="left", fill="x", expand=True); row_widgets.append(lbl)
            row_entries.append({"id": stat["id"], "widgets": row_widgets})
            
            def bind_events(w, s=stat):
                w.bind("<Enter>", lambda e: on_row_enter(s["id"]))
                w.bind("<Leave>", lambda e: on_row_leave(s["id"]))
                w.bind("<Button-1>", lambda e: select_stat(s))
            
            for w in row_widgets: bind_events(w)
            
        inner.update_idletasks()

    def on_filter_change(*_):
        q = list_widgets["search_var"].get().strip().lower()
        render_list([s for s, b in search_index if not q or q in b])

    # --- Actions ---
    def toggle_edit_mode():
        is_editing[0] = True
        list_widgets["btn_create_edit"].config(text="Create/Edit", bg="#1f3b1f", fg="#b8f5b8")
        list_widgets["btn_exit"].config(state="normal")
        edit_widgets["frame"].pack(fill="both", expand=True, anchor="nw")
        detail_widgets["title"].pack_forget(); detail_widgets["text"].pack_forget()
        if selected_stat_id[0]:
            s = next((x for x in current_stats if x["id"] == selected_stat_id[0]), None)
            if s: populate_edit_fields(s)

    def exit_edit_mode():
        is_editing[0] = False
        list_widgets["btn_create_edit"].config(text="Create/Edit", bg=BUTTON_BG, fg="#e6e6e6")
        list_widgets["btn_exit"].config(state="disabled")
        edit_widgets["frame"].pack_forget()
        detail_widgets["title"].pack(anchor="nw"); detail_widgets["text"].pack(anchor="nw", pady=(12, 0))
        if selected_stat_id[0]:
            s = next((x for x in current_stats if x["id"] == selected_stat_id[0]), None)
            if s: update_detail_view(detail_widgets, s, get_stat_label)

    def save_changes():
        nonlocal current_stats, stats_source
        label = edit_widgets["entry_label"].get().strip()
        if not label: return
        effects = [l.strip() for l in edit_widgets["text_effects"].get("1.0", "end").split("\n") if l.strip()]
        if selected_stat_id[0]:
            stat = next((s for s in current_stats if s["id"] == selected_stat_id[0]), None)
            if stat:
                stat["label"] = label; stat["effects"] = effects; stat["modifiers"] = [m.copy() for m in current_modifiers]
                on_save(stat); refresh_search_index(); on_filter_change(); update_detail_view(detail_widgets, stat, get_stat_label)
        else:
            nid = re.sub(r"[^a-z0-9_]+", "_", label.lower()).strip("_")
            new_stat = {"id": nid, "label": label, "effects": effects, "modifiers": [m.copy() for m in current_modifiers]}
            current_stats.append(new_stat); on_save(new_stat)
            if new_stat not in stats_source: stats_source.append(new_stat)
            refresh_search_index(); on_filter_change(); select_stat(new_stat)

    def add_modifier_logic(target_label: str, source: list[dict]):
        if not target_label: return
        tid = next((s["id"] for s in source if s["label"] == target_label), None)
        if not tid: return
        try:
            val = float(edit_widgets["entry_val"].get())
            if val.is_integer(): val = int(val)
        except ValueError: return
        current_modifiers.append({"targetStatId": tid, "value": val, "type": "flat"}); render_modifiers()

    def handle_delete():
        if on_delete(selected_stat_id[0]):
            nonlocal current_stats, stats_source, res_source
            if on_refresh:
                current_stats, stats_source, res_source = on_refresh()
            select_stat(None)
            refresh_search_index()
            on_filter_change()
            exit_edit_mode()

    def handle_reassign():
        if on_reassign(selected_stat_id[0]):
            nonlocal current_stats, stats_source, res_source
            if on_refresh:
                current_stats, stats_source, res_source = on_refresh()
            refresh_search_index()
            on_filter_change()
            s = next((x for x in current_stats if x["id"] == selected_stat_id[0]), None)
            select_stat(s)

    def handle_replace():
        if on_replace(selected_stat_id[0]):
            nonlocal current_stats, stats_source, res_source
            if on_refresh:
                current_stats, stats_source, res_source = on_refresh()
            refresh_search_index()
            on_filter_change()
            select_stat(None)

    # --- Initialize Panels ---
    list_widgets = create_list_panel(left_frame, select_stat, toggle_edit_mode, exit_edit_mode)
    list_widgets["search_var"].trace_add("write", on_filter_change)

    detail_widgets = create_detail_panel(right_frame)

    edit_handlers = {
        "on_new": lambda: select_stat(None),
        "on_add_stat": lambda: add_modifier_logic(edit_widgets["stat_var"].get(), stats_source),
        "on_add_res": lambda: add_modifier_logic(edit_widgets["res_var"].get(), res_source),
        "on_save": save_changes,
        "on_delete": handle_delete,
        "on_reassign": handle_reassign,
        "on_replace": handle_replace
    }
    edit_widgets = create_edit_panel(right_frame, edit_handlers)
    
    # Final Init
    refresh_search_index()
    render_list([s for s, _ in search_index])
