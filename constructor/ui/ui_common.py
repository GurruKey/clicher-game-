import tkinter as tk
from tkinter import ttk
from typing import Callable
from .theme import (
    TEXT_COLOR, ACCENT_COLOR, ENTRY_BG, BORDER_COLOR, PANEL_BG,
    create_scrollbar, TITLE_COLOR
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
        x1 + radius,
        y1,
        x2 - radius,
        y1,
        x2,
        y1,
        x2,
        y1 + radius,
        x2,
        y2 - radius,
        x2,
        y2,
        x2 - radius,
        y2,
        x1 + radius,
        y2,
        x1,
        y2,
        x1,
        y2 - radius,
        x1,
        y1 + radius,
        x1,
        y1
    ]
    canvas.create_polygon(points, smooth=True, fill=fill, outline=outline)


def create_header(parent: tk.Widget, text: str) -> None:
    """Creates a standardized header label."""
    header_frame = tk.Frame(parent, bg=PANEL_BG)
    header_frame.pack(fill="x", padx=10, pady=(10, 5))
    
    label = tk.Label(
        header_frame,
        text=text,
        font=("Segoe UI", 12, "bold"),
        bg=PANEL_BG,
        fg=TITLE_COLOR
    )
    label.pack(side="left")


def create_scrollable_list(parent: tk.Widget) -> tuple[tk.Frame, tk.Frame]:
    """
    Creates a frame containing a canvas and scrollbar for scrolling content.
    Returns (container_frame, scrollable_inner_frame).
    """
    container = tk.Frame(parent, bg=PANEL_BG)
    container.pack(fill="both", expand=True)

    canvas = tk.Canvas(container, bg=PANEL_BG, highlightthickness=0)
    scrollbar = create_scrollbar(container, "vertical", canvas.yview)
    
    scrollable_frame = tk.Frame(canvas, bg=PANEL_BG)

    # Window on canvas
    canvas_window = canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
    
    def update_scrollregion(event=None):
        canvas.configure(scrollregion=canvas.bbox("all"))
        
    def check_scrollbar_visibility(event=None):
        # Calculate needed height vs available height
        req_height = scrollable_frame.winfo_reqheight()
        canvas_height = canvas.winfo_height()
        
        # Ignore initial small size
        if canvas_height < 50:
            return

        if req_height > canvas_height:
            if not scrollbar.winfo_ismapped():
                scrollbar.pack(side="right", fill="y")
                # When scrollbar appears, canvas shrinks. We need to update window width if we want full width.
                # But pack geometry manager handles resizing canvas automatically.
                # We just need to ensure the inner window matches the new canvas width.
        else:
            if scrollbar.winfo_ismapped():
                scrollbar.pack_forget()

    def on_canvas_configure(event):
        # Resize inner frame to match canvas width
        # This is critical for the frame to fill the view
        canvas.itemconfig(canvas_window, width=event.width)
        
        # Debounce the visibility check slightly to avoid loops during resize
        canvas.after_idle(check_scrollbar_visibility)
        
    def on_frame_configure(event):
        update_scrollregion()
        # Also check visibility when content changes size
        canvas.after_idle(check_scrollbar_visibility)

    scrollable_frame.bind("<Configure>", on_frame_configure)
    canvas.bind("<Configure>", on_canvas_configure)
    
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill="both", expand=True)
    
    # Mousewheel handling
    def _on_mousewheel(event):
        if scrollbar.winfo_ismapped():
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
            
    # Bind mousewheel only when hovering this list
    def _bind_mousewheel(event):
        # Bind to main window or root to catch all scroll events while hovering
        top = container.winfo_toplevel()
        top.bind("<MouseWheel>", _on_mousewheel, add="+")
        
    def _unbind_mousewheel(event):
        top = container.winfo_toplevel()
        top.unbind("<MouseWheel>") # Warning: this might unbind other scroll listeners if not careful
        # A safer way in complex apps is to bind only to the canvas, but canvas must have focus.
        # Given "bind_all" usage before, binding to toplevel with add="+" is safer than bind_all.
        # But unbind removes all. 
        # Better strategy: bind to canvas, set focus to canvas on enter? No, steals focus.
        # Revert to bind_all for simplicity but manage it carefully.
        canvas.unbind_all("<MouseWheel>")

    def _safe_bind_mousewheel(event):
        canvas.bind_all("<MouseWheel>", _on_mousewheel)

    canvas.bind("<Enter>", _safe_bind_mousewheel)
    canvas.bind("<Leave>", _unbind_mousewheel)
    
    return container, scrollable_frame


def create_search_bar(parent: tk.Widget, callback: Callable[[str], None]) -> None:
    """Creates a search entry that calls callback on key release."""
    search_var = tk.StringVar()
    
    def on_key_release(*args):
        callback(search_var.get())
        
    entry = tk.Entry(
        parent,
        textvariable=search_var,
        bg=ENTRY_BG,
        fg=TEXT_COLOR,
        insertbackground=TEXT_COLOR,
        relief="flat",
        highlightthickness=1,
        highlightbackground=BORDER_COLOR,
        highlightcolor=ACCENT_COLOR
    )
    entry.pack(fill="x", ipady=4)
    entry.bind("<KeyRelease>", on_key_release)
