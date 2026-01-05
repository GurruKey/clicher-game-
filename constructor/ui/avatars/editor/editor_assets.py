from __future__ import annotations

import os
import shutil
import tkinter as tk
from pathlib import Path

from ...theme import ACCENT_COLOR, BORDER_COLOR, create_scrollbar


class AvatarAssetsPanel:
    def __init__(
        self,
        parent: tk.Frame,
        icon_assets_dir: Path,
        bg_assets_dir: Path,
        preview_panel,
        get_selected_avatar,
        show_status=None,
        on_dirty=None
    ) -> None:
        self._parent = parent
        self._icon_assets_dir = icon_assets_dir
        self._bg_assets_dir = bg_assets_dir
        self._preview_panel = preview_panel
        self._get_selected_avatar = get_selected_avatar
        self._show_status_cb = show_status
        self._on_dirty = on_dirty

        self._used_icon_assets: set[str] = set()
        self._used_bg_assets: set[str] = set()
        self._selected_icon_asset: Path | None = None
        self._selected_bg_asset: Path | None = None
        self._selected_icon_asset_name: str | None = None
        self._selected_bg_asset_name: str | None = None
        self._icon_filter_var = tk.StringVar(value="Unused")
        self._bg_filter_var = tk.StringVar(value="Unused")

        self._icon_asset_images: list[tk.PhotoImage] = []
        self._bg_asset_images: list[tk.PhotoImage] = []

        self._build_assets()

    def set_used_assets(self, avatars: list[dict]) -> None:
        self._used_icon_assets = {
            Path(avatar["icon"]).name
            for avatar in avatars
            if avatar.get("icon") is not None
        }
        self._used_bg_assets = {
            Path(avatar["bg"]).name
            for avatar in avatars
            if avatar.get("bg") is not None
        }

    def update_asset_buttons(self) -> None:
        selected_avatar = self._get_selected_avatar()
        self._icon_save_button.config(
            state="normal"
            if selected_avatar and self._selected_icon_asset
            else "disabled"
        )
        self._bg_save_button.config(
            state="normal"
            if selected_avatar and self._selected_bg_asset
            else "disabled"
        )

    def render_asset_bars(self) -> None:
        self._render_asset_bar("icon")
        self._render_asset_bar("bg")

    def _show_status(self, text: str, duration_ms: int | None = None) -> None:
        if not self._show_status_cb:
            return
        self._show_status_cb(text, duration_ms)

    def _build_assets(self) -> None:
        avatar_assets_frame = tk.LabelFrame(self._parent, text="Avatar Assets")
        avatar_assets_frame.pack(anchor="nw", fill="x", pady=(0, 8))

        bg_assets_frame = tk.LabelFrame(self._parent, text="Background Assets")
        bg_assets_frame.pack(anchor="nw", fill="x")

        (
            self._icon_assets_inner,
            self._icon_assets_canvas,
            self._icon_save_button
        ) = self._build_asset_section(
            avatar_assets_frame,
            self._icon_assets_dir,
            self._icon_filter_var,
            "icon"
        )
        (
            self._bg_assets_inner,
            self._bg_assets_canvas,
            self._bg_save_button
        ) = self._build_asset_section(
            bg_assets_frame,
            self._bg_assets_dir,
            self._bg_filter_var,
            "bg"
        )

        self._icon_filter_var.trace_add("write", lambda *_: self._render_asset_bar("icon"))
        self._bg_filter_var.trace_add("write", lambda *_: self._render_asset_bar("bg"))

    def _build_asset_section(
        self,
        section: tk.LabelFrame,
        asset_dir: Path,
        filter_var: tk.StringVar,
        kind: str
    ):
        filter_row = tk.Frame(section)
        filter_row.pack(anchor="nw", padx=8, pady=(6, 4))
        tk.Label(filter_row, text="Filter").pack(side="left")
        filter_menu = tk.OptionMenu(
            filter_row,
            filter_var,
            "Unused",
            "Used",
            "All"
        )
        filter_menu.config(width=8)
        filter_menu.pack(side="left", padx=(6, 0))
        tk.Button(
            filter_row,
            text="Open Folder",
            command=lambda: self._open_folder(asset_dir)
        ).pack(side="left", padx=(10, 0))

        canvas = tk.Canvas(section, height=72, highlightthickness=0)
        scrollbar = create_scrollbar(
            section,
            orient="horizontal",
            command=canvas.xview
        )
        inner = tk.Frame(canvas)

        def on_configure(_event) -> None:
            canvas.configure(scrollregion=canvas.bbox("all"))

        inner.bind("<Configure>", on_configure)
        canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(xscrollcommand=scrollbar.set)

        canvas.pack(fill="x", padx=8)
        scrollbar.pack(fill="x", padx=8, pady=(0, 6))

        save_asset_button = tk.Button(
            section,
            text="Save Asset",
            command=lambda: self._save_asset(kind),
            state="disabled"
        )
        save_asset_button.pack(anchor="ne", padx=8, pady=(0, 6))

        return inner, canvas, save_asset_button

    def _open_folder(self, folder: Path) -> None:
        try:
            os.startfile(folder)
        except OSError:
            self._show_status("Cannot open folder.", duration_ms=1200)

    def _list_assets(self, asset_dir: Path) -> list[Path]:
        assets: list[Path] = []
        for pattern in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
            assets.extend(asset_dir.glob(pattern))
        return sorted(assets, key=lambda path: path.name.lower())

    def _render_asset_bar(self, kind: str) -> None:
        if kind == "icon":
            inner = self._icon_assets_inner
            asset_dir = self._icon_assets_dir
            used_assets = self._used_icon_assets
            filter_value = self._icon_filter_var.get()
            selected_name = self._selected_icon_asset_name
            assets_images = self._icon_asset_images
        else:
            inner = self._bg_assets_inner
            asset_dir = self._bg_assets_dir
            used_assets = self._used_bg_assets
            filter_value = self._bg_filter_var.get()
            selected_name = self._selected_bg_asset_name
            assets_images = self._bg_asset_images

        for child in inner.winfo_children():
            child.destroy()
        assets_images.clear()

        assets = self._list_assets(asset_dir)
        for asset_path in assets:
            is_used = asset_path.name in used_assets
            if filter_value == "Unused" and is_used:
                continue
            if filter_value == "Used" and not is_used:
                continue
            is_selected = asset_path.name == selected_name
            border_color = ACCENT_COLOR if is_used else BORDER_COLOR
            if is_selected:
                border_color = "#5b7ee6"
            tile = tk.Frame(
                inner,
                highlightthickness=2,
                highlightbackground=border_color
            )
            tile.pack(side="left", padx=4, pady=6)
            try:
                image = tk.PhotoImage(file=str(asset_path))
            except tk.TclError:
                continue
            target = 56
            scale = max(image.width() / target, image.height() / target)
            if scale > 1:
                image = image.subsample(int(scale))
            assets_images.append(image)
            label = tk.Label(tile, image=image)
            label.pack()
            if is_used:
                used_label = tk.Label(tile, text="Used", font=("Segoe UI", 7))
                used_label.pack(pady=(0, 2))

            def handle_select(
                _event,
                selected_path=asset_path,
                selected_kind=kind
            ) -> None:
                if selected_kind == "icon":
                    self._selected_icon_asset = selected_path
                    self._selected_icon_asset_name = selected_path.name
                else:
                    self._selected_bg_asset = selected_path
                    self._selected_bg_asset_name = selected_path.name
                self._apply_asset_preview(selected_kind, selected_path)
                self._render_asset_bar(selected_kind)
                self.update_asset_buttons()

            label.bind("<Button-1>", handle_select)
            tile.bind("<Button-1>", handle_select)

        inner.update_idletasks()

    def _apply_asset_preview(self, kind: str, asset_path: Path) -> None:
        selected_avatar = self._get_selected_avatar()
        if not selected_avatar:
            return
        if kind == "icon":
            selected_avatar["_previewIcon"] = asset_path
        else:
            selected_avatar["_previewBg"] = asset_path
        self._preview_panel.show_avatar(selected_avatar, force=True, fast=False)

    def _save_asset(self, kind: str) -> None:
        selected_avatar = self._get_selected_avatar()
        if not selected_avatar:
            return
        asset_path = self._selected_icon_asset if kind == "icon" else self._selected_bg_asset
        if not asset_path:
            self._show_status("Select an asset first.", duration_ms=1200)
            return
        target_path = selected_avatar.get("icon") if kind == "icon" else selected_avatar.get("bg")
        if not target_path:
            self._show_status("Target file missing.", duration_ms=1200)
            return
        target_path = Path(target_path)
        if not target_path.exists():
            self._show_status("Target file missing.", duration_ms=1200)
            return
        self._show_status("Saving...")

        def finalize() -> None:
            shutil.copyfile(asset_path, target_path)
            self._preview_panel.invalidate_renderer(target_path)
            self._preview_panel.invalidate_layer_cache(target_path)
            if kind == "icon":
                self._used_icon_assets.add(asset_path.name)
                selected_avatar.pop("_previewIcon", None)
                self._icon_asset_images.clear()
            else:
                self._used_bg_assets.add(asset_path.name)
                selected_avatar.pop("_previewBg", None)
                self._bg_asset_images.clear()
            self._preview_panel.clear_preview_cache(selected_avatar["id"])
            self._preview_panel.clear_original_cache(selected_avatar["id"])
            self._preview_panel.show_avatar(selected_avatar, force=True, fast=False)
            if self._on_dirty:
                self._on_dirty()
            self._show_status("Saved", duration_ms=1200)
            self.render_asset_bars()

        self._parent.after(10, finalize)
