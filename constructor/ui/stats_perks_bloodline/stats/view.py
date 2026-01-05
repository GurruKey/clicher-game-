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


def create_stats_info_view(parent: tk.Frame, stats: list[dict]) -> None:
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
        detail_frame, text="Select a stat", font=("Segoe UI", 12, "bold")
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
    selected_stat_id: str | None = None
    hovered_stat_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    def update_row_styles() -> None:
        for entry in row_entries:
            stat_id = entry["id"]
            widgets = entry["widgets"]
            if stat_id == selected_stat_id:
                color = (
                    row_selected_hover_bg
                    if stat_id == hovered_stat_id
                    else row_selected_bg
                )
            elif stat_id == hovered_stat_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def show_stat(stat: dict) -> None:
        sources = stat.get("sources") or []
        effects = stat.get("effects") or ["No direct effects yet."]
        detail_lines = [
            f"ID: {stat['id']}",
            f"Label: {stat['label']}",
            "",
            "Sources:",
            *([f"- {source}" for source in sources] or ["- None"]),
            "",
            "Effects:",
            *[f"- {effect}" for effect in effects]
        ]
        detail_title.config(text=stat["label"])
        detail_text.config(text="\n".join(detail_lines))

    def select_stat(stat: dict) -> None:
        nonlocal selected_stat_id
        selected_stat_id = stat["id"]
        show_stat(stat)
        update_row_styles()

    def on_row_enter(stat_id: str) -> None:
        nonlocal hovered_stat_id
        hovered_stat_id = stat_id
        update_row_styles()

    def on_row_leave(stat_id: str) -> None:
        nonlocal hovered_stat_id
        if hovered_stat_id == stat_id:
            hovered_stat_id = None
            update_row_styles()

    stats_sorted = sorted(stats, key=lambda item: item["label"].lower())
    search_index = []
    for stat in stats_sorted:
        blob = " ".join([stat["id"], stat["label"]]).lower()
        search_index.append((stat, blob))

    def render_list(filtered: list[dict]) -> None:
        for child in inner.winfo_children():
            child.destroy()
        row_entries.clear()

        for stat in filtered:
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
                row_inner, text=stat["label"], anchor="w", bg=row_bg
            )
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            row_entries.append({"id": stat["id"], "widgets": row_widgets})

            def bind_interaction(widget: tk.Widget, stat_id: str, current: dict) -> None:
                widget.bind(
                    "<Enter>",
                    lambda _event, current_id=stat_id: on_row_enter(current_id)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, current_id=stat_id: on_row_leave(current_id)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current: select_stat(selected)
                )

            for widget in row_widgets:
                bind_interaction(widget, stat["id"], stat)

        update_row_styles()

    def on_filter_change(*_args: object) -> None:
        query = search_var.get().strip().lower()
        filtered = [
            stat
            for stat, blob in search_index
            if not query or query in blob
        ]
        render_list(filtered)

    search_entry.bind("<KeyRelease>", on_filter_change)

    render_list([stat for stat, _ in search_index])
