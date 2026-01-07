import tkinter as tk
import tkinter.font as tkfont
import tkinter.ttk as ttk

BG_COLOR = "#101010"
PANEL_BG = "#171717"
PANEL_BG_ALT = "#1d1d1d"
BORDER_COLOR = "#2a2a2a"
DIVIDER_COLOR = "#2a2a2a"
TEXT_COLOR = "#e6e6e6"
TEXT_MUTED = "#a0a0a0"
TITLE_COLOR = "#ffffff"  # Added TITLE_COLOR
ACCENT_COLOR = "#caa830"

BUTTON_BG = "#1b1b1b"
BUTTON_ACTIVE_BG = "#2b2b2b"
BUTTON_HOVER_BG = "#242424"
BUTTON_ACTIVE_FG = ACCENT_COLOR
MODE_ACTIVE_BG = "#1f3b1f"
MODE_ACTIVE_FG = "#b8f5b8"

ENTRY_BG = "#151515"
LIST_BG = "#191919"
SELECT_BG = "#303030"

ROW_BG = "#1a1a1a"
ROW_HOVER_BG = "#262626"
ROW_SELECTED_BG = "#3a3a3a"
ROW_SELECTED_HOVER_BG = "#444444"
ROW_BORDER = "#2f2f2f"

SCROLLBAR_BG = "#2a2a2a"
SCROLLBAR_ACTIVE_BG = "#3a3a3a"
SCROLLBAR_TROUGH = "#151515"


def apply_dark_theme(root) -> None:
    try:
        style = ttk.Style(root)
        try:
            style.theme_use("clam")
        except tkfont.TclError:
            pass
        style.configure(
            "Dark.Vertical.TScrollbar",
            background=SCROLLBAR_BG,
            troughcolor=SCROLLBAR_TROUGH,
            bordercolor=BORDER_COLOR,
            lightcolor=SCROLLBAR_BG,
            darkcolor=SCROLLBAR_BG,
            arrowcolor=TEXT_COLOR,
            relief="flat",
            borderwidth=0,
            width=12
        )
        style.map(
            "Dark.Vertical.TScrollbar",
            background=[("active", SCROLLBAR_ACTIVE_BG)]
        )
        style.configure(
            "Dark.Horizontal.TScrollbar",
            background=SCROLLBAR_BG,
            troughcolor=SCROLLBAR_TROUGH,
            bordercolor=BORDER_COLOR,
            lightcolor=SCROLLBAR_BG,
            darkcolor=SCROLLBAR_BG,
            arrowcolor=TEXT_COLOR,
            relief="flat",
            borderwidth=0,
            width=12
        )
        style.map(
            "Dark.Horizontal.TScrollbar",
            background=[("active", SCROLLBAR_ACTIVE_BG)]
        )
    except tkfont.TclError:
        pass
    try:
        default_font = tkfont.nametofont("TkDefaultFont")
        default_font.configure(family="Segoe UI", size=9)
        root.option_add("*Font", str(default_font))
        for font_name in ("TkTextFont", "TkHeadingFont", "TkMenuFont"):
            tkfont.nametofont(font_name).configure(family="Segoe UI", size=9)
    except tkfont.TclError:
        pass

    root.configure(bg=BG_COLOR)
    root.option_add("*Background", BG_COLOR)
    root.option_add("*Foreground", TEXT_COLOR)

    root.option_add("*Frame.Background", BG_COLOR)
    root.option_add("*Label.Background", BG_COLOR)
    root.option_add("*Label.Foreground", TEXT_COLOR)
    root.option_add("*LabelFrame.Background", BG_COLOR)
    root.option_add("*LabelFrame.Foreground", TEXT_COLOR)
    root.option_add("*LabelFrame.Label.Background", BG_COLOR)
    root.option_add("*LabelFrame.Label.Foreground", TEXT_COLOR)

    root.option_add("*Button.Background", BUTTON_BG)
    root.option_add("*Button.Foreground", TEXT_COLOR)
    root.option_add("*Button.ActiveBackground", BUTTON_ACTIVE_BG)
    root.option_add("*Button.ActiveForeground", TEXT_COLOR)
    root.option_add("*Button.DisabledForeground", TEXT_MUTED)
    root.option_add("*Button.Relief", "raised")
    root.option_add("*Button.BorderWidth", 1)
    root.option_add("*Button.HighlightThickness", 1)
    root.option_add("*Button.HighlightBackground", BORDER_COLOR)
    root.option_add("*Button.HighlightColor", ACCENT_COLOR)

    root.option_add("*Menubutton.Background", BUTTON_BG)
    root.option_add("*Menubutton.Foreground", TEXT_COLOR)
    root.option_add("*Menu.Background", PANEL_BG)
    root.option_add("*Menu.Foreground", TEXT_COLOR)
    root.option_add("*Menu.ActiveBackground", BUTTON_ACTIVE_BG)
    root.option_add("*Menu.ActiveForeground", TEXT_COLOR)

    root.option_add("*Entry.Background", ENTRY_BG)
    root.option_add("*Entry.Foreground", TEXT_COLOR)
    root.option_add("*Entry.InsertBackground", TEXT_COLOR)
    root.option_add("*Entry.DisabledBackground", PANEL_BG)
    root.option_add("*Entry.DisabledForeground", TEXT_MUTED)
    root.option_add("*Entry.Relief", "solid")
    root.option_add("*Entry.BorderWidth", 1)
    root.option_add("*Entry.HighlightThickness", 1)
    root.option_add("*Entry.HighlightBackground", BORDER_COLOR)
    root.option_add("*Entry.HighlightColor", ACCENT_COLOR)

    root.option_add("*Spinbox.Background", ENTRY_BG)
    root.option_add("*Spinbox.Foreground", TEXT_COLOR)
    root.option_add("*Spinbox.InsertBackground", TEXT_COLOR)
    root.option_add("*Spinbox.Relief", "solid")
    root.option_add("*Spinbox.BorderWidth", 1)

    root.option_add("*Listbox.Background", LIST_BG)
    root.option_add("*Listbox.Foreground", TEXT_COLOR)
    root.option_add("*Listbox.SelectBackground", SELECT_BG)
    root.option_add("*Listbox.SelectForeground", TEXT_COLOR)
    root.option_add("*Listbox.Relief", "solid")
    root.option_add("*Listbox.BorderWidth", 1)
    root.option_add("*Listbox.HighlightThickness", 1)
    root.option_add("*Listbox.HighlightBackground", BORDER_COLOR)

    root.option_add("*Scrollbar.Background", PANEL_BG)
    root.option_add("*Scrollbar.TroughColor", BG_COLOR)
    root.option_add("*Scrollbar.ActiveBackground", SCROLLBAR_ACTIVE_BG)
    root.option_add("*Scrollbar.HighlightBackground", BORDER_COLOR)
    root.option_add("*Scrollbar.Relief", "flat")
    root.option_add("*Scrollbar.BorderWidth", 0)

    root.option_add("*Canvas.Background", BG_COLOR)
    root.option_add("*Canvas.HighlightThickness", 1)
    root.option_add("*Canvas.HighlightBackground", BORDER_COLOR)

    root.option_add("*Scale.Background", BG_COLOR)
    root.option_add("*Scale.Foreground", TEXT_COLOR)
    root.option_add("*Scale.TroughColor", PANEL_BG)

    root.option_add("*Text.Background", PANEL_BG)
    root.option_add("*Text.Foreground", TEXT_COLOR)
    root.option_add("*Text.InsertBackground", TEXT_COLOR)

    root.option_add("*Checkbutton.Background", BG_COLOR)
    root.option_add("*Checkbutton.Foreground", TEXT_COLOR)
    root.option_add("*Checkbutton.ActiveBackground", BG_COLOR)
    root.option_add("*Checkbutton.ActiveForeground", TEXT_COLOR)
    root.option_add("*Checkbutton.SelectColor", ACCENT_COLOR)

    root.option_add("*Panedwindow.Background", BG_COLOR)
    root.option_add("*Toplevel.Background", BG_COLOR)


