import tkinter as tk
from typing import Callable
from ....theme import ModernButton, BUTTON_BG
from ....common import StandardLeftList

def create_list_panel(
    parent: tk.Frame,
    on_select: Callable[[dict | None], None],
    on_create_edit: Callable[[], None],
    on_exit: Callable[[], None]
) -> dict:
    list_view = StandardLeftList(parent)
    list_view.pack(fill="both", expand=True)

    # Search row
    search_row = tk.Frame(list_view.top_frame)
    search_row.pack(fill="x", pady=(0, 8))

    tk.Label(search_row, text="Search").pack(side="left")
    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

    # Actions
    btn_create_edit = ModernButton(list_view.bottom_frame, text="Create/Edit", bg=BUTTON_BG, fg="#b8f5b8", command=on_create_edit)
    btn_create_edit.pack(side="left", fill="x", expand=True, padx=(0, 5))

    btn_exit = ModernButton(list_view.bottom_frame, text="Exit", state="disabled", command=on_exit)
    btn_exit.pack(side="left", fill="x", expand=True, padx=(5, 0))

    return {
        "search_var": search_var,
        "search_entry": search_entry,
        "canvas": list_view.scroll_frame.canvas,
        "inner": list_view.inner,
        "btn_create_edit": btn_create_edit,
        "btn_exit": btn_exit,
        "list_view": list_view
    }
