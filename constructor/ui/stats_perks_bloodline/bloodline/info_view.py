import tkinter as tk
from tkinter import ttk
from typing import Callable, Any

from ui.ui_common import create_header, create_scrollable_list, create_search_bar
from ui.theme import PANEL_BG, TEXT_COLOR, TITLE_COLOR, BG_COLOR, ROW_BORDER, ROW_BG, ROW_HOVER_BG, ROW_SELECTED_BG, ModernPanedWindow


def create_bloodline_info_view(
    parent: tk.Frame,
    races: list[dict],
    race_variants: list[dict] | dict[str, list[dict]],
    race_levels: list[dict] | dict[str, list[dict]],
    race_tags: list[dict] | dict[str, dict]
) -> None:
    # --- Pre-process Data ---
    races_by_id = {r["id"]: r for r in races}

    all_variants: list[dict] = []
    if isinstance(race_variants, list):
        all_variants = race_variants
    elif isinstance(race_variants, dict):
        for v_list in race_variants.values():
            all_variants.extend(v_list)
            
    all_variants.sort(key=lambda x: (x.get("raceId", ""), x.get("id", "")))

    levels_by_id: dict[str, dict] = {}
    if isinstance(race_levels, list):
        for level in race_levels:
            if "id" in level:
                levels_by_id[level["id"]] = level
    elif isinstance(race_levels, dict):
        pass
        
    tags_by_id: dict[str, dict] = {}
    if isinstance(race_tags, list):
        for tag in race_tags:
            tag_id = tag.get("id")
            if tag_id:
                tags_by_id[tag_id] = tag
    elif isinstance(race_tags, dict):
        tags_by_id = race_tags


    # --- UI Construction ---
    container = tk.Frame(parent, bg=BG_COLOR)
    container.pack(fill="both", expand=True)

    # UPDATED: Use ModernPanedWindow
    paned_window = ModernPanedWindow(container, horizontal=True)
    paned_window.pack(fill="both", expand=True, padx=10, pady=10)

    # --- Left Sidebar ---
    sidebar = tk.Frame(paned_window, bg=PANEL_BG, width=300)
    sidebar.pack_propagate(False)
    paned_window.add(sidebar, minsize=200)

    create_header(sidebar, "Race Variants")

    def on_search(query: str):
        filter_list(query)

    search_frame = tk.Frame(sidebar, bg=PANEL_BG)
    search_frame.pack(fill="x", padx=10, pady=(0, 10))
    create_search_bar(search_frame, on_search)

    list_frame, list_inner = create_scrollable_list(sidebar)

    # --- Right Content ---
    content_area = tk.Frame(paned_window, bg=PANEL_BG)
    paned_window.add(content_area, minsize=400)

    details_frame, details_inner = create_scrollable_list(content_area)

    current_selection_id: str | None = None
    all_rows: list[tuple[dict, tk.Widget, tk.Label]] = [] # Storing label too for color updates

    def clear_details():
        for widget in details_inner.winfo_children():
            widget.destroy()

    def update_list_selection():
        for variant, row, lbl in all_rows:
            v_id = variant.get("id")
            if v_id == current_selection_id:
                row.config(bg=ROW_SELECTED_BG)
                lbl.config(bg=ROW_SELECTED_BG)
            else:
                row.config(bg=ROW_BG)
                lbl.config(bg=ROW_BG)

    def show_details(variant: dict):
        nonlocal current_selection_id
        current_selection_id = variant.get("id")
        update_list_selection()
        
        clear_details()
        
        race_id = variant.get("raceId")
        race = races_by_id.get(race_id, {})
        
        # Padding wrapper
        wrapper = tk.Frame(details_inner, bg=PANEL_BG)
        wrapper.pack(fill="both", expand=True, padx=20, pady=20)
        
        # 1. Header (Variant ID)
        variant_id = variant.get("id", "Unknown Variant")
        tk.Label(
            wrapper, 
            text=variant_id, 
            font=("Segoe UI", 16, "bold"),
            bg=PANEL_BG, 
            fg="#fff",
            anchor="w"
        ).pack(fill="x", pady=(0, 10))

        # 2. Basic Info Block
        def add_line(text: str):
            tk.Label(
                wrapper,
                text=text,
                font=("Segoe UI", 10),
                bg=PANEL_BG,
                fg=TEXT_COLOR,
                anchor="w",
                justify="left"
            ).pack(fill="x")

        add_line(f"ID: {variant_id}")
        
        race_name = race.get("name", race_id) if race else race_id
        add_line(f"Race: {race_name}")
        
        level = variant.get("level")
        if level:
            add_line(f"Level: {level}")
            
        tags = race.get("tagIds", []) or race.get("tags", [])
        if tags:
            tag_names = [tags_by_id.get(tid, {}).get("name", tid) for tid in tags]
            add_line(f"Tags: {', '.join(tag_names)}")
        
        tk.Frame(wrapper, bg=PANEL_BG, height=10).pack(fill="x") # Spacer

        # 3. Stats
        stats = variant.get("stats", {})
        if stats:
            add_line("Stats:")
            for k, v in stats.items():
                add_line(f"- {k.title()}: {v}")
            tk.Frame(wrapper, bg=PANEL_BG, height=10).pack(fill="x") # Spacer

        # 4. Perks
        perks = variant.get("perks", [])
        if perks:
            add_line("Perks:")
            for p in perks:
                p_name = p if isinstance(p, str) else p.get("id", "Unknown")
                add_line(f"- {p_name}")
            tk.Frame(wrapper, bg=PANEL_BG, height=10).pack(fill="x") # Spacer

        # 5. Description
        desc = variant.get("description")
        if desc:
            add_line("Description:")
            tk.Label(
                wrapper,
                text=desc,
                font=("Segoe UI", 10),
                bg=PANEL_BG,
                fg=TEXT_COLOR,
                wraplength=600,
                justify="left",
                anchor="w"
            ).pack(fill="x")
            tk.Frame(wrapper, bg=PANEL_BG, height=10).pack(fill="x") # Spacer

        # 6. Dev Note
        dev_note = variant.get("devNote")
        if dev_note:
            add_line("Dev Note:")
            tk.Label(
                wrapper,
                text=dev_note,
                font=("Segoe UI", 10),
                bg=PANEL_BG,
                fg=TEXT_COLOR,
                wraplength=600,
                justify="left",
                anchor="w"
            ).pack(fill="x")
            tk.Frame(wrapper, bg=PANEL_BG, height=10).pack(fill="x") # Spacer

        # 7. Level Guide
        level_id = variant.get("levelId")
        if level_id and level_id in levels_by_id:
            lvl_data = levels_by_id[level_id]
            add_line("Level Guide:")
            
            # Stat Budget
            sb_range = lvl_data.get("statBudgetRange")
            sb_val = lvl_data.get("statBudget")
            
            sb_text = ""
            if sb_range:
                sb_text = f"{sb_range.get('min')}-{sb_range.get('max')}"
            elif sb_val is not None:
                sb_text = str(sb_val)
                
            if sb_text:
                add_line(f"- Stat Budget: {sb_text}")
                
            # Perk Range
            pr_range = lvl_data.get("perkRange")
            if pr_range:
                pr_text = f"{pr_range.get('min')}-{pr_range.get('max')}"
                add_line(f"- Perk Range: {pr_text}")


    def build_list():
        nonlocal all_rows
        for widget in list_inner.winfo_children():
            widget.destroy()
        all_rows.clear()
        
        last_race_id = None
        
        for variant in all_variants:
            # Race header
            race_id = variant.get("raceId")
            if race_id != last_race_id:
                race_name = races_by_id.get(race_id, {}).get("name", race_id).upper()
                sep = tk.Frame(list_inner, bg="#2a2a2a", height=25)
                sep.pack(fill="x", pady=(5, 0))
                sep.pack_propagate(False) 
                
                sep_lbl = tk.Label(sep, text=race_name, bg="#2a2a2a", fg="#888", font=("Segoe UI", 9, "bold"), padx=10)
                sep_lbl.pack(side="left", fill="both")
                last_race_id = race_id

            row = tk.Frame(
                list_inner,
                bg=ROW_BG,
                highlightthickness=1,
                highlightbackground=ROW_BORDER
            )
            row.pack(fill="x", pady=1)
            
            variant_name = variant.get("id", "Unnamed")
            
            lbl = tk.Label(
                row,
                text=variant_name,
                bg=ROW_BG,
                fg=TEXT_COLOR,
                padx=15,
                pady=8,
                anchor="w"
            )
            lbl.pack(fill="both", expand=True)
            
            # Interactions
            def on_enter(e, r=row, l=lbl, v=variant):
                if v.get("id") != current_selection_id:
                    r.config(bg=ROW_HOVER_BG)
                    l.config(bg=ROW_HOVER_BG)

            def on_leave(e, r=row, l=lbl, v=variant):
                if v.get("id") != current_selection_id:
                    r.config(bg=ROW_BG)
                    l.config(bg=ROW_BG)
            
            def on_click(e, v=variant):
                show_details(v)
                
            row.bind("<Enter>", on_enter)
            lbl.bind("<Enter>", on_enter)
            row.bind("<Leave>", on_leave)
            lbl.bind("<Leave>", on_leave)
            
            lbl.bind("<Button-1>", on_click)
            row.bind("<Button-1>", on_click)
            
            all_rows.append((variant, row, lbl))
            
    def filter_list(query: str):
        query = query.lower()
        for variant, widget, _ in all_rows:
            name = variant.get("id", "").lower()
            race_id = variant.get("raceId", "").lower()
            if query in name or query in race_id:
                widget.pack(fill="x", pady=1)
            else:
                widget.pack_forget()

    build_list()
    if all_variants:
        show_details(all_variants[0])
