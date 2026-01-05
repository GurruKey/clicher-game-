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


def create_help_view(parent: tk.Frame, paths: list[dict]) -> None:
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
        detail_frame, text="Select a section", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    detail_info = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_info.pack(anchor="nw", pady=(12, 6))

    sources_title = tk.Label(detail_frame, text="Sources:")
    sources_title.pack(anchor="nw")

    sources_frame = tk.Frame(detail_frame)
    sources_frame.pack(anchor="nw", pady=(4, 0))

    toast_label = tk.Label(detail_frame, text="", fg="#2f4f9f")
    toast_label.pack(anchor="se", pady=(12, 0))
    toast_label.pack_forget()

    def show_toast(message: str) -> None:
        toast_label.config(text=message)
        toast_label.pack(anchor="se", pady=(12, 0))
        parent.after(1000, toast_label.pack_forget)

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

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    selected_id: str | None = None
    hovered_id: str | None = None
    row_entries: list[dict] = []

    def update_row_styles() -> None:
        for entry in row_entries:
            item_id = entry["id"]
            widgets = entry["widgets"]
            if item_id == selected_id:
                color = (
                    row_selected_hover_bg
                    if item_id == hovered_id
                    else row_selected_bg
                )
            elif item_id == hovered_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def show_item(item: dict) -> None:
        detail_title.config(text=item["title"])
        detail_info.config(text=f"ID: {item['id']}")
        for child in sources_frame.winfo_children():
            child.destroy()
        sources = item.get("sources") or []
        if not sources:
            empty_label = tk.Label(sources_frame, text="- None")
            empty_label.pack(anchor="nw")
            return
        root = parent.winfo_toplevel()
        for source in sources:
            label = tk.Label(
                sources_frame,
                text=f"- {source}",
                fg="#2f4f9f",
                cursor="hand2"
            )
            label.pack(anchor="nw")

            def handle_copy(_event, value=source) -> None:
                root.clipboard_clear()
                root.clipboard_append(value)
                show_toast("Copied")

            label.bind("<Button-1>", handle_copy)

    def select_item(item: dict) -> None:
        nonlocal selected_id
        selected_id = item["id"]
        show_item(item)
        update_row_styles()

    def on_row_enter(item_id: str) -> None:
        nonlocal hovered_id
        hovered_id = item_id
        update_row_styles()

    def on_row_leave(item_id: str) -> None:
        nonlocal hovered_id
        if hovered_id == item_id:
            hovered_id = None
            update_row_styles()

    for item in paths:
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
            row_inner, text=item["title"], anchor="w", bg=row_bg
        )
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

    update_row_styles()

    if paths:
        select_item(paths[0])
