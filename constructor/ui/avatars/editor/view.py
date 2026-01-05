import tkinter as tk

from .editor_panel import AvatarEditorPanel
from .layout import create_avatar_editor_layout
from .list_panel import AvatarListPanel


def create_avatar_editor_view(
    parent: tk.Frame,
    avatars: list[dict],
    on_dirty=None,
    assets_root=None
) -> None:
    layout = create_avatar_editor_layout(parent)

    detail_title = tk.Label(
        layout.detail_frame,
        text="Select an avatar",
        font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    editor_panel = AvatarEditorPanel(
        layout.container,
        layout.controls_frame,
        layout.preview_frame,
        layout.assets_frame,
        detail_title,
        avatars,
        on_dirty=on_dirty,
        assets_root=assets_root,
        show_status=layout.show_status
    )
    list_panel = AvatarListPanel(
        layout.list_frame,
        avatars,
        on_select=editor_panel.select_avatar
    )

    parent.avatar_editor_panel = editor_panel
    parent.avatar_list_panel = list_panel
