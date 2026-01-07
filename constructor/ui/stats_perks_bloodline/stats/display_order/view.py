import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
from typing import Callable
import re

from ....theme import (
    ROW_BG,
    ROW_BORDER,
    BUTTON_BG,
    BUTTON_HOVER_BG,
    TEXT_COLOR,
    create_scrollbar,
    DIVIDER_COLOR,
    ScrollableFrame,
    ModernButton
)

def create_stats_config_view(
    parent: tk.Frame,
    all_stats: list[dict],
    current_config: list[dict],
    on_save: Callable[[list[dict]], None],
    on_back: Callable[[], None]
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    
    # Header
    header = tk.Frame(container)
    header.pack(fill="x", pady=(0, 10))
    
    tk.Label(header, text="Stats Display Configuration", font=("Segoe UI", 12, "bold")).pack(side="left")
    
    btn_save = ModernButton(header, text="Save Configuration", bg="#1f3b1f", fg="#b8f5b8", command=lambda: save_and_exit())
    btn_save.pack(side="right", padx=5)
    
    btn_back = ModernButton(header, text="Back", command=on_back)
    btn_back.pack(side="right")

    # Content
    content = tk.Frame(container)
    content.pack(fill="both", expand=True)
    
    # Left: Categories editor
    left_panel = tk.Frame(content, width=400)
    left_panel.pack(side="left", fill="both", expand=True, padx=(0, 10))
    
    tk.Label(left_panel, text="Categories & Order").pack(anchor="w")
    
    # Using ScrollableFrame for Categories
    scroll_view = ScrollableFrame(left_panel, auto_hide=True, min_width=400, bd=1, relief="solid")
    scroll_view.pack(fill="both", expand=True, pady=5)
    
    cat_inner = scroll_view.inner_frame

    # Right: Unassigned stats
    right_panel = tk.Frame(content, width=200)
    right_panel.pack(side="right", fill="y")
    
    tk.Label(right_panel, text="Available Stats").pack(anchor="w")
    
    unassigned_list_container = tk.Frame(right_panel)
    unassigned_list_container.pack(fill="both", expand=True, pady=5)
    
    unassigned_listbox = tk.Listbox(
        unassigned_list_container, 
        bg=ROW_BG, 
        fg=TEXT_COLOR, 
        selectmode="multiple",
        highlightthickness=0,
        bd=0
    )
    
    unassigned_scroll = create_scrollbar(unassigned_list_container, orient="vertical", command=unassigned_listbox.yview)
    unassigned_listbox.config(yscrollcommand=unassigned_scroll.set)
    
    def check_unassigned_scroll(_event=None):
        yview = unassigned_listbox.yview()
        if yview[0] <= 0 and yview[1] >= 1:
            unassigned_scroll.pack_forget()
        else:
            unassigned_scroll.pack(side="right", fill="y")

    unassigned_listbox.pack(side="left", fill="both", expand=True)

    # State
    local_config = [dict(c) for c in current_config]
    for c in local_config:
        c["stats"] = list(c.get("stats", []))

    def get_assigned_ids():
        ids = []
        for c in local_config:
            ids.extend(c["stats"])
        return set(ids)

    def refresh_unassigned():
        unassigned_listbox.delete(0, "end")
        assigned = get_assigned_ids()
        for s in all_stats:
            if s["id"] not in assigned:
                unassigned_listbox.insert("end", s["label"])
        right_panel.after(10, check_unassigned_scroll)

    def add_category():
        name = simpledialog.askstring("New Category", "Enter category label:")
        if name:
            cat_id = re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_")
            local_config.append({"id": cat_id, "label": name, "stats": []})
            render_categories()

    btn_add_cat = ModernButton(left_panel, text="+ Add Category", command=add_category)
    btn_add_cat.pack(anchor="w", pady=5)

    def move_cat(idx, delta):
        if 0 <= idx + delta < len(local_config):
            local_config[idx], local_config[idx+delta] = local_config[idx+delta], local_config[idx]
            render_categories()

    def remove_cat(idx):
        if messagebox.askyesno("Confirm", "Remove category? Stats will become unassigned."):
            local_config.pop(idx)
            render_categories()
            refresh_unassigned()

    def add_to_cat(cat_idx):
        selected = unassigned_listbox.curselection()
        if not selected: return
        assigned = get_assigned_ids()
        available = [s for s in all_stats if s["id"] not in assigned]
        for i in selected:
            stat = available[i]
            local_config[cat_idx]["stats"].append(stat["id"])
        render_categories()
        refresh_unassigned()

    def move_stat(cat_idx, stat_idx, delta):
        stats = local_config[cat_idx]["stats"]
        if 0 <= stat_idx + delta < len(stats):
            stats[stat_idx], stats[stat_idx+delta] = stats[stat_idx+delta], stats[stat_idx]
            render_categories()

    def remove_from_cat(cat_idx, stat_idx):
        local_config[cat_idx]["stats"].pop(stat_idx)
        render_categories()
        refresh_unassigned()

    def render_categories():
        for child in cat_inner.winfo_children():
            child.destroy()
        all_stats_map = {s["id"]: s["label"] for s in all_stats}
        for c_idx, cat in enumerate(local_config):
            cf = tk.Frame(cat_inner, bg="#1a1a1a", bd=1, relief="raised")
            cf.pack(fill="x", pady=5, padx=5)
            title_bar = tk.Frame(cf, bg="#252525")
            title_bar.pack(fill="x")
            tk.Label(title_bar, text=cat["label"], font=("Segoe UI", 10, "bold"), bg="#252525").pack(side="left", padx=5)
            ModernButton(title_bar, text="×", command=lambda i=c_idx: remove_cat(i), bg="#3a1a1a", fg="red", bd=0, padx=4).pack(side="right")
            ModernButton(title_bar, text="↓", command=lambda i=c_idx: move_cat(i, 1), bd=0, padx=4).pack(side="right", padx=2)
            ModernButton(title_bar, text="↑", command=lambda i=c_idx: move_cat(i, -1), bd=0, padx=4).pack(side="right", padx=2)
            ModernButton(title_bar, text="+ Add Selected", command=lambda i=c_idx: add_to_cat(i), bd=0, fg="#b8f5b8", bg="#1f3b1f").pack(side="right", padx=10)
            stats_list = cat.get("stats", [])
            if not stats_list:
                tk.Label(cf, text="Empty category", bg="#1a1a1a", fg="#666").pack(pady=5)
            else:
                for s_idx, sid in enumerate(stats_list):
                    s_row = tk.Frame(cf, bg="#1a1a1a")
                    s_row.pack(fill="x", padx=20)
                    label = all_stats_map.get(sid, sid)
                    tk.Label(s_row, text=f"• {label}", bg="#1a1a1a").pack(side="left")
                    ModernButton(s_row, text="x", command=lambda ci=c_idx, si=s_idx: remove_from_cat(ci, si), bg="#1a1a1a", fg="#888", bd=0, padx=4).pack(side="right")
                    ModernButton(s_row, text="↓", command=lambda ci=c_idx, si=s_idx: move_stat(ci, si, 1), bg="#1a1a1a", bd=0, padx=4).pack(side="right", padx=2)
                    ModernButton(s_row, text="↑", command=lambda ci=c_idx, si=s_idx: move_stat(ci, si, -1), bg="#1a1a1a", bd=0, padx=4).pack(side="right", padx=2)

    def save_and_exit():
        on_save(local_config)
        on_back()

    render_categories()
    refresh_unassigned()
