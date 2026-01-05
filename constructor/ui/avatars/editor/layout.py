from __future__ import annotations

from dataclasses import dataclass
from typing import Callable
import tkinter as tk

from ...theme import DIVIDER_COLOR


@dataclass
class AvatarEditorLayout:
    container: tk.Frame
    list_frame: tk.Frame
    detail_frame: tk.Frame
    controls_frame: tk.Frame
    preview_frame: tk.Frame
    assets_frame: tk.Frame
    show_status: Callable[[str, int | None], None]


def create_avatar_editor_layout(parent: tk.Frame) -> AvatarEditorLayout:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    container.columnconfigure(0, weight=0)
    container.columnconfigure(1, weight=0)
    container.columnconfigure(2, weight=1)
    container.rowconfigure(0, weight=1)

    status_var = tk.StringVar(value="")
    status_label = tk.Label(
        container,
        textvariable=status_var,
        bg="#0f0c09",
        fg="#f5d36b",
        padx=10,
        pady=4,
        font=("Segoe UI", 9, "bold"),
        bd=1,
        relief="solid"
    )
    status_hide_job: str | None = None

    def show_status(text: str, duration_ms: int | None = None) -> None:
        nonlocal status_hide_job
        if status_hide_job:
            container.after_cancel(status_hide_job)
            status_hide_job = None
        status_var.set(text)
        status_label.place(relx=0, rely=1, x=12, y=-12, anchor="sw")
        if duration_ms:
            status_hide_job = container.after(
                duration_ms,
                status_label.place_forget
            )

    list_frame = tk.Frame(container)
    list_frame.grid(row=0, column=0, sticky="nsw", padx=(0, 10))

    divider = tk.Frame(container, width=2, bg=DIVIDER_COLOR)
    divider.grid(row=0, column=1, sticky="ns")

    detail_frame = tk.Frame(container)
    detail_frame.grid(row=0, column=2, sticky="nsew", padx=(12, 0))

    content_row = tk.Frame(detail_frame)
    content_row.pack(anchor="nw", pady=(12, 8), fill="both", expand=True)
    content_row.columnconfigure(0, weight=0)
    content_row.columnconfigure(1, weight=1)
    content_row.rowconfigure(0, weight=1)

    controls_frame = tk.Frame(content_row)
    controls_frame.grid(row=0, column=0, sticky="nw")

    preview_assets_frame = tk.Frame(content_row)
    preview_assets_frame.grid(
        row=0,
        column=1,
        sticky="nsew",
        padx=(16, 0)
    )
    preview_assets_frame.columnconfigure(0, weight=1)

    preview_frame = tk.Frame(preview_assets_frame)
    preview_frame.grid(row=0, column=0, sticky="nw")

    assets_frame = tk.Frame(preview_assets_frame)
    assets_frame.grid(row=1, column=0, sticky="nsew", pady=(12, 0))

    return AvatarEditorLayout(
        container=container,
        list_frame=list_frame,
        detail_frame=detail_frame,
        controls_frame=controls_frame,
        preview_frame=preview_frame,
        assets_frame=assets_frame,
        show_status=show_status
    )
