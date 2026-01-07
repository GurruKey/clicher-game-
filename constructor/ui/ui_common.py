import tkinter as tk
from typing import Callable
from .theme import (
    TEXT_COLOR, ACCENT_COLOR, ENTRY_BG, BORDER_COLOR, PANEL_BG,
    TITLE_COLOR, ScrollableFrame
)

def draw_rounded_rect(
    canvas: tk.Canvas,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    radius: int,
    fill: str,
    outline: str
) -> None:
    points = [
        x1 + radius, y1, x2 - radius, y1, x2, y1, x2, y1 + radius,
        x2, y2 - radius, x2, y2, x2 - radius, y2, x1 + radius, y2,
        x1, y2, x1, y2 - radius, x1, y1 + radius, x1, y1
    ]
    canvas.create_polygon(points, smooth=True, fill=fill, outline=outline)

def create_header(parent: tk.Widget, text: str) -> None:
    header_frame = tk.Frame(parent, bg=PANEL_BG)
    header_frame.pack(fill="x", padx=10, pady=(10, 5))
    tk.Label(header_frame, text=text, font=("Segoe UI", 12, "bold"), bg=PANEL_BG, fg=TITLE_COLOR).pack(side="left")

def create_scrollable_list(parent: tk.Widget) -> tuple[tk.Frame, tk.Frame]:
    """
    Creates a frame containing a canvas and scrollbar for scrolling content.
    Returns (container_frame, scrollable_inner_frame).
    Now uses ScrollableFrame component.
    """
    scroll_view = ScrollableFrame(parent, auto_hide=True, bg=PANEL_BG)
    scroll_view.pack(fill="both", expand=True)
    # Return the ScrollableFrame object as 'container' (it is a Frame) and its inner_frame
    return scroll_view, scroll_view.inner_frame

def create_search_bar(parent: tk.Widget, callback: Callable[[str], None]) -> None:
    search_var = tk.StringVar()
    def on_key_release(*args): callback(search_var.get())
    entry = tk.Entry(parent, textvariable=search_var, bg=ENTRY_BG, fg=TEXT_COLOR, insertbackground=TEXT_COLOR, relief="flat", highlightthickness=1, highlightbackground=BORDER_COLOR, highlightcolor=ACCENT_COLOR)
    entry.pack(fill="x", ipady=4)
    entry.bind("<KeyRelease>", on_key_release)
