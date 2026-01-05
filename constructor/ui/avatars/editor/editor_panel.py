from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import filedialog

from game_io.avatars import (
    update_avatar_asset,
    update_avatar_offset,
    update_avatar_scale
)
from .drag_controls import AvatarDragController
from .editor_assets import AvatarAssetsPanel
from .editor_preview import AvatarPreviewPanel


class AvatarEditorPanel:
    def __init__(
        self,
        parent: tk.Frame,
        controls_frame: tk.Frame,
        preview_frame: tk.Frame,
        assets_frame: tk.Frame,
        detail_title: tk.Label,
        avatars: list[dict],
        on_dirty=None,
        assets_root: Path | None = None,
        show_status=None
    ) -> None:
        self._parent = parent
        self._controls_frame = controls_frame
        self._preview_frame = preview_frame
        self._assets_frame = assets_frame
        self._detail_title = detail_title
        self._avatars = avatars
        self._on_dirty = on_dirty
        self._show_status_cb = show_status

        if assets_root is None:
            assets_root = Path(__file__).resolve().parents[4] / "assets" / "avatars"
        self._icon_assets_dir = assets_root / "icons"
        self._bg_assets_dir = assets_root / "backgrounds"
        self._icon_assets_dir.mkdir(parents=True, exist_ok=True)
        self._bg_assets_dir.mkdir(parents=True, exist_ok=True)

        self._selected_avatar: dict | None = None
        self._selected_avatar_id: str | None = None
        self._is_setting_vars = False

        self._focus_update_job: str | None = None
        self._finalize_focus_job: str | None = None
        self._pending_focus_update = False
        self._last_focus_state: tuple | None = None

        self._build_controls()
        self._preview_panel = AvatarPreviewPanel(
            parent,
            preview_frame,
            self._drag_controller,
            detail_title
        )
        self._assets_panel = AvatarAssetsPanel(
            assets_frame,
            self._icon_assets_dir,
            self._bg_assets_dir,
            self._preview_panel,
            self._get_selected_avatar,
            show_status=self._show_status,
            on_dirty=self._on_dirty
        )
        self._assets_panel.set_used_assets(avatars)
        self._assets_panel.render_asset_bars()
        self._assets_panel.update_asset_buttons()

        self._preview_panel.initialize_previews(self._avatars)

    def select_avatar(self, avatar: dict) -> None:
        self._selected_avatar = avatar
        self._selected_avatar_id = avatar["id"]
        if "_savedFocus" not in avatar:
            avatar["_savedFocus"] = self._preview_panel.snapshot_focus(avatar)
        self._preview_panel.show_avatar(avatar)
        self._change_icon_button.config(state="normal")
        self._change_bg_button.config(state="normal")
        self._save_button.config(state="normal")
        self._assets_panel.update_asset_buttons()
        self._is_setting_vars = True
        self._icon_offset_x.set(avatar.get("iconOffset", {}).get("x", 0))
        self._icon_offset_y.set(avatar.get("iconOffset", {}).get("y", 0))
        self._icon_scale.set(avatar.get("iconScale", 1))
        self._bg_offset_x.set(avatar.get("bgOffset", {}).get("x", 0))
        self._bg_offset_y.set(avatar.get("bgOffset", {}).get("y", 0))
        self._bg_scale.set(avatar.get("bgScale", 1))
        self._is_setting_vars = False

    def _get_selected_avatar(self) -> dict | None:
        return self._selected_avatar

    def _show_status(self, text: str, duration_ms: int | None = None) -> None:
        if not self._show_status_cb:
            return
        self._show_status_cb(text, duration_ms)

    def _build_controls(self) -> None:
        action_row = tk.Frame(self._controls_frame)
        action_row.pack(anchor="nw", pady=(0, 6))

        self._change_icon_button = tk.Button(action_row, text="Change Avatar", state="disabled")
        self._change_icon_button.pack(side="left")

        self._change_bg_button = tk.Button(action_row, text="Change Background", state="disabled")
        self._change_bg_button.pack(side="left", padx=(10, 0))

        self._apply_all_var = tk.BooleanVar(value=False)
        apply_all_toggle = tk.Checkbutton(
            self._controls_frame,
            text="Apply to all avatars",
            variable=self._apply_all_var
        )
        apply_all_toggle.pack(anchor="nw", pady=(0, 10))

        focus_frame = tk.Frame(self._controls_frame)
        focus_frame.pack(anchor="nw", pady=(0, 8), fill="x")

        icon_focus = tk.LabelFrame(focus_frame, text="Avatar")
        icon_focus.pack(anchor="nw", fill="x", pady=(0, 10))

        bg_focus = tk.LabelFrame(focus_frame, text="Background")
        bg_focus.pack(anchor="nw", fill="x")

        self._icon_offset_x = tk.DoubleVar(value=0)
        self._icon_offset_y = tk.DoubleVar(value=0)
        self._icon_scale = tk.DoubleVar(value=1)
        self._icon_step = tk.DoubleVar(value=1)

        self._bg_offset_x = tk.DoubleVar(value=0)
        self._bg_offset_y = tk.DoubleVar(value=0)
        self._bg_scale = tk.DoubleVar(value=1)
        self._bg_step = tk.DoubleVar(value=1)

        self._drag_controller = AvatarDragController(
            self._parent,
            self._icon_offset_x,
            self._icon_offset_y,
            self._bg_offset_x,
            self._bg_offset_y,
            on_fast_update=lambda: self._apply_focus_updates_all(fast=True),
            on_final_update=lambda: self._apply_focus_updates_all(fast=False)
        )

        self._build_focus_controls(
            icon_focus,
            self._icon_offset_x,
            self._icon_offset_y,
            self._icon_scale,
            self._icon_step
        )
        self._build_focus_controls(
            bg_focus,
            self._bg_offset_x,
            self._bg_offset_y,
            self._bg_scale,
            self._bg_step
        )

        self._icon_reset_button = tk.Button(icon_focus, text="Reset Avatar")
        self._icon_reset_button.pack(anchor="nw", padx=8, pady=(0, 8))
        self._bg_reset_button = tk.Button(bg_focus, text="Reset Background")
        self._bg_reset_button.pack(anchor="nw", padx=8, pady=(0, 8))

        self._save_button = tk.Button(self._controls_frame, text="Save", state="disabled")
        self._save_button.pack(anchor="nw")

        self._icon_reset_button.config(command=self._reset_icon_focus)
        self._bg_reset_button.config(command=self._reset_bg_focus)
        self._save_button.config(command=self._handle_save)

        self._change_icon_button.config(command=lambda: self._handle_pick_asset("icon"))
        self._change_bg_button.config(command=lambda: self._handle_pick_asset("bg"))

        self._icon_offset_x.trace_add("write", self._schedule_focus_update)
        self._icon_offset_y.trace_add("write", self._schedule_focus_update)
        self._icon_scale.trace_add("write", self._schedule_focus_update)
        self._bg_offset_x.trace_add("write", self._schedule_focus_update)
        self._bg_offset_y.trace_add("write", self._schedule_focus_update)
        self._bg_scale.trace_add("write", self._schedule_focus_update)

    def _build_focus_controls(
        self,
        frame: tk.LabelFrame,
        offset_x,
        offset_y,
        scale_var,
        step_var
    ) -> None:
        offset_row = tk.Frame(frame)
        offset_row.pack(anchor="nw", padx=8, pady=(6, 4))
        tk.Label(offset_row, text="Offset X").pack(side="left")
        tk.Spinbox(
            offset_row,
            from_=-200,
            to=200,
            increment=1,
            textvariable=offset_x,
            width=6
        ).pack(side="left", padx=(6, 12))
        tk.Label(offset_row, text="Offset Y").pack(side="left")
        tk.Spinbox(
            offset_row,
            from_=-200,
            to=200,
            increment=1,
            textvariable=offset_y,
            width=6
        ).pack(side="left", padx=(6, 0))

        scale_row = tk.Frame(frame)
        scale_row.pack(anchor="nw", padx=8, pady=(0, 6))
        tk.Label(scale_row, text="Scale").pack(side="left")
        tk.Spinbox(
            scale_row,
            from_=0.5,
            to=2.0,
            increment=0.05,
            format="%.2f",
            textvariable=scale_var,
            width=6
        ).pack(side="left", padx=(6, 0))
        scale_slider = tk.Scale(
            frame,
            from_=0.5,
            to=2.0,
            resolution=0.05,
            orient="horizontal",
            showvalue=0,
            length=140,
            variable=scale_var
        )
        scale_slider.pack(anchor="nw", padx=8, pady=(0, 8))

        step_row = tk.Frame(frame)
        step_row.pack(anchor="nw", padx=8, pady=(0, 6))
        tk.Label(step_row, text="Step").pack(side="left")
        tk.Spinbox(
            step_row,
            from_=1,
            to=50,
            increment=1,
            textvariable=step_var,
            width=5
        ).pack(side="left", padx=(6, 0))

        nudge = tk.Frame(frame)
        nudge.pack(anchor="nw", padx=8, pady=(0, 8))
        tk.Button(
            nudge,
            text="^",
            width=2,
            command=lambda: self._drag_controller.nudge_offset(
                offset_x,
                offset_y,
                0,
                -1,
                step_var
            )
        ).grid(row=0, column=1)
        tk.Button(
            nudge,
            text="<",
            width=2,
            command=lambda: self._drag_controller.nudge_offset(
                offset_x,
                offset_y,
                -1,
                0,
                step_var
            )
        ).grid(row=1, column=0, padx=(0, 4))
        tk.Button(
            nudge,
            text=">",
            width=2,
            command=lambda: self._drag_controller.nudge_offset(
                offset_x,
                offset_y,
                1,
                0,
                step_var
            )
        ).grid(row=1, column=2, padx=(4, 0))
        tk.Button(
            nudge,
            text="v",
            width=2,
            command=lambda: self._drag_controller.nudge_offset(
                offset_x,
                offset_y,
                0,
                1,
                step_var
            )
        ).grid(row=2, column=1)

    def _handle_pick_asset(self, kind: str) -> None:
        if not self._selected_avatar:
            return
        path = filedialog.askopenfilename(
            title="Select image",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")]
        )
        if not path:
            return
        new_path = Path(path).resolve()
        if kind == "icon":
            updated = update_avatar_asset(
                self._selected_avatar["file"],
                self._selected_avatar.get("iconVar"),
                new_path
            )
            if updated:
                self._selected_avatar["icon"] = new_path
        else:
            updated = update_avatar_asset(
                self._selected_avatar["file"],
                self._selected_avatar.get("bgVar"),
                new_path
            )
            if updated:
                self._selected_avatar["bg"] = new_path

        self._preview_panel.clear_preview_cache(self._selected_avatar["id"])
        self._preview_panel.clear_original_cache(self._selected_avatar["id"])
        if self._on_dirty:
            self._on_dirty()
        self._preview_panel.show_avatar(self._selected_avatar, force=True, fast=False)
        self._assets_panel.render_asset_bars()

    def _apply_focus_updates_all(self, fast: bool) -> None:
        self._focus_update_job = None
        if not self._selected_avatar or self._is_setting_vars:
            return
        icon_offset = {
            "x": float(self._icon_offset_x.get()),
            "y": float(self._icon_offset_y.get())
        }
        bg_offset = {
            "x": float(self._bg_offset_x.get()),
            "y": float(self._bg_offset_y.get())
        }
        icon_scale_value = float(self._icon_scale.get())
        bg_scale_value = float(self._bg_scale.get())
        state = (
            icon_offset["x"],
            icon_offset["y"],
            icon_scale_value,
            bg_offset["x"],
            bg_offset["y"],
            bg_scale_value,
            self._apply_all_var.get()
        )
        if state == self._last_focus_state and fast:
            return
        self._last_focus_state = state
        targets = self._avatars if self._apply_all_var.get() else [self._selected_avatar]
        for avatar in targets:
            avatar["iconOffset"] = icon_offset
            avatar["iconScale"] = icon_scale_value
            avatar["bgOffset"] = bg_offset
            avatar["bgScale"] = bg_scale_value
        if self._on_dirty:
            self._on_dirty()
        if self._apply_all_var.get():
            self._preview_panel.clear_preview_cache()
        else:
            self._preview_panel.clear_preview_cache(self._selected_avatar["id"])
        self._preview_panel.show_avatar(self._selected_avatar, force=True, fast=fast)

    def _run_focus_updates(self) -> None:
        if not self._pending_focus_update:
            self._focus_update_job = None
            return
        self._pending_focus_update = False
        self._apply_focus_updates_all(fast=True)
        if self._finalize_focus_job:
            self._parent.after_cancel(self._finalize_focus_job)
        self._finalize_focus_job = self._parent.after(
            180,
            lambda: self._apply_focus_updates_all(fast=False)
        )
        self._focus_update_job = self._parent.after(50, self._run_focus_updates)

    def _schedule_focus_update(self, *_args: object) -> None:
        if self._is_setting_vars:
            return
        if self._drag_controller.active:
            return
        self._pending_focus_update = True
        if self._focus_update_job is None:
            self._focus_update_job = self._parent.after(0, self._run_focus_updates)

    def _reset_icon_focus(self) -> None:
        if not self._selected_avatar:
            return
        self._icon_offset_x.set(0)
        self._icon_offset_y.set(0)
        self._icon_scale.set(1)

    def _reset_bg_focus(self) -> None:
        if not self._selected_avatar:
            return
        self._bg_offset_x.set(0)
        self._bg_offset_y.set(0)
        self._bg_scale.set(1)

    def _persist_focus(self, avatar: dict) -> None:
        update_avatar_offset(avatar["file"], "iconOffset", avatar["iconOffset"])
        update_avatar_scale(avatar["file"], "iconScale", avatar["iconScale"])
        update_avatar_offset(avatar["file"], "bgOffset", avatar["bgOffset"])
        update_avatar_scale(avatar["file"], "bgScale", avatar["bgScale"])
        avatar["_savedFocus"] = self._preview_panel.snapshot_focus(avatar)
        self._preview_panel.clear_original_cache(avatar["id"])

    def _handle_save(self) -> None:
        if not self._selected_avatar:
            return
        self._show_status("Saving...")

        def finalize_save() -> None:
            targets = self._avatars if self._apply_all_var.get() else [self._selected_avatar]
            for avatar in targets:
                self._persist_focus(avatar)
            if self._on_dirty:
                self._on_dirty()
            if self._selected_avatar:
                self._preview_panel.show_avatar(self._selected_avatar, force=True, fast=False)
            self._show_status("Saved", duration_ms=1200)

        self._parent.after(10, finalize_save)
