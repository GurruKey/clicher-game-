from __future__ import annotations

import tkinter as tk

from ...theme import (
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)

from constants import SLOT_BG, SLOT_BORDER
from ..common import build_layer


class AvatarListPanel:
    def __init__(
        self,
        parent: tk.Frame,
        avatars: list[dict],
        on_select
    ) -> None:
        self._parent = parent
        self._avatars = avatars
        self._on_select = on_select
        self._selected_id: str | None = None
        self._hovered_id: str | None = None

        self._view_images: list[tk.PhotoImage] = []
        self._row_entries: list[dict] = []
        self._image_cache: dict[tuple, tk.PhotoImage] = {}
        self._source_cache: dict[str, tk.PhotoImage] = {}
        self._scaled_cache: dict[tuple, tk.PhotoImage] = {}

        self._row_bg = ROW_BG
        self._row_hover_bg = ROW_HOVER_BG
        self._row_selected_bg = ROW_SELECTED_BG
        self._row_selected_hover_bg = ROW_SELECTED_HOVER_BG
        self._row_border = ROW_BORDER

        search_row = tk.Frame(parent)
        search_row.pack(fill="x", pady=(0, 8))
        tk.Label(search_row, text="Search").pack(side="left")
        self._search_var = tk.StringVar()
        search_entry = tk.Entry(search_row, textvariable=self._search_var, width=22)
        search_entry.pack(side="left", padx=(8, 0))

        canvas = tk.Canvas(parent, width=260, highlightthickness=0)
        scrollbar = create_scrollbar(parent, orient="vertical", command=canvas.yview)
        inner = tk.Frame(canvas)
        canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        def on_configure(_event) -> None:
            canvas.configure(scrollregion=canvas.bbox("all"))

        inner.bind("<Configure>", on_configure)

        canvas.pack(side="left", fill="y", expand=False)
        scrollbar.pack(side="right", fill="y")

        self._canvas = canvas
        self._inner = inner

        self._search_index = self._build_search_index()
        self._render_list([avatar for avatar, _blob in self._search_index])
        search_entry.bind("<KeyRelease>", self._on_filter_change)

    def set_selected(self, avatar_id: str | None) -> None:
        self._selected_id = avatar_id
        self._update_row_styles()

    def _build_search_index(self) -> list[tuple[dict, str]]:
        search_index = []
        for avatar in self._avatars:
            blob = " ".join(
                [
                    avatar["id"],
                    avatar["name"],
                    avatar["race"],
                    str(avatar["raceLevel"]),
                    avatar["subrace"],
                    str(avatar["subraceLevel"]),
                    avatar["gender"],
                    avatar["origin"],
                    str(avatar["originLevel"]),
                    avatar["faction"],
                    str(avatar["factionLevel"]),
                    avatar["subfaction"],
                    str(avatar["subfactionLevel"]),
                    avatar["factionSubtype"],
                    str(avatar["factionSubtypeLevel"])
                ]
            ).lower()
            search_index.append((avatar, blob))
        return search_index

    def _update_row_styles(self) -> None:
        for entry in self._row_entries:
            avatar_id = entry["id"]
            widgets = entry["widgets"]
            if avatar_id == self._selected_id:
                color = (
                    self._row_selected_hover_bg
                    if avatar_id == self._hovered_id
                    else self._row_selected_bg
                )
            elif avatar_id == self._hovered_id:
                color = self._row_hover_bg
            else:
                color = self._row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def _select_avatar(self, avatar: dict) -> None:
        self._selected_id = avatar["id"]
        self._update_row_styles()
        if self._on_select:
            self._on_select(avatar)

    def _on_row_enter(self, avatar_id: str) -> None:
        self._hovered_id = avatar_id
        self._update_row_styles()

    def _on_row_leave(self, avatar_id: str) -> None:
        if self._hovered_id == avatar_id:
            self._hovered_id = None
            self._update_row_styles()

    def _render_list(self, filtered: list[dict]) -> None:
        for child in self._inner.winfo_children():
            child.destroy()
        self._view_images.clear()
        self._row_entries.clear()

        for avatar in filtered:
            row = tk.Frame(
                self._inner,
                bg=self._row_bg,
                highlightthickness=1,
                highlightbackground=self._row_border,
                highlightcolor=self._row_border
            )
            row.pack(fill="x", pady=5)

            row_inner = tk.Frame(row, bg=self._row_bg)
            row_inner.pack(fill="x", padx=8, pady=6)

            row_widgets: list[tk.Widget] = [row, row_inner]

            icon_canvas = tk.Canvas(
                row_inner,
                width=44,
                height=44,
                highlightthickness=0,
                bg=self._row_bg
            )
            icon_canvas.pack(side="left", padx=(0, 10))
            icon_canvas.create_oval(2, 2, 42, 42, fill=SLOT_BG, outline="")

            bg_image = build_layer(
                avatar.get("bg"),
                44,
                float(avatar.get("bgScale", 1)),
                avatar.get("bgOffset"),
                self._image_cache,
                self._source_cache,
                self._scaled_cache
            )
            icon_image = build_layer(
                avatar.get("icon"),
                44,
                float(avatar.get("iconScale", 1)),
                avatar.get("iconOffset"),
                self._image_cache,
                self._source_cache,
                self._scaled_cache
            )
            if bg_image:
                icon_canvas.create_image(22, 22, image=bg_image)
                self._view_images.append(bg_image)
            if icon_image:
                icon_canvas.create_image(22, 22, image=icon_image)
                self._view_images.append(icon_image)
            icon_canvas.create_oval(
                2,
                2,
                42,
                42,
                fill="",
                outline=SLOT_BORDER,
                width=2
            )

            row_widgets.append(icon_canvas)

            text_label = tk.Label(
                row_inner,
                text=avatar["name"],
                anchor="w",
                bg=self._row_bg
            )
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            self._row_entries.append({"id": avatar["id"], "widgets": row_widgets})

            def bind_interaction(
                widget: tk.Widget,
                avatar_id: str,
                current: dict
            ) -> None:
                widget.bind(
                    "<Enter>",
                    lambda _event, current_id=avatar_id: self._on_row_enter(current_id)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, current_id=avatar_id: self._on_row_leave(current_id)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current: self._select_avatar(selected)
                )

            for widget in row_widgets:
                bind_interaction(widget, avatar["id"], avatar)

        self._parent.images = self._view_images
        self._update_row_styles()

    def _on_filter_change(self, *_args: object) -> None:
        query = self._search_var.get().strip().lower()
        filtered = [
            avatar
            for avatar, blob in self._search_index
            if not query or query in blob
        ]
        self._render_list(filtered)
