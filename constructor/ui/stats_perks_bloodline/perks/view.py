import tkinter as tk
from tkinter import ttk, messagebox
from typing import Callable
import re

from ...theme import (
    DIVIDER_COLOR, ROW_BG, ROW_BORDER, ROW_HOVER_BG, ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG, BUTTON_BG, ScrollableFrame
)

def create_perks_info_view(
    parent: tk.Frame, 
    perks: list[dict], 
    on_save: Callable[[dict], None],
    stat_targets: list[dict] | None = None,
    resource_targets: list[dict] | None = None,
    on_delete: Callable[[str], bool] | None = None,
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

    detail_title = tk.Label(detail_frame, text="Select a perk", font=("Segoe UI", 12, "bold")); detail_title.pack(anchor="nw")
    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw"); detail_text.pack(anchor="nw", pady=(12, 0))

    # --- Edit View ---
    edit_frame = tk.Frame(detail_frame)
    tk.Label(edit_frame, text="Perk Name (Label):").pack(anchor="w")
    tk.Button(edit_frame, text="New", command=lambda: select_perk(None), bg=BUTTON_BG, fg="#b8f5b8", padx=4).pack(anchor="e")
    entry_name = tk.Entry(edit_frame); entry_name.pack(fill="x", pady=(0, 10))

    # Stats Group
    tk.Label(edit_frame, text="Stat Bonuses:").pack(anchor="w")
    stats_container = tk.Frame(edit_frame, bg=ROW_BG, bd=1, relief="solid"); stats_container.pack(fill="x", pady=(5, 10))
    stats_list_frame = tk.Frame(stats_container, bg=ROW_BG); stats_list_frame.pack(fill="x", padx=5, pady=5)
    
    add_stat_row = tk.Frame(edit_frame); add_stat_row.pack(fill="x", pady=(0, 10))
    stat_var = tk.StringVar(); combo_stat = ttk.Combobox(add_stat_row, textvariable=stat_var, state="readonly", width=18); combo_stat.pack(side="left")
    entry_stat_val = tk.Entry(add_stat_row, width=5); entry_stat_val.pack(side="left", padx=5); entry_stat_val.insert(0, "1")
    btn_add_stat = tk.Button(add_stat_row, text="+", width=3); btn_add_stat.pack(side="left")

    # Resources Group (Unlock)
    tk.Label(edit_frame, text="Unlock Resources (Visibility):").pack(anchor="w", pady=(10, 0))
    res_container = tk.Frame(edit_frame, bg=ROW_BG, bd=1, relief="solid"); res_container.pack(fill="x", pady=(5, 10))
    res_list_frame = tk.Frame(res_container, bg=ROW_BG); res_list_frame.pack(fill="x", padx=5, pady=5)

    add_res_row = tk.Frame(edit_frame); add_res_row.pack(fill="x", pady=(0, 10))
    res_var = tk.StringVar(); combo_res = ttk.Combobox(add_res_row, textvariable=res_var, state="readonly", width=18); combo_res.pack(side="left")
    btn_add_res = tk.Button(add_res_row, text="+", width=3); btn_add_res.pack(side="left", padx=5)

    btn_save_frame = tk.Frame(edit_frame); btn_save_frame.pack(fill="x", pady=(15, 0))
    btn_save = tk.Button(btn_save_frame, text="Save Changes", bg="#1f3b1f", fg="#b8f5b8"); btn_save.pack(side="left")
    btn_delete = tk.Button(btn_save_frame, text="Delete", bg="#5a2a2a", fg="#ffcccc"); btn_delete.pack(side="right")

    # --- Logic ---
    row_entries = []; selected_perk_id = None; hovered_perk_id = None; is_editing = False
    current_perks = list(perks); stats_source = stat_targets or []; resources_source = resource_targets or []
    current_perk_stats = {}; current_unlocked_res = []

    def get_stat_label(sid): return next((s["label"] for s in stats_source if s["id"] == sid), sid)
    def get_res_label(rid): return next((r["label"] for r in resources_source if r["id"] == rid), rid)

    def render_stats_list():
        for child in stats_list_frame.winfo_children(): child.destroy()
        if not current_perk_stats: tk.Label(stats_list_frame, text="No stats", bg=ROW_BG, fg="#888").pack(anchor="w")
        for sid, val in current_perk_stats.items():
            r = tk.Frame(stats_list_frame, bg=ROW_BG); r.pack(fill="x")
            tk.Label(r, text=f"{get_stat_label(sid)}: +{val}", bg=ROW_BG, fg="#b8f5b8").pack(side="left")
            tk.Button(r, text="x", command=lambda s=sid: [current_perk_stats.pop(s), render_stats_list()], bg="#3a1a1a", fg="#ff8888", bd=0).pack(side="right")

    def render_res_list():
        for child in res_list_frame.winfo_children(): child.destroy()
        if not current_unlocked_res: tk.Label(res_list_frame, text="No resources unlocked", bg=ROW_BG, fg="#888").pack(anchor="w")
        for rid in current_unlocked_res:
            r = tk.Frame(res_list_frame, bg=ROW_BG); r.pack(fill="x")
            tk.Label(r, text=get_res_label(rid), bg=ROW_BG, fg="#b8f5b8").pack(side="left")
            tk.Button(r, text="x", command=lambda i=rid: [current_unlocked_res.remove(i), render_res_list()], bg="#3a1a1a", fg="#ff8888", bd=0).pack(side="right")

    def select_perk(perk):
        nonlocal selected_perk_id; selected_perk_id = perk["id"] if perk else None
        if perk:
            detail_title.config(text=perk["name"])
            lines = [f"ID: {perk['id']}", "", "Stats:"] + [f"- {get_stat_label(s)}: {v}" for s, v in perk.get("stats", {}).items()]
            lines += ["", "Unlocks:"] + [f"- {get_res_label(r)}" for r in perk.get("unlockResources", [])]
            detail_text.config(text="\n".join(lines))
            if is_editing:
                entry_name.delete(0, "end"); entry_name.insert(0, perk["name"])
                nonlocal current_perk_stats, current_unlocked_res
                current_perk_stats = perk.get("stats", {}).copy(); current_unlocked_res = perk.get("unlockResources", []).copy()
                render_stats_list(); render_res_list()
        else:
            detail_title.config(text="Select a perk"); detail_text.config(text="")
            if is_editing: entry_name.delete(0, "end"); current_perk_stats.clear(); current_unlocked_res.clear(); render_stats_list(); render_res_list()
        update_row_styles()

    def update_row_styles():
        for entry in row_entries:
            color = ROW_BG
            if entry["id"] == selected_perk_id: color = ROW_SELECTED_BG
            elif entry["id"] == hovered_perk_id: color = ROW_HOVER_BG
            for w in entry["widgets"]: w.configure(bg=color)

    def render_list():
        for child in inner.winfo_children(): child.destroy()
        row_entries.clear()
        q = search_var.get().lower()
        for perk in sorted(current_perks, key=lambda x: x["name"].lower()):
            if q and q not in perk["id"].lower() and q not in perk["name"].lower(): continue
            row = tk.Frame(inner, bg=ROW_BG, highlightthickness=1, highlightbackground=ROW_BORDER); row.pack(fill="x", pady=5)
            lbl = tk.Label(row, text=perk["name"], bg=ROW_BG); lbl.pack(side="left", padx=8, pady=6)
            widgets = [row, lbl]; row_entries.append({"id": perk["id"], "widgets": widgets})
            def bind_ev(w, p=perk):
                w.bind("<Enter>", lambda e: [nonlocal_set_hover(p['id']), update_row_styles()])
                w.bind("<Leave>", lambda e: [nonlocal_set_hover(None), update_row_styles()])
                w.bind("<Button-1>", lambda e: select_perk(p))
            for w in widgets: bind_ev(w)
        update_row_styles()

    def nonlocal_set_hover(pid): nonlocal hovered_perk_id; hovered_perk_id = pid
    
    def add_stat():
        l = stat_var.get(); sid = next((s["id"] for s in stats_source if s["label"] == l), None)
        if sid:
            try: v = float(entry_stat_val.get() or 1); current_perk_stats[sid] = int(v) if v.is_integer() else v; render_stats_list()
            except: pass
    btn_add_stat.config(command=add_stat)

    def add_res():
        l = res_var.get(); rid = next((r["id"] for r in resources_source if r["label"] == l), None)
        if rid and rid not in current_unlocked_res: current_unlocked_res.append(rid); render_res_list()
    btn_add_res.config(command=add_res)

    search_entry.bind("<KeyRelease>", lambda e: render_list())
    btn_create_edit.config(command=lambda: [toggle_edit_mode()])
    btn_exit.config(command=lambda: [exit_edit_mode()])

    def toggle_edit_mode():
        nonlocal is_editing; is_editing = True; btn_create_edit.config(bg="#1f3b1f"); btn_exit.config(state="normal")
        edit_frame.pack(fill="both", expand=True); detail_title.pack_forget(); detail_text.pack_forget()
        combo_stat["values"] = sorted([s["label"] for s in stats_source]); combo_res["values"] = sorted([r["label"] for r in resources_source])
        if selected_perk_id:
            p = next((x for x in current_perks if x["id"] == selected_perk_id), None)
            if p: select_perk(p)

    def exit_edit_mode():
        nonlocal is_editing; is_editing = False; btn_create_edit.config(bg=BUTTON_BG); btn_exit.config(state="disabled")
        edit_frame.pack_forget(); detail_title.pack(anchor="nw"); detail_text.pack(anchor="nw", pady=(12, 0))
        if selected_perk_id:
            p = next((x for x in current_perks if x["id"] == selected_perk_id), None)
            if p: select_perk(p)

    btn_save.config(command=lambda: save_changes())
    def save_changes():
        name = entry_name.get().strip()
        if not name: return
        data = {"name": name, "stats": current_perk_stats.copy(), "unlockResources": current_unlocked_res.copy()}
        if selected_perk_id:
            p = next((x for x in current_perks if x["id"] == selected_perk_id), None)
            if p: p.update(data); on_save(p)
        else:
            nid = re.sub(r"[^a-z0-9_]+", "_", name.lower()).strip("_")
            new_p = {"id": nid, **data}; current_perks.append(new_p); on_save(new_p); select_perk(new_p)
        render_list()

    def on_btn_delete():
        if selected_perk_id and on_delete and on_delete(selected_perk_id):
            nonlocal current_perks, stats_source, resources_source
            if on_refresh:
                # ВАЖНО: исправлено количество переменных для распаковки (3 вместо 2)
                current_perks, stats_source, resources_source = on_refresh()
            else:
                current_perks = [p for p in current_perks if p["id"] != selected_perk_id]
            select_perk(None); render_list(); exit_edit_mode()
            
    btn_delete.config(command=on_btn_delete)
    render_list()
