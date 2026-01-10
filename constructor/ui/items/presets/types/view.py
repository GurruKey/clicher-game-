import tkinter as tk
from pathlib import Path

from ....theme import BG_COLOR, ModernPanedWindow
from game_io.types import parse_types
from .tree import create_types_tree
from .editor import create_types_editor

def create_types_view(
    parent: tk.Frame,
    types_root: Path,
    item_types: list[dict]
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)

    paned = ModernPanedWindow(container, horizontal=True)
    paned.pack(fill="both", expand=True)

    # Note: We need a mutable reference to set_edit_mode because it's created after on_select is defined
    set_edit_mode_ref = [None]

    def reload_view() -> None:
        for child in parent.winfo_children():
            child.destroy()
        next_types = parse_types(types_root)
        create_types_view(parent, types_root, next_types)

    def on_select(item):
        if set_edit_mode_ref[0]:
            set_edit_mode_ref[0](item)

    # Left side (Tree)
    tree_frame = create_types_tree(paned, item_types, on_select)
    paned.add(tree_frame, minsize=280)

    # Right side (Editor)
    def on_change():
        reload_view()

    editor_frame, set_edit_mode = create_types_editor(paned, types_root, item_types, on_change)
    set_edit_mode_ref[0] = set_edit_mode
    
    paned.add(editor_frame, minsize=400)
