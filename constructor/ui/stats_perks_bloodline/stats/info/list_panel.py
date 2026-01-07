import tkinter as tk
from typing import Callable
from ....theme import ScrollableFrame, ModernButton, BUTTON_BG

def create_list_panel(
    parent: tk.Frame,
    on_select: Callable[[dict | None], None],
    on_create_edit: Callable[[], None],
    on_exit: Callable[[], None]
) -> dict:
    # Search row
    search_row = tk.Frame(parent)
    search_row.pack(side="top", fill="x", pady=(0, 8))

    tk.Label(search_row, text="Search").pack(side="left")
    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

    # List container using ScrollableFrame
    scroll_view = ScrollableFrame(parent, auto_hide=True, min_width=260)
    scroll_view.pack(side="top", fill="both", expand=True)

    # Actions
    actions_frame = tk.Frame(parent)
    actions_frame.pack(side="bottom", fill="x", pady=(10, 0))

    btn_create_edit = ModernButton(actions_frame, text="Create/Edit", bg=BUTTON_BG, fg="#b8f5b8", command=on_create_edit)
    btn_create_edit.pack(side="left", fill="x", expand=True, padx=(0, 5))

    btn_exit = ModernButton(actions_frame, text="Exit", state="disabled", command=on_exit)
    btn_exit.pack(side="left", fill="x", expand=True, padx=(5, 0))

    return {
        "search_var": search_var,
        "search_entry": search_entry,
        "canvas": scroll_view.canvas,
        "inner": scroll_view.inner_frame,
        "btn_create_edit": btn_create_edit,
        "btn_exit": btn_exit
    }
