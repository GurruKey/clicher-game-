import tkinter as tk
from tkinter import ttk

from ....theme import ScrollableFrame, create_scrollbar, ModernButton

from .race_view_editor_ui import build_editor_ui
from .race_view_level_editor_ui import build_level_editor_ui


class RaceViewBase:
    def __init__(
        self,
        parent: tk.Frame,
        races: list[dict],
        race_variants: list[dict],
        race_levels: list[dict] | None = None,
        race_tags: list[dict] | None = None,
        races_root=None,
        race_tags_root=None,
        race_levels_root=None
    ) -> None:
        self.parent = parent
        self.races = list(races)
        self.race_variants = list(race_variants)
        self.race_levels = list(race_levels or [])
        self.race_tags = list(race_tags or [])
        self.races_root = races_root
        self.race_tags_root = race_tags_root
        self.race_levels_root = race_levels_root

        self.editor_active = False
        self.editor_mode = "create"
        
        self.variant_editor_active = False # Flag for variant editor

        self.container = tk.Frame(parent)
        self.container.pack(fill="both", expand=True, padx=12, pady=12)

        self.paned = tk.PanedWindow(
            self.container, orient=tk.HORIZONTAL, sashrelief="raised"
        )
        self.paned.pack(fill="both", expand=True)

        self.race_frame = tk.Frame(self.paned)
        self.level_frame = tk.Frame(self.paned)
        self.variant_frame = tk.Frame(self.paned)
        self.detail_frame = tk.Frame(self.paned)

        self.paned.add(self.race_frame, minsize=220)
        self.paned.add(self.level_frame, minsize=170)
        self.paned.add(self.variant_frame, minsize=220)
        self.paned.add(self.detail_frame, minsize=260)

        # Hidden frames for Level Editor mode
        self.level_create_frame = tk.Frame(self.paned)
        self.level_edit_frame = tk.Frame(self.paned)
        
        # Hidden frames for Variant Editor mode
        self.variant_create_frame = tk.Frame(self.paned)
        self.variant_edit_frame = tk.Frame(self.paned)

        # --- Races Column ---
        self.race_title = tk.Label(
            self.race_frame, text="Races", font=("Segoe UI", 12, "bold")
        )
        self.race_title.pack(anchor="nw")

        self.search_row = tk.Frame(self.race_frame)
        self.search_row.pack(fill="x", pady=(8, 8))

        self.search_label = tk.Label(self.search_row, text="Search")
        self.search_label.pack(side="left")

        self.search_var = tk.StringVar()
        self.search_entry = tk.Entry(
            self.search_row, textvariable=self.search_var, width=22
        )
        self.search_entry.pack(side="left", padx=(8, 0))

        # UPDATED: Race List using ScrollableFrame
        self.race_scroll_view = ScrollableFrame(self.race_frame, auto_hide=True, min_width=220)
        self.race_scroll_view.pack(fill="both", expand=True)
        self.race_canvas = self.race_scroll_view.canvas
        self.race_inner = self.race_scroll_view.inner_frame

        # Actions
        self.action_row = tk.Frame(self.race_frame)
        self.action_row.pack(fill="x", pady=(10, 0))

        self.action_wrap = tk.Frame(self.action_row)
        self.action_wrap.pack(anchor="center")

        self.create_button = ModernButton(
            self.action_wrap, text="Create", command=lambda: None, width=12
        )
        self.create_button.pack(side="left")

        self.edit_button = ModernButton(
            self.action_wrap, text="Edit", command=lambda: None, width=12
        )
        self.edit_button.pack(side="left", padx=(12, 0))

        self.exit_button = ModernButton(
            self.action_wrap, text="Exit", command=lambda: None, width=12
        )
        self.exit_button.pack(side="left", padx=(12, 0))

        # --- Levels Column ---
        self.level_title = tk.Label(
            self.level_frame, text="Levels", font=("Segoe UI", 12, "bold")
        )
        self.level_title.pack(anchor="nw")

        # UPDATED: Level List using ScrollableFrame
        self.level_scroll_view = ScrollableFrame(self.level_frame, auto_hide=True, min_width=160)
        self.level_scroll_view.pack(fill="both", expand=True, pady=(8, 0))
        self.level_canvas = self.level_scroll_view.canvas
        self.level_inner = self.level_scroll_view.inner_frame

        # --- Variants Column ---
        self.variant_title = tk.Label(
            self.variant_frame, text="Variants", font=("Segoe UI", 12, "bold")
        )
        self.variant_title.pack(anchor="nw")

        # UPDATED: Variant List using ScrollableFrame
        self.variant_scroll_view = ScrollableFrame(self.variant_frame, auto_hide=True, min_width=220)
        self.variant_scroll_view.pack(fill="both", expand=True, pady=(8, 0))
        self.variant_canvas = self.variant_scroll_view.canvas
        self.variant_inner = self.variant_scroll_view.inner_frame
        
        # Variant Actions (New)
        self.variant_action_row = tk.Frame(self.variant_frame)
        self.variant_action_row.pack(side="bottom", fill="x", pady=(10, 0))
        
        self.variant_action_wrap = tk.Frame(self.variant_action_row)
        self.variant_action_wrap.pack(anchor="center")
        
        self.variant_toggle_button = ModernButton(
            self.variant_action_wrap, text="Create/Edit", width=12,
            command=lambda: None
        )
        self.variant_toggle_button.pack(side="left")
        
        self.variant_exit_button = ModernButton(
            self.variant_action_wrap, text="Exit", width=12, state="disabled",
            command=lambda: None
        )
        self.variant_exit_button.pack(side="left", padx=(12, 0))

        # --- Detail Column ---
        self.detail_title = tk.Label(
            self.detail_frame, text="Select a variant", font=("Segoe UI", 12, "bold")
        )
        self.detail_title.pack(anchor="nw")

        self.detail_text = tk.Label(
            self.detail_frame,
            text="",
            justify="left",
            anchor="nw",
            wraplength=320
        )
        self.detail_text.pack(anchor="nw", pady=(12, 0))

        build_editor_ui(self)
        build_level_editor_ui(self)

    def _bind_scroll_region(self, canvas: tk.Canvas, inner: tk.Frame) -> None:
        """Compatibility method for editor UI components."""
        def on_configure(_event):
            canvas.configure(scrollregion=canvas.bbox("all"))
        inner.bind("<Configure>", on_configure)