def create_scrollbar(parent, orient: str, command):
    style = "Dark.Vertical.TScrollbar" if orient == "vertical" else "Dark.Horizontal.TScrollbar"
    return ttk.Scrollbar(
        parent,
        orient=orient,
        command=command,
        style=style,
        takefocus=0
    )


class ScrollableFrame(tk.Frame):
    def __init__(self, parent, auto_hide=True, min_width=260, **kwargs):
        # We need a background color for the container frame too
        bg = kwargs.get("bg", parent.cget("bg") if hasattr(parent, "cget") else BG_COLOR)
        super().__init__(parent, bg=bg, **kwargs)
        
        self.auto_hide = auto_hide
        self.min_width = min_width
        
        self.canvas = tk.Canvas(self, highlightthickness=0, bg=bg)
        self.scrollbar = create_scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.inner_frame = tk.Frame(self.canvas, bg=bg)
        
        self.window_id = self.canvas.create_window((0, 0), window=self.inner_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.inner_frame.bind("<Configure>", self._on_frame_configure)
        self.canvas.bind("<Configure>", self._on_canvas_configure)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        # Scrollbar will be packed by _update_scroll_region if needed or if auto_hide is False

    def _on_frame_configure(self, event=None):
        self._update_scroll_region()

    def _on_canvas_configure(self, event=None):
        self._sync_width()
        self._update_scroll_region()

    def _sync_width(self):
        # We don't want to sync width if it's during pre-layout (width=1)
        # but the check_scroll logic in the original files handles this.
        # Actually, setting it here is safe because it will be called again on proper layout.
        width = max(self.canvas.winfo_width(), self.min_width)
        self.canvas.itemconfig(self.window_id, width=width)

    def _update_scroll_region(self, event=None):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        if self.auto_hide:
            bbox = self.canvas.bbox("all")
            if not bbox: return
            content_height = bbox[3] - bbox[1]
            visible_height = self.canvas.winfo_height()
            
            if visible_height > 1 and content_height > visible_height:
                self.scrollbar.pack(side="right", fill="y")
            else:
                self.scrollbar.pack_forget()
        else:
            self.scrollbar.pack(side="right", fill="y")
