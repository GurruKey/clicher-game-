from pathlib import Path
import tkinter as tk
import tkinter.font as tkfont

from constants import DEFAULT_RARITY_COLORS, TOOLTIP_BG, TOOLTIP_BORDER, SLOT_BG, SLOT_BORDER
from .theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)
from .ui_common import draw_rounded_rect


def create_items_view(
    parent: tk.Frame,
    items: list[dict],
    locations_by_item: dict[str, list[str]],
    rarity_colors: dict[str, str],
    bag_capacities: dict[str, int]
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    container.columnconfigure(0, weight=0)
    container.columnconfigure(1, weight=0)
    container.columnconfigure(2, weight=1)
    container.rowconfigure(0, weight=1)

    list_frame = tk.Frame(container)
    list_frame.grid(row=0, column=0, sticky="nsw", padx=(0, 10))

    divider = tk.Frame(container, width=2, bg=DIVIDER_COLOR)
    divider.grid(row=0, column=1, sticky="ns")

    detail_frame = tk.Frame(container)
    detail_frame.grid(row=0, column=2, sticky="nsew", padx=(12, 0))

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

    search_row = tk.Frame(list_frame)
    search_row.pack(fill="x", pady=(0, 8))

    search_label = tk.Label(search_row, text="Search")
    search_label.pack(side="left")

    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

    filter_row = tk.Frame(list_frame)
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

    reset_button = tk.Button(filter_row, text="Reset")
    reset_button.pack(side="left")

    canvas = tk.Canvas(list_frame, width=260, highlightthickness=0)
    scrollbar = create_scrollbar(list_frame, orient="vertical", command=canvas.yview)
    inner = tk.Frame(canvas)

    def on_configure(_event) -> None:
        canvas.configure(scrollregion=canvas.bbox("all"))

    inner.bind("<Configure>", on_configure)
    canvas.create_window((0, 0), window=inner, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill="y", expand=False)
    scrollbar.pack(side="right", fill="y")

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

            for widget in widgets:
                widget.configure(bg=color)

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
        draw_rounded_rect(
            preview_canvas,
            1,
            1,
            63,
            63,
            12,
            fill=SLOT_BG,
            outline=SLOT_BORDER
        )
        if icon:
            preview_canvas.create_image(32, 32, image=icon)

    def get_scaled_icon(icon_path: Path, target: int) -> tk.PhotoImage:
        key = (str(icon_path), target)
        cached = icon_cache.get(key)
        if cached:
            return cached
        image = tk.PhotoImage(file=str(icon_path))
        scale = max(1, image.width() // target)
        if scale > 1:
            image = image.subsample(scale, scale)
        icon_cache[key] = image
        return image

    def render_tooltip(text: str, color: str) -> None:
        tooltip_canvas.delete("all")
        text_width = tooltip_font.measure(text)
        text_height = tooltip_font.metrics("linespace")
        pad_x = 10
        pad_y = 6
        width = text_width + pad_x * 2
        height = text_height + pad_y * 2
        radius = min(10, height // 2)
        tooltip_canvas.config(width=width, height=height)
        draw_rounded_rect(
            tooltip_canvas,
            1,
            1,
            width - 1,
            height - 1,
            radius,
            fill=TOOLTIP_BG,
            outline=TOOLTIP_BORDER
        )
        tooltip_canvas.create_text(
            width / 2,
            height / 2,
            text=text,
            fill=color,
            font=tooltip_font
        )

    def show_item(item: dict) -> None:
        detail_title.config(text=item["name"])
        locations = locations_by_item.get(item["id"], [])
        details = [
            f"ID: {item['id']}",
            f"Category: {item['categoryId']}",
            f"Type: {item['type']}",
            f"Rarity: {item['rarity']}",
            f"Max stack: {item['maxStack']}",
            f"Accent: {item['accent']}"
        ]
        if item["type"] == "bag":
            capacity = bag_capacities.get(item["id"])
            if capacity is not None:
                details.append(f"Capacity: {capacity}")
            else:
                details.append("Capacity: unknown")
        details.extend(["", "Locations:"])
        if locations:
            details.extend([f"- {location}" for location in locations])
        else:
            details.append("- None")
        detail_text.config(text="\n".join(details))
        render_tooltip(
            item["name"],
            rarity_colors.get(item["rarity"], DEFAULT_RARITY_COLORS["common"])
        )

        icon_path = item.get("icon")
        if icon_path and icon_path.exists():
            preview_target = 44
            preview_image = get_scaled_icon(icon_path, preview_target)

            preview_images.clear()
            preview_images.append(preview_image)
            render_preview(preview_image)
        else:
            render_preview(None)

    render_tooltip("Select an item", DEFAULT_RARITY_COLORS["common"])
    render_preview(None)

    search_index = []
    for item in items:
        locations = locations_by_item.get(item["id"], [])
        blob = " ".join(
            [
                item["id"],
                item["name"],
                item["categoryId"],
                item["type"],
                item["rarity"],
                str(item["maxStack"]),
                item["accent"],
                " ".join(locations)
            ]
        ).lower()
        search_index.append((item, blob))

    def render_list(filtered: list[dict]) -> None:
        for child in inner.winfo_children():
            child.destroy()
        view_images.clear()
        row_entries.clear()

        for item in filtered:
            row = tk.Frame(
                inner,
                bg=row_bg,
                highlightthickness=1,
                highlightbackground=row_border,
                highlightcolor=row_border
            )
            row.pack(fill="x", pady=5)

            row_inner = tk.Frame(row, bg=row_bg)
            row_inner.pack(fill="x", padx=8, pady=6)

            row_widgets: list[tk.Widget] = [row, row_inner]

            icon_path = item.get("icon")
            if icon_path and icon_path.exists():
                target = 40
                image = get_scaled_icon(icon_path, target)
                view_images.append(image)
                icon_label = tk.Label(row_inner, image=image, bg=row_bg)
                icon_label.pack(side="left", padx=(0, 10))
                row_widgets.append(icon_label)
            else:
                icon_placeholder = tk.Label(row_inner, width=6, bg=row_bg)
                icon_placeholder.pack(side="left", padx=(0, 10))
                row_widgets.append(icon_placeholder)

            text_label = tk.Label(row_inner, text=item["name"], anchor="w", bg=row_bg)
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            row_entries.append({"id": item["id"], "widgets": row_widgets})

            def bind_interaction(widget: tk.Widget, item_id: str, current: dict) -> None:
                widget.bind(
                    "<Enter>",
                    lambda _event, current_id=item_id: on_row_enter(current_id)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, current_id=item_id: on_row_leave(current_id)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current: select_item(selected)
                )

            for widget in row_widgets:
                bind_interaction(widget, item["id"], item)

        parent.images = view_images
        update_row_styles()

    categories = sorted({item["categoryId"] for item in items})
    rarities = sorted({item["rarity"] for item in items})
    types = sorted({item["type"] for item in items})
    category_vars: dict[str, tk.BooleanVar] = {}
    rarity_vars: dict[str, tk.BooleanVar] = {}
    type_vars: dict[str, tk.BooleanVar] = {}

    is_updating_filters = False

    def get_selected(vars_map: dict[str, tk.BooleanVar]) -> set[str]:
        return {key for key, var in vars_map.items() if var.get()}

    def update_menu_label(
        button: tk.Menubutton,
        label: str,
        vars_map: dict[str, tk.BooleanVar],
        values: list[str]
    ) -> None:
        selected = [
            value
            for value in values
            if vars_map.get(value, None) and vars_map[value].get()
        ]
        if not values or not selected or len(selected) == len(values):
            button.config(text=f"{label}: All")
        else:
            button.config(text=f"{label}: {len(selected)}")

    def apply_menu_options(
        menu: tk.Menu,
        button: tk.Menubutton,
        label: str,
        vars_map: dict[str, tk.BooleanVar],
        values: list[str]
    ) -> None:
        menu.delete(0, "end")

        def select_all() -> None:
            for value in values:
                vars_map.setdefault(value, tk.BooleanVar(value=False)).set(True)
            on_filter_change()

        def clear_all() -> None:
            for var in vars_map.values():
                var.set(False)
            on_filter_change()

        menu.add_command(label="All", command=select_all)
        menu.add_command(label="None", command=clear_all)
        menu.add_separator()

        for value in values:
            var = vars_map.get(value)
            if var is None:
                var = tk.BooleanVar(value=False)
                vars_map[value] = var
            menu.add_checkbutton(
                label=value,
                variable=var,
                command=on_filter_change
            )

        for existing in list(vars_map.keys()):
            if existing not in values:
                vars_map.pop(existing, None)

        update_menu_label(button, label, vars_map, values)

    def get_filtered_items(
        query: str,
        category_filter: set[str],
        rarity_filter: set[str],
        type_filter: set[str]
    ) -> list[dict]:
        filtered = []
        for item, blob in search_index:
            if query and query not in blob:
                continue
            if category_filter and item["categoryId"] not in category_filter:
                continue
            if rarity_filter and item["rarity"] not in rarity_filter:
                continue
            if type_filter and item["type"] not in type_filter:
                continue
            filtered.append(item)
        return filtered

    def refresh_filter_options(
        query: str,
        category_filter: set[str],
        rarity_filter: set[str],
        type_filter: set[str]
    ) -> None:
        nonlocal is_updating_filters
        is_updating_filters = True

        category_items = get_filtered_items(query, set(), rarity_filter, type_filter)
        rarity_items = get_filtered_items(query, category_filter, set(), type_filter)
        type_items = get_filtered_items(query, category_filter, rarity_filter, set())

        category_values = sorted({item["categoryId"] for item in category_items})
        rarity_values = sorted({item["rarity"] for item in rarity_items})
        type_values = sorted({item["type"] for item in type_items})

        apply_menu_options(
            category_menu, category_button, "Category", category_vars, category_values
        )
        apply_menu_options(
            rarity_menu, rarity_button, "Rarity", rarity_vars, rarity_values
        )
        apply_menu_options(
            type_menu, type_button, "Type", type_vars, type_values
        )

        is_updating_filters = False

    def on_filter_change(*_args: object) -> None:
        nonlocal is_updating_filters
        if is_updating_filters:
            return
        query = search_var.get().strip().lower()
        category_filter = get_selected(category_vars)
        rarity_filter = get_selected(rarity_vars)
        type_filter = get_selected(type_vars)

        refresh_filter_options(query, category_filter, rarity_filter, type_filter)
        filtered = get_filtered_items(
            query,
            get_selected(category_vars),
            get_selected(rarity_vars),
            get_selected(type_vars)
        )

        render_list(filtered)

    search_entry.bind("<KeyRelease>", on_filter_change)

    def reset_filters() -> None:
        search_var.set("")
        for var in category_vars.values():
            var.set(False)
        for var in rarity_vars.values():
            var.set(False)
        for var in type_vars.values():
            var.set(False)
        on_filter_change()

    reset_button.config(command=reset_filters)

    apply_menu_options(category_menu, category_button, "Category", category_vars, categories)
    apply_menu_options(rarity_menu, rarity_button, "Rarity", rarity_vars, rarities)
    apply_menu_options(type_menu, type_button, "Type", type_vars, types)

    render_list([item for item, _ in search_index])

    parent.images = view_images
    parent.preview_images = preview_images
