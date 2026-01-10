import tkinter as tk
from typing import Callable
from ..theme import (
    TEXT_COLOR, ACCENT_COLOR, ENTRY_BG, BORDER_COLOR, PANEL_BG,
    TITLE_COLOR, ScrollableFrame, ROW_BG, ROW_BORDER,
    LIST_ROW_PADY, LIST_ROW_INNER_PADX, LIST_ROW_INNER_PADY
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

class StandardLeftList(tk.Frame):
    """
    Standardized left-side list component for Master-Detail views.
    Includes areas for Top (Search/Filters), Center (Scrollable List), and Bottom (Buttons).
    """
    def __init__(self, parent, **kwargs):
        bg = kwargs.pop("bg", parent.cget("bg") if hasattr(parent, "cget") else PANEL_BG)
        super().__init__(parent, bg=bg, **kwargs)
        
        # Top Container (Search, Filters) - Packs to top
        self.top_frame = tk.Frame(self, bg=bg)
        self.top_frame.pack(side="top", fill="x", pady=(0, 10))
        
        # Bottom Container (Buttons) - Packs to bottom
        self.bottom_frame = tk.Frame(self, bg=bg)
        self.bottom_frame.pack(side="bottom", fill="x", pady=(10, 0))
        
        # Scrollable List - Packs to remaining space
        self.scroll_frame = ScrollableFrame(self, auto_hide=True, min_width=260, bg=bg)
        self.scroll_frame.pack(side="top", fill="both", expand=True)
        self.inner = self.scroll_frame.inner_frame

    def create_row_frame(self, bg=ROW_BG, border=ROW_BORDER):
        """Creates a standard row frame with outer spacing and inner padding container."""
        row = tk.Frame(
            self.inner, 
            bg=bg, 
            highlightthickness=1, 
            highlightbackground=border, 
            highlightcolor=border
        )
        row.pack(fill="x", pady=LIST_ROW_PADY)
        
        row_inner = tk.Frame(row, bg=bg)
        row_inner.pack(fill="x", padx=LIST_ROW_INNER_PADX, pady=LIST_ROW_INNER_PADY)
        
        return row, row_inner
