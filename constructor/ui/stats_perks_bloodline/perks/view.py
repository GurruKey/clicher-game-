import tkinter as tk

from ...theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)


def create_perks_info_view(
    parent: tk.Frame,
    perks: list[dict],
    stats: list[dict]
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
        detail_frame, text="Select a perk", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw", pady=(12, 0))

    search_row = tk.Frame(list_frame)
    search_row.pack(fill="x", pady=(0, 8))

    search_label = tk.Label(search_row, text="Search")
    search_label.pack(side="left")

    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

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
    selected_perk_id: str | None = None
    hovered_perk_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    stat_labels = {stat["id"]: stat["label"] for stat in stats}

    def update_row_styles() -> None:
        for entry in row_entries:
            perk_id = entry["id"]
            widgets = entry["widgets"]
            if perk_id == selected_perk_id:
                color = (
                    row_selected_hover_bg
                    if perk_id == hovered_perk_id
                    else row_selected_bg
                )
            elif perk_id == hovered_perk_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def format_value(value: float | int) -> str:
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)

    def show_perk(perk: dict) -> None:
        detail_title.config(text=perk["name"])
        detail = [
            f"ID: {perk['id']}",
            f"Name: {perk['name']}",
            "",
            "Stats:"
        ]
        stats_map = perk.get("stats", {})
        if stats_map:
            for key, value in sorted(stats_map.items()):
                label = stat_labels.get(key, key)
                detail.append(f"- {label} ({key}): {format_value(value)}")
        else:
            detail.append("- None")
        detail_text.config(text="\n".join(detail))

    def select_perk(perk: dict) -> None:
        nonlocal selected_perk_id
        selected_perk_id = perk["id"]
        show_perk(perk)
        update_row_styles()

    def on_row_enter(perk_id: str) -> None:
        nonlocal hovered_perk_id
        hovered_perk_id = perk_id
        update_row_styles()

    def on_row_leave(perk_id: str) -> None:
        nonlocal hovered_perk_id
        if hovered_perk_id == perk_id:
            hovered_perk_id = None
            update_row_styles()

    perks_sorted = sorted(perks, key=lambda item: item["name"].lower())
    search_index = []
    for perk in perks_sorted:
        stats_blob = " ".join(perk.get("stats", {}).keys())
        blob = " ".join([perk["id"], perk["name"], stats_blob]).lower()
        search_index.append((perk, blob))

    def render_list(filtered: list[dict]) -> None:
        for child in inner.winfo_children():
            child.destroy()
        row_entries.clear()

        for perk in filtered:
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

            text_label = tk.Label(
                row_inner, text=perk["name"], anchor="w", bg=row_bg
            )
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            row_entries.append({"id": perk["id"], "widgets": row_widgets})

            def bind_interaction(widget: tk.Widget, perk_id: str, current: dict) -> None:
                widget.bind(
                    "<Enter>",
                    lambda _event, current_id=perk_id: on_row_enter(current_id)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, current_id=perk_id: on_row_leave(current_id)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current: select_perk(selected)
                )

            for widget in row_widgets:
                bind_interaction(widget, perk["id"], perk)

        update_row_styles()

    def on_filter_change(*_args: object) -> None:
        query = search_var.get().strip().lower()
        filtered = [
            perk
            for perk, blob in search_index
            if not query or query in blob
        ]
        render_list(filtered)

    search_entry.bind("<KeyRelease>", on_filter_change)

    render_list([perk for perk, _ in search_index])
