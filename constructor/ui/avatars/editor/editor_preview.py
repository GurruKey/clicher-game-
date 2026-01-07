from __future__ import annotations

import tkinter as tk

from constants import SLOT_BG, SLOT_BORDER
from ..pil_renderer import AvatarRenderer


class AvatarPreviewPanel:
    def __init__(
        self,
        parent: tk.Frame,
        preview_frame: tk.Frame
    ) -> None:
        self._parent = parent
        self._preview_frame = preview_frame
        self._drag_controller = None  # Will be set later

        self._renderer = AvatarRenderer()
        self._preview_images: list[tk.PhotoImage] = []
        self._preview_cache: dict[str, tk.PhotoImage] = {}
        self._original_preview_cache: dict[str, tk.PhotoImage] = {}
        self._source_cache: dict[str, tk.PhotoImage] = {}
        self._scaled_cache: dict[tuple, tk.PhotoImage] = {}
        self._image_cache: dict[tuple, tk.PhotoImage] = {}

        self._build_preview()

    def set_drag_controller(self, controller) -> None:
        self._drag_controller = controller
        # Re-bind events now that we have the controller
        self._preview_canvas.bind(
            "<ButtonPress-1>",
            lambda event: self._drag_controller.start_drag(event, "icon") if self._drag_controller else None
        )
        self._preview_canvas.bind("<B1-Motion>", lambda event: self._drag_controller.update_drag(event) if self._drag_controller else None)
        self._preview_canvas.bind("<ButtonRelease-1>", lambda event: self._drag_controller.end_drag(event) if self._drag_controller else None)
        self._preview_canvas.bind("<Leave>", lambda event: self._drag_controller.end_drag(event) if self._drag_controller else None)

        self._preview_canvas.bind(
            "<ButtonPress-3>",
            lambda event: self._drag_controller.start_drag(event, "bg") if self._drag_controller else None
        )
        self._preview_canvas.bind("<B3-Motion>", lambda event: self._drag_controller.update_drag(event) if self._drag_controller else None)
        self._preview_canvas.bind("<ButtonRelease-3>", lambda event: self._drag_controller.end_drag(event) if self._drag_controller else None)

    def snapshot_focus(self, avatar: dict) -> dict:
        icon_offset = avatar.get("iconOffset") or {}
        bg_offset = avatar.get("bgOffset") or {}
        return {
            "iconOffset": {
                "x": float(icon_offset.get("x", 0)),
                "y": float(icon_offset.get("y", 0))
            },
            "iconScale": float(avatar.get("iconScale", 1)),
            "bgOffset": {
                "x": float(bg_offset.get("x", 0)),
                "y": float(bg_offset.get("y", 0))
            },
            "bgScale": float(avatar.get("bgScale", 1))
        }

    def invalidate_layer_cache(self, path) -> None:
        key = str(path)
        self._source_cache.pop(key, None)
        for cache_key in list(self._scaled_cache.keys()):
            if cache_key[0] == key:
                self._scaled_cache.pop(cache_key, None)
        for cache_key in list(self._image_cache.keys()):
            if cache_key[0] == key:
                self._image_cache.pop(cache_key, None)

    def invalidate_renderer(self, path) -> None:
        self._renderer.invalidate(path)

    def clear_preview_cache(self, avatar_id: str | None = None) -> None:
        if avatar_id:
            self._preview_cache.pop(avatar_id, None)
        else:
            self._preview_cache.clear()

    def clear_original_cache(self, avatar_id: str | None = None) -> None:
        if avatar_id:
            self._original_preview_cache.pop(avatar_id, None)
        else:
            self._original_preview_cache.clear()

    def initialize_previews(self, avatars: list[dict]) -> None:
        for avatar in avatars:
            if "_savedFocus" not in avatar:
                avatar["_savedFocus"] = self.snapshot_focus(avatar)
            if avatar["id"] not in self._preview_cache:
                self._preview_cache[avatar["id"]] = self._renderer.render(
                    avatar.get("bg"),
                    avatar.get("icon"),
                    160,
                    float(avatar.get("bgScale", 1)),
                    avatar.get("bgOffset"),
                    float(avatar.get("iconScale", 1)),
                    avatar.get("iconOffset"),
                    fast=False
                )
            if avatar["id"] not in self._original_preview_cache:
                saved_focus = avatar.get("_savedFocus") or self.snapshot_focus(avatar)
                self._original_preview_cache[avatar["id"]] = self._renderer.render(
                    avatar.get("bg"),
                    avatar.get("icon"),
                    160,
                    float(saved_focus.get("bgScale", 1)),
                    saved_focus.get("bgOffset"),
                    float(saved_focus.get("iconScale", 1)),
                    saved_focus.get("iconOffset"),
                    fast=False
                )

    def show_avatar(self, avatar: dict | None, force: bool = False, fast: bool = False) -> None:
        if not avatar:
            self._render_preview(self._preview_canvas, None)
            self._render_preview(self._original_canvas, None)
            return

        cached = self._preview_cache.get(avatar["id"])
        preview_override = avatar.get("_previewBg") or avatar.get("_previewIcon")
        if cached and not force and not fast and not preview_override:
            preview_image = cached
        else:
            bg_path = avatar.get("_previewBg") or avatar.get("bg")
            icon_path = avatar.get("_previewIcon") or avatar.get("icon")
            preview_image = self._renderer.render(
                bg_path,
                icon_path,
                160,
                float(avatar.get("bgScale", 1)),
                avatar.get("bgOffset"),
                float(avatar.get("iconScale", 1)),
                avatar.get("iconOffset"),
                fast=fast
            )
            if not fast and not preview_override:
                self._preview_cache[avatar["id"]] = preview_image

        self._preview_images.clear()
        if preview_image:
            self._preview_images.append(preview_image)
        self._render_preview(self._preview_canvas, preview_image)

        saved_focus = avatar.get("_savedFocus") or self.snapshot_focus(avatar)
        original = self._original_preview_cache.get(avatar["id"])
        if original:
            original_image = original
        else:
            original_image = self._renderer.render(
                avatar.get("bg"),
                avatar.get("icon"),
                160,
                float(saved_focus.get("bgScale", 1)),
                saved_focus.get("bgOffset"),
                float(saved_focus.get("iconScale", 1)),
                saved_focus.get("iconOffset"),
                fast=False
            )
            self._original_preview_cache[avatar["id"]] = original_image
        if original_image:
            self._preview_images.append(original_image)
        self._render_preview(self._original_canvas, original_image)

        self._parent.preview_images = self._preview_images

    def _build_preview(self) -> None:
        preview_label = tk.Label(
            self._preview_frame,
            text="New",
            font=("Segoe UI", 10, "bold")
        )
        preview_label.grid(row=0, column=0, sticky="w")

        self._preview_canvas = tk.Canvas(
            self._preview_frame,
            width=160,
            height=160,
            highlightthickness=0,
            bg=self._preview_frame.cget("bg")
        )
        self._preview_canvas.grid(row=1, column=0, sticky="w", pady=(4, 0))

        original_label = tk.Label(
            self._preview_frame,
            text="Old",
            font=("Segoe UI", 10, "bold")
        )
        original_label.grid(row=0, column=1, sticky="w", padx=(16, 0))

        self._original_canvas = tk.Canvas(
            self._preview_frame,
            width=160,
            height=160,
            highlightthickness=0,
            bg=self._preview_frame.cget("bg")
        )
        self._original_canvas.grid(row=1, column=1, sticky="w", padx=(16, 0), pady=(4, 0))

        self._render_preview(self._preview_canvas, None)
        self._render_preview(self._original_canvas, None)

    def _render_preview(
        self,
        canvas: tk.Canvas,
        image: tk.PhotoImage | None
    ) -> None:
        canvas.delete("all")
        canvas.create_oval(2, 2, 158, 158, fill=SLOT_BG, outline="")
        if image:
            canvas.create_image(80, 80, image=image)
        canvas.create_oval(2, 2, 158, 158, fill="", outline=SLOT_BORDER, width=2)
