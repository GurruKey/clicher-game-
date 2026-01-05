import tkinter as tk

from ...theme import create_scrollbar

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

        self.race_list_container = tk.Frame(self.race_frame)
        self.race_list_container.pack(fill="both", expand=True)

        self.race_canvas = tk.Canvas(
            self.race_list_container, width=220, highlightthickness=0
        )
        self.race_scrollbar = create_scrollbar(
            self.race_list_container,
            orient="vertical",
            command=self.race_canvas.yview
        )
        self.race_inner = tk.Frame(self.race_canvas)
        self._bind_scroll_region(self.race_canvas, self.race_inner)
        self.race_canvas.create_window((0, 0), window=self.race_inner, anchor="nw")
        self.race_canvas.configure(yscrollcommand=self.race_scrollbar.set)
        self.race_canvas.pack(side="left", fill="both", expand=True)
        self.race_scrollbar.pack(side="right", fill="y")

        self.action_row = tk.Frame(self.race_frame)
        self.action_row.pack(fill="x", pady=(10, 0))

        self.action_wrap = tk.Frame(self.action_row)
        self.action_wrap.pack(anchor="center")

        self.create_button = tk.Button(
            self.action_wrap, text="Create", command=lambda: None, width=12, height=2
        )
        self.create_button.pack(side="left")

        self.edit_button = tk.Button(
            self.action_wrap, text="Edit", command=lambda: None, width=12, height=2
        )
        self.edit_button.pack(side="left", padx=(12, 0))

        self.exit_button = tk.Button(
            self.action_wrap, text="Exit", command=lambda: None, width=12, height=2
        )
        self.exit_button.pack(side="left", padx=(12, 0))

        self.level_title = tk.Label(
            self.level_frame, text="Levels", font=("Segoe UI", 12, "bold")
        )
        self.level_title.pack(anchor="nw")

        self.level_canvas = tk.Canvas(
            self.level_frame, width=160, highlightthickness=0
        )
        self.level_scrollbar = create_scrollbar(
            self.level_frame, orient="vertical", command=self.level_canvas.yview
        )
        self.level_inner = tk.Frame(self.level_canvas)
        self._bind_scroll_region(self.level_canvas, self.level_inner)
        self.level_canvas.create_window((0, 0), window=self.level_inner, anchor="nw")
        self.level_canvas.configure(yscrollcommand=self.level_scrollbar.set)
        self.level_canvas.pack(side="left", fill="both", expand=True, pady=(8, 0))
        self.level_scrollbar.pack(side="right", fill="y", pady=(8, 0))

        self.variant_title = tk.Label(
            self.variant_frame, text="Variants", font=("Segoe UI", 12, "bold")
        )
        self.variant_title.pack(anchor="nw")

        self.variant_canvas = tk.Canvas(
            self.variant_frame, width=220, highlightthickness=0
        )
        self.variant_scrollbar = create_scrollbar(
            self.variant_frame, orient="vertical", command=self.variant_canvas.yview
        )
        self.variant_inner = tk.Frame(self.variant_canvas)
        self._bind_scroll_region(self.variant_canvas, self.variant_inner)
        self.variant_canvas.create_window((0, 0), window=self.variant_inner, anchor="nw")
        self.variant_canvas.configure(yscrollcommand=self.variant_scrollbar.set)
        self.variant_canvas.pack(side="left", fill="both", expand=True, pady=(8, 0))
        self.variant_scrollbar.pack(side="right", fill="y", pady=(8, 0))

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
        def on_configure(_event) -> None:
            canvas.configure(scrollregion=canvas.bbox("all"))

        inner.bind("<Configure>", on_configure)
