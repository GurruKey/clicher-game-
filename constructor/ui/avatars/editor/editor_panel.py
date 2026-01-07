from __future__ import annotations

import tkinter as tk
from pathlib import Path

from ...theme import (
    ModernButton,
    MODE_ACTIVE_BG,
    MODE_ACTIVE_FG,
    BUTTON_BG,
    TEXT_COLOR
)
from .drag_controls import AvatarDragControls
from .editor_assets import AvatarAssetsPanel
from .editor_preview import AvatarPreviewPanel


class AvatarEditorPanel:
    def __init__(
        self,
        container: tk.Frame,
        controls_frame: tk.Frame,
        preview_frame: tk.Frame,
        assets_frame: tk.Frame,
        detail_title: tk.Label,
        avatars: list[dict],
        on_dirty=None,
        assets_root: Path | None = None,
        show_status=None
    ) -> None:
        self._container = container
        self._controls_frame = controls_frame
        self._preview_frame = preview_frame
        self._assets_frame = assets_frame
        self._detail_title = detail_title
        self._avatars = avatars
        self._on_dirty = on_dirty
        self._show_status_cb = show_status

        self._selected_avatar: dict | None = None

        # 1. Create Preview Panel (without controller first)
        # Pass container as parent for image reference retention
        self._preview_panel = AvatarPreviewPanel(container, preview_frame)

        # 2. Create Drag Controls (depends on preview_panel)
        self._drag_controls = AvatarDragControls(
            controls_frame,
            self._preview_panel,
            self._get_selected_avatar,
            on_dirty=on_dirty
        )

        # 3. Link Drag Controls back to Preview Panel
        self._preview_panel.set_drag_controller(self._drag_controls)

        icon_assets_dir = (
            assets_root / "icons"
            if assets_root
            else Path("constructor/assets/avatars/icons")
        )
        bg_assets_dir = (
            assets_root / "backgrounds"
            if assets_root
            else Path("constructor/assets/avatars/backgrounds")
        )

        self._assets_panel = AvatarAssetsPanel(
            assets_frame,
            icon_assets_dir,
            bg_assets_dir,
            self._preview_panel,
            self._get_selected_avatar,
            show_status=show_status,
            on_dirty=on_dirty
        )

        self._build_editor_actions()
        self._assets_panel.set_used_assets(avatars)
        self._assets_panel.render_asset_bars()

    def select_avatar(self, avatar: dict | None) -> None:
        self._selected_avatar = avatar
        if avatar:
            self._detail_title.config(text=avatar["name"])
        else:
            self._detail_title.config(text="Select an avatar")

        self._preview_panel.show_avatar(avatar)
        self._drag_controls.update_controls()
        self._assets_panel.update_asset_buttons()
        self._update_action_buttons()

    def _get_selected_avatar(self) -> dict | None:
        return self._selected_avatar

    def _update_action_buttons(self) -> None:
        state = "normal" if self._selected_avatar else "disabled"
        self._change_icon_button.config(state=state)
        self._change_bg_button.config(state=state)
        self._icon_reset_button.config(state=state)
        self._bg_reset_button.config(state=state)
        self._save_button.config(state=state)

    def _build_editor_actions(self) -> None:
        action_row = tk.Frame(self._controls_frame)
        action_row.pack(fill="x", pady=(12, 0))

        # UPDATED: Use ModernButton
        self._change_icon_button = ModernButton(action_row, text="Change Avatar", state="disabled")
        self._change_icon_button.pack(side="left", fill="x", expand=True, padx=(0, 4))

        self._change_bg_button = ModernButton(action_row, text="Change Background", state="disabled")
        self._change_bg_button.pack(side="left", fill="x", expand=True, padx=(4, 0))

        focus_row = tk.Frame(self._controls_frame)
        focus_row.pack(fill="x", pady=(8, 0))

        icon_focus = tk.Frame(focus_row)
        icon_focus.pack(side="left", fill="x", expand=True, padx=(0, 4))

        bg_focus = tk.Frame(focus_row)
        bg_focus.pack(side="left", fill="x", expand=True, padx=(4, 0))

        self._icon_reset_button = ModernButton(icon_focus, text="Reset Avatar")
        self._icon_reset_button.pack(fill="x")

        self._bg_reset_button = ModernButton(bg_focus, text="Reset Background")
        self._bg_reset_button.pack(fill="x")

        self._save_button = ModernButton(self._controls_frame, text="Save", state="disabled")
        self._save_button.pack(fill="x", pady=(12, 0))

        self._icon_reset_button.config(command=lambda: self._reset_asset("icon"))
        self._bg_reset_button.config(command=lambda: self._reset_asset("bg"))

    def _reset_asset(self, kind: str) -> None:
        if not self._selected_avatar:
            return
        if kind == "icon":
            self._selected_avatar["iconScale"] = 1.0
            self._selected_avatar["iconOffset"] = {"x": 0, "y": 0}
        else:
            self._selected_avatar["bgScale"] = 1.0
            self._selected_avatar["bgOffset"] = {"x": 0, "y": 0}
        self.select_avatar(self._selected_avatar)
        if self._on_dirty:
            self._on_dirty()
