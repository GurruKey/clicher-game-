import tkinter as tk
import tkinter.font as tkfont

from constants import DEFAULT_RARITY_COLORS
from .theme import (
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
from .ui_common import draw_rounded_rect


def create_map_view(
    parent: tk.Frame,
    locations: list[dict],
    items_by_id: dict[str, dict],
    rarity_colors: dict[str, str],
    default_location_id: str | None = None
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    # UPDATED: Use ModernPanedWindow
    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    list_frame = tk.Frame(paned)
    paned.add(list_frame, minsize=240)

    map_frame = tk.Frame(paned)
    paned.add(map_frame, minsize=600)

    controls_frame = tk.Frame(map_frame)
    controls_frame.pack(fill="x", pady=(0, 8))

    recenter_button = ModernButton(
        controls_frame,
        text="◎",
        width=3,
        command=lambda: recenter()
    )
    recenter_button.pack(side="right")

    map_canvas = tk.Canvas(
        map_frame,
        highlightthickness=1,
        highlightbackground="#2a221a",
        bg="#0b0907"
    )
    map_canvas.pack(fill="both", expand=True)

    coords_label = tk.Label(
        map_frame,
        text="",
        bg="#0b0907",
        fg="#d8c27a",
        font=("Space Mono", 10)
    )
    coords_label.place(relx=0.0, rely=1.0, x=12, y=-12, anchor="sw")

    if not locations:
        tk.Label(map_frame, text="No locations").place(relx=0.5, rely=0.5)
        return

    location = None
    if default_location_id:
        location = next(
            (entry for entry in locations if entry["id"] == default_location_id),
            None
        )
    if not location:
        location = locations[0]

    selected_location = {"value": location}
    offset = {"x": 0.0, "y": 0.0}
    zoom = {"value": 1.0}
    drag_state = {"active": False, "x": 0, "y": 0}
    location_bounds = {"value": None}

    label_font = tkfont.Font(family="Space Mono", size=12, weight="bold")

    def draw_grid(width: int, height: int, origin_x: float, origin_y: float) -> None:
        spacing = max(30, int(48 * zoom["value"]))
        grid_color = "#1f1913"

        start_x = origin_x % spacing
        x = start_x
        while x < width:
            map_canvas.create_line(x, 0, x, height, fill=grid_color)
            x += spacing

        start_y = origin_y % spacing
        y = start_y
        while y < height:
            map_canvas.create_line(0, y, width, y, fill=grid_color)
            y += spacing

    def draw_location(origin_x: float, origin_y: float) -> None:
        current = selected_location["value"]
        if not current:
            return
        text = current["name"].upper()
        text_width = label_font.measure(text)
        text_height = label_font.metrics("linespace")
        pad_x = 18
        pad_y = 6
        width = text_width + pad_x * 2
        height = text_height + pad_y * 2
        x1 = origin_x - width / 2
        y1 = origin_y - height / 2
        x2 = origin_x + width / 2
        y2 = origin_y + height / 2

        draw_rounded_rect(
            map_canvas,
            int(x1),
            int(y1),
            int(x2),
            int(y2),
            8,
            fill="#14100c",
            outline="#5e4a23"
        )
        map_canvas.create_text(
            origin_x,
            origin_y,
            text=text,
            fill="#f5d36b",
            font=label_font
        )
        map_canvas.create_line(
            origin_x - 22,
            y2 + 5,
            origin_x + 22,
            y2 + 5,
            fill="#5e4a23"
        )
        location_bounds["value"] = (x1, y1, x2, y2)

    def update_coords_label() -> None:
        current = selected_location["value"]
        coords = current.get("coords") if current else None
        if coords and "x" in coords and "y" in coords:
            coords_label.config(text=f"{coords['x']:.1f}, {coords['y']:.1f}")
        else:
            coords_label.config(text="")

    def redraw() -> None:
        map_canvas.delete("all")
        width = max(1, map_canvas.winfo_width())
        height = max(1, map_canvas.winfo_height())
        origin_x = width / 2 + offset["x"]
        origin_y = height / 2 + offset["y"]
        draw_grid(width, height, origin_x, origin_y)
        draw_location(origin_x, origin_y)
        update_coords_label()

    def on_resize(_event: object) -> None:
        redraw()

    map_canvas.bind("<Configure>", on_resize)

    def on_drag_start(event: tk.Event) -> None:
        drag_state["active"] = True
        drag_state["x"] = event.x
        drag_state["y"] = event.y
        hide_info()

    def on_drag_move(event: tk.Event) -> None:
        if not drag_state["active"]:
            return
        dx = event.x - drag_state["x"]
        dy = event.y - drag_state["y"]
        drag_state["x"] = event.x
        drag_state["y"] = event.y
        offset["x"] += dx
        offset["y"] += dy
        redraw()

    def on_drag_end(_event: tk.Event) -> None:
        drag_state["active"] = False

    map_canvas.bind("<ButtonPress-1>", on_drag_start)
    map_canvas.bind("<B1-Motion>", on_drag_move)
    map_canvas.bind("<ButtonRelease-1>", on_drag_end)

    def on_wheel(event: tk.Event) -> None:
        direction = 1 if event.delta > 0 else -1
        next_zoom = zoom["value"] + direction * 0.1
        zoom["value"] = max(0.6, min(1.6, next_zoom))
        redraw()

    map_canvas.bind("<MouseWheel>", on_wheel)

    menu = tk.Menu(map_frame, tearoff=0)

    info_frame = tk.Frame(
        map_frame,
        bg="#0f0c09",
        highlightthickness=1,
        highlightbackground="#5e4a23"
    )
    info_title = tk.Label(
        info_frame,
        text="",
        font=("Segoe UI", 12, "bold"),
        bg="#0f0c09",
        fg="#f5d36b"
    )
    info_title.pack(anchor="nw", padx=12, pady=(10, 6))

    info_list = tk.Frame(info_frame, bg="#0f0c09")
    info_list.pack(fill="both", expand=True, padx=12, pady=(0, 12))

    info_footer = tk.Frame(info_frame, bg="#0f0c09")
    info_footer.pack(fill="x", padx=12, pady=(0, 12))

    info_close = ModernButton(info_footer, text="Close", command=lambda: hide_info())
    info_close.pack(side="right")

    info_images: list[tk.PhotoImage] = []
    icon_cache: dict[tuple[str, int], tk.PhotoImage] = {}

    def hide_info() -> None:
        info_frame.place_forget()

    def show_info() -> None:
        current = selected_location["value"]
        if not current:
            return
        for child in info_list.winfo_children():
            child.destroy()
        info_images.clear()

        info_title.config(text=current["name"])
        loot = current.get("loot", [])
        if not loot:
            empty_label = tk.Label(
                info_list,
                text="Empty",
                bg="#0f0c09",
                fg="#9a8f7d"
            )
            empty_label.pack(anchor="nw", pady=6)
        else:
            for entry in loot:
                item_id = entry.get("id", "unknown")
                chance = entry.get("chance", 0)
                item = items_by_id.get(item_id, {"name": item_id, "rarity": "common"})
                row = tk.Frame(
                    info_list,
                    bg="#0c0a08",
                    highlightthickness=1,
                    highlightbackground="#2f261b"
                )
                row.pack(fill="x", pady=4)

                left = tk.Frame(row, bg="#0c0a08")
                left.pack(side="left", padx=8, pady=6)

                icon_path = item.get("icon")
                if icon_path and icon_path.exists():
                    target = 20
                    key = (str(icon_path), target)
                    image = icon_cache.get(key)
                    if not image:
                        image = tk.PhotoImage(file=str(icon_path))
                        scale = max(1, image.width() // target)
                        if scale > 1:
                            image = image.subsample(scale, scale)
                        icon_cache[key] = image
                    info_images.append(image)
                    icon_label = tk.Label(left, image=image, bg="#0c0a08")
                    icon_label.pack(side="left", padx=(0, 6))

                name_color = rarity_colors.get(
                    item.get("rarity"),
                    DEFAULT_RARITY_COLORS["common"]
                )
                name_label = tk.Label(
                    left,
                    text=item.get("name", item_id),
                    bg="#0c0a08",
                    fg=name_color,
                    font=("Space Mono", 10)
                )
                name_label.pack(side="left")

                rate_label = tk.Label(
                    row,
                    text=f"{chance}%",
                    bg="#0c0a08",
                    fg="#f5d36b",
                    font=("Space Mono", 10)
                )
                rate_label.pack(side="right", padx=10)

        info_frame.place(relx=0.5, rely=0.5, anchor="center")
        info_frame.lift()

    menu.add_command(label="Info", command=show_info)

    def on_context_menu(event: tk.Event) -> None:
        bounds = location_bounds["value"]
        if not bounds:
            return
        x1, y1, x2, y2 = bounds
        if x1 <= event.x <= x2 and y1 <= event.y <= y2:
            try:
                menu.tk_popup(event.x_root, event.y_root)
            finally:
                menu.grab_release()

    map_canvas.bind("<Button-3>", on_context_menu)

    def recenter() -> None:
        offset["x"] = 0.0
        offset["y"] = 0.0
        zoom["value"] = 1.0
        redraw()

    # Location List using ScrollableFrame
    scroll_view = ScrollableFrame(list_frame, auto_hide=True, min_width=240)
    scroll_view.pack(side="left", fill="both", expand=True)
    inner = scroll_view.inner_frame

    row_entries: list[dict] = []
    selected_location_id: str | None = location["id"] if location else None
    hovered_location_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    def update_row_styles() -> None:
        for entry in row_entries:
            location_id = entry["id"]
            widgets = entry["widgets"]
            if location_id == selected_location_id:
                color = (
                    row_selected_hover_bg
                    if location_id == hovered_location_id
                    else row_selected_bg
                )
            elif location_id == hovered_location_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def select_location(entry: dict) -> None:
        nonlocal selected_location_id
        selected_location_id = entry["id"]
        selected_location["value"] = entry
        hide_info()
        update_row_styles()
        redraw()

    def on_row_enter(location_id: str) -> None:
        nonlocal hovered_location_id
        hovered_location_id = location_id
        update_row_styles()

    def on_row_leave(location_id: str) -> None:
        nonlocal hovered_location_id
        if hovered_location_id == location_id:
            hovered_location_id = None
            update_row_styles()

    for entry in locations:
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

        text_label = tk.Label(row_inner, text=entry["name"], anchor="w", bg=row_bg)
        text_label.pack(side="left", fill="x", expand=True)

        row_widgets: list[tk.Widget] = [row, row_inner, text_label]
        row_entries.append({"id": entry["id"], "widgets": row_widgets})

        def bind_interaction(widget: tk.Widget, location_id: str, current: dict) -> None:
            widget.bind(
                "<Enter>",
                lambda _event, current_id=location_id: on_row_enter(current_id)
            )
            widget.bind(
                "<Leave>",
                lambda _event, current_id=location_id: on_row_leave(current_id)
            )
            widget.bind(
                "<Button-1>",
                lambda _event, selected=current: select_location(selected)
            )

        for widget in row_widgets:
            bind_interaction(widget, entry["id"], entry)

    update_row_styles()
    redraw()
