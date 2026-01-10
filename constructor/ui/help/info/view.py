import tkinter as tk

from ...theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    ScrollableFrame,
    ModernPanedWindow
)
from ...common import StandardLeftList


def create_help_view(parent: tk.Frame, paths: list[dict]) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    # UPDATED: Use ModernPanedWindow
    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    list_view = StandardLeftList(paned)
    paned.add(list_view, minsize=280)

    detail_frame = tk.Frame(paned)
    paned.add(detail_frame, minsize=400)

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

    # Help Sections List using ScrollableFrame
    inner = list_view.inner

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
        row, row_inner = list_view.create_row_frame(bg=row_bg, border=row_border)
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
