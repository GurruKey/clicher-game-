from pathlib import Path
from typing import Callable
import tkinter as tk
import tkinter.font as tkfont
from PIL import Image, ImageTk
from constants import DEFAULT_RARITY_COLORS, TOOLTIP_BG, TOOLTIP_BORDER, SLOT_BG, SLOT_BORDER
from ...theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    ScrollableFrame,
    ModernPanedWindow,
    ModernButton
)
from ...common import draw_rounded_rect, StandardLeftList

def create_items_view(
    parent: tk.Frame,
    items: list[dict],
    locations_by_item: dict[str, list[str]],
    rarity_colors: dict[str, str],
    bag_capacities: dict[str, int],
    on_edit: Callable[[dict], None] | None = None
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    list_view = StandardLeftList(paned)
    paned.add(list_view, minsize=280)

    detail_frame = tk.Frame(paned)
    paned.add(detail_frame, minsize=400)

    detail_title = tk.Label(
        detail_frame, text="Select an item", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    preview_frame = tk.Frame(detail_frame)
    preview_frame.pack(anchor="nw", pady=(12, 10))

    preview_canvas = tk.Canvas(
        preview_frame,
        width=64,
        height=64,
        highlightthickness=0,
        bg=detail_frame.cget("bg")
    )
    preview_canvas.grid(row=0, column=0, sticky="w")

    tooltip_font = tkfont.Font(family="Space Mono", size=11)
    tooltip_canvas = tk.Canvas(
        preview_frame,
        highlightthickness=0,
        bg=detail_frame.cget("bg")
    )
    tooltip_canvas.grid(row=1, column=0, sticky="w", pady=(6, 0))

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw")

    edit_button = ModernButton(detail_frame, text="Edit Item", command=lambda: None)
    # Hide initially
    
    search_row = tk.Frame(list_view.top_frame)
    search_row.pack(fill="x", pady=(0, 8))

    tk.Label(search_row, text="Search").pack(side="left")
    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

    filter_row = tk.Frame(list_view.top_frame)
    filter_row.pack(fill="x", pady=(0, 10))

    category_button = tk.Menubutton(filter_row, text="Category: All", relief="raised")
    category_button.pack(side="left", padx=(0, 8))
    category_menu = tk.Menu(category_button, tearoff=0)
    category_button.config(menu=category_menu)

    rarity_button = tk.Menubutton(filter_row, text="Rarity: All", relief="raised")
    rarity_button.pack(side="left", padx=(0, 8))
    rarity_menu = tk.Menu(rarity_button, tearoff=0)
    rarity_button.config(menu=rarity_menu)

    type_button = tk.Menubutton(filter_row, text="Type: All", relief="raised")
    type_button.pack(side="left", padx=(0, 8))
    type_menu = tk.Menu(type_button, tearoff=0)
    type_button.config(menu=type_menu)

    ModernButton(filter_row, text="Reset", command=lambda: reset_filters()).pack(side="left")

    inner = list_view.inner

    view_images: list[tk.PhotoImage] = []
    preview_images: list[tk.PhotoImage] = []
    row_entries: list[dict] = []
    icon_cache: dict[tuple[str, int], tk.PhotoImage] = {}

    selected_item_id: str | None = None
    hovered_item_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    def update_row_styles() -> None:
        for entry in row_entries:
            item_id = entry["id"]
            widgets = entry["widgets"]
            if item_id == selected_item_id:
                color = row_selected_hover_bg if item_id == hovered_item_id else row_selected_bg
            elif item_id == hovered_item_id:
                color = row_hover_bg
            else:
                color = row_bg
            for widget in widgets: widget.configure(bg=color)

    def select_item(item: dict) -> None:
        nonlocal selected_item_id
        selected_item_id = item["id"]
        show_item(item)
        update_row_styles()

    def on_row_enter(item_id: str) -> None:
        nonlocal hovered_item_id
        hovered_item_id = item_id
        update_row_styles()

    def on_row_leave(item_id: str) -> None:
        nonlocal hovered_item_id
        if hovered_item_id == item_id:
            hovered_item_id = None
            update_row_styles()

    def render_preview(icon: tk.PhotoImage | None) -> None:
        preview_canvas.delete("all")
        draw_rounded_rect(preview_canvas, 1, 1, 63, 63, 12, fill=SLOT_BG, outline=SLOT_BORDER)
        if icon: preview_canvas.create_image(32, 32, image=icon)

    def get_scaled_icon(icon_path: Path, target: int) -> ImageTk.PhotoImage:
        key = (str(icon_path), target)
        if key in icon_cache: return icon_cache[key]
        
        try:
            with Image.open(icon_path) as img:
                # Calculate new size maintaining aspect ratio
                ratio = min(target / img.width, target / img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                photo = ImageTk.PhotoImage(img)
                icon_cache[key] = photo
                return photo
        except Exception as e:
            print(f"Error loading image {icon_path}: {e}")
            # Return a blank small photo if error
            blank = Image.new('RGBA', (target, target), (0,0,0,0))
            photo = ImageTk.PhotoImage(blank)
            return photo

    def render_tooltip(text: str, color: str) -> None:
        tooltip_canvas.delete("all")
        text_width = tooltip_font.measure(text)
        text_height = tooltip_font.metrics("linespace")
        pad_x, pad_y = 10, 6
        width, height = text_width + pad_x * 2, text_height + pad_y * 2
        radius = min(10, height // 2)
        tooltip_canvas.config(width=width, height=height)
        draw_rounded_rect(tooltip_canvas, 1, 1, width - 1, height - 1, radius, fill=TOOLTIP_BG, outline=TOOLTIP_BORDER)
        tooltip_canvas.create_text(width / 2, height / 2, text=text, fill=color, font=tooltip_font)

    def show_item(item: dict) -> None:
        detail_title.config(text=item["name"])
        locations = locations_by_item.get(item["id"], [])
        
        # Determine primary type and full types list
        primary_type = item.get('type', 'unknown')
        if isinstance(primary_type, list):
            primary_type = primary_type[0] if primary_type else 'unknown'
            
        full_types = item.get('types', [])
        if not full_types:
            full_types = [item['type']] if isinstance(item['type'], str) else item['type']

        details = [
            f"ID: {item['id']}",
            f"Category: {item['categoryId']}",
            f"Primary Type: {primary_type}",
            f"Full Types: {', '.join(full_types) if full_types else 'n/a'}",
            f"Rarity: {item['rarity']}",
            f"Max Stack: {item['maxStack']}",
            f"Accent Color: {item['accent']}"
        ]
        
        if "bag" in full_types or any(t == "bag" for t in full_types):
            capacity = item.get("capacity") or bag_capacities.get(item["id"])
            details.append(f"Bag Capacity: {capacity if capacity is not None else 'unknown'}")
            
        details.extend(["", "Locations:"])
        details.extend([f"- {loc}" for loc in locations] if locations else ["- None"])
        detail_text.config(text="\n".join(details))
        render_tooltip(item["name"], rarity_colors.get(item["rarity"], DEFAULT_RARITY_COLORS["common"]))
        
        if on_edit:
            edit_button.config(command=lambda: on_edit(item))
            edit_button.pack(anchor="nw", pady=(10, 0))
        
        icon_path = item.get("icon")
        if icon_path and icon_path.exists():
            preview_image = get_scaled_icon(icon_path, 44)
            preview_images.clear(); preview_images.append(preview_image)
            render_preview(preview_image)
        else: render_preview(None)

    render_tooltip("Select an item", DEFAULT_RARITY_COLORS["common"])
    render_preview(None)

    search_index = []
    for item in items:
        locs = locations_by_item.get(item["id"], [])
        item_type = item.get("type", "")
        type_str = " ".join(item_type) if isinstance(item_type, list) else item_type
        
        blob = " ".join([item["id"], item["name"], item.get("categoryId", ""), type_str, item["rarity"], str(item["maxStack"]), item["accent"], " ".join(locs)]).lower()
        search_index.append((item, blob))

    def render_list(filtered: list[dict]) -> None:
        for child in inner.winfo_children(): child.destroy()
        view_images.clear(); row_entries.clear()
        for item in filtered:
            row, row_inner = list_view.create_row_frame(bg=row_bg, border=row_border)
            row_widgets = [row, row_inner]
            icon_path = item.get("icon")
            if icon_path and icon_path.exists():
                image = get_scaled_icon(icon_path, 40); view_images.append(image)
                lbl_icon = tk.Label(row_inner, image=image, bg=row_bg); lbl_icon.pack(side="left", padx=(0, 10)); row_widgets.append(lbl_icon)
            else:
                lbl_place = tk.Label(row_inner, width=6, bg=row_bg); lbl_place.pack(side="left", padx=(0, 10)); row_widgets.append(lbl_place)
            lbl_name = tk.Label(row_inner, text=item["name"], anchor="w", bg=row_bg); lbl_name.pack(side="left", fill="x", expand=True); row_widgets.append(lbl_name)
            row_entries.append({"id": item["id"], "widgets": row_widgets})
            def bind_ev(w, i_id=item["id"], it=item):
                w.bind("<Enter>", lambda e: on_row_enter(i_id))
                w.bind("<Leave>", lambda e: on_row_leave(i_id))
                w.bind("<Button-1>", lambda e: select_item(it))
            for w in row_widgets: bind_ev(w)
        parent.images = view_images
        update_row_styles()

    categories = sorted({item["categoryId"] for item in items})
    rarities = sorted({item["rarity"] for item in items})
    
    all_types = set()
    for item in items:
        if isinstance(item["type"], list):
            all_types.update(item["type"])
        else:
            all_types.add(item["type"])
    types = sorted(list(all_types))
    
    category_vars, rarity_vars, type_vars = {}, {}, {}
    is_updating_filters = False

    def get_selected(vars_map): return {k for k, v in vars_map.items() if v.get()}
    def update_menu_label(btn, label, vars_map, values):
        sel = [v for v in values if vars_map.get(v) and vars_map[v].get()]
        btn.config(text=f"{label}: All" if not values or not sel or len(sel) == len(values) else f"{label}: {len(sel)}")

    def apply_menu_options(menu, btn, label, vars_map, values):
        menu.delete(0, "end")
        menu.add_command(label="All", command=lambda: [vars_map.setdefault(v, tk.BooleanVar(value=False)).set(True) for v in values] + [on_filter_change()])
        menu.add_command(label="None", command=lambda: [v.set(False) for v in vars_map.values()] + [on_filter_change()])
        menu.add_separator()
        for v in values:
            if v not in vars_map: vars_map[v] = tk.BooleanVar(value=False)
            menu.add_checkbutton(label=v, variable=vars_map[v], command=on_filter_change)
        for e in list(vars_map.keys()):
            if e not in values: vars_map.pop(e)
        update_menu_label(btn, label, vars_map, values)

    def on_filter_change(*_):
        nonlocal is_updating_filters
        if is_updating_filters: return
        is_updating_filters = True
        q = search_var.get().strip().lower()
        c_f, r_f, t_f = get_selected(category_vars), get_selected(rarity_vars), get_selected(type_vars)
        
        def match_type(item_type, filter_types):
            if not filter_types: return True
            item_types = item_type if isinstance(item_type, list) else [item_type]
            return any(t in filter_types for t in item_types)

        filtered = [it for it, bl in search_index if (not q or q in bl) and (not c_f or it["categoryId"] in c_f) and (not r_f or it["rarity"] in r_f) and (match_type(it["type"], t_f))]
        
        c_vals = sorted({it["categoryId"] for it in filtered})
        r_vals = sorted({it["rarity"] for it in filtered})
        
        t_vals_set = set()
        for it in filtered:
            if isinstance(it["type"], list):
                t_vals_set.update(it["type"])
            else:
                t_vals_set.add(it["type"])
        t_vals = sorted(list(t_vals_set))
        
        apply_menu_options(category_menu, category_button, "Category", category_vars, categories)
        apply_menu_options(rarity_menu, rarity_button, "Rarity", rarity_vars, rarities)
        apply_menu_options(type_menu, type_button, "Type", type_vars, types)
        
        render_list(filtered)
        is_updating_filters = False

    search_entry.bind("<KeyRelease>", on_filter_change)
    def reset_filters():
        search_var.set("")
        for d in [category_vars, rarity_vars, type_vars]:
            for v in d.values(): v.set(False)
        on_filter_change()

    apply_menu_options(category_menu, category_button, "Category", category_vars, categories)
    apply_menu_options(rarity_menu, rarity_button, "Rarity", rarity_vars, rarities)
    apply_menu_options(type_menu, type_button, "Type", type_vars, types)
    render_list([it for it, _ in search_index])
    parent.images, parent.preview_images = view_images, preview_images
    apply_menu_options(type_menu, type_button, "Type", type_vars, types)
