import tkinter as tk

from .theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)


def create_locations_view(
    parent: tk.Frame,
    locations: list[dict],
    item_names: dict[str, str]
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
        detail_frame, text="Select a location", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw", pady=(10, 0))

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

    row_entries: list[dict] = []
    selected_location_id: str | None = None
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

    def show_location(location: dict) -> None:
        nonlocal selected_location_id
        selected_location_id = location["id"]
        detail_title.config(text=location["name"])
        coords = location.get("coords")
        if coords and "x" in coords and "y" in coords:
            coord_line = f"Coords: {coords['x']:.1f}, {coords['y']:.1f}"
        else:
            coord_line = "Coords: unknown"

        lines = [coord_line, "", "Drops:"]
        loot = location.get("loot", [])
        if loot:
            for entry in loot:
                item_id = entry.get("id", "unknown")
                chance = entry.get("chance", 0)
                name = item_names.get(item_id, item_id)
                lines.append(f"- {name} ({chance}%)")
        else:
            lines.append("- None")

        detail_text.config(text="\n".join(lines))
        update_row_styles()

    def on_row_enter(location_id: str) -> None:
        nonlocal hovered_location_id
        hovered_location_id = location_id
        update_row_styles()

    def on_row_leave(location_id: str) -> None:
        nonlocal hovered_location_id
        if hovered_location_id == location_id:
            hovered_location_id = None
            update_row_styles()

    for location in locations:
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

        text_label = tk.Label(row_inner, text=location["name"], anchor="w", bg=row_bg)
        text_label.pack(side="left", fill="x", expand=True)

        row_widgets: list[tk.Widget] = [row, row_inner, text_label]
        row_entries.append({"id": location["id"], "widgets": row_widgets})

        def bind_interaction(
            widget: tk.Widget,
            location_id: str,
            current: dict
        ) -> None:
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
                lambda _event, selected=current: show_location(selected)
            )

        for widget in row_widgets:
            bind_interaction(widget, location["id"], location)

    update_row_styles()
