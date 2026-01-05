from pathlib import Path
import re
import tkinter as tk

from .theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)
import tkinter.font as tkfont
from tkinter import colorchooser, messagebox

from constants import DEFAULT_RARITY_COLORS, TOOLTIP_BG, TOOLTIP_BORDER
from game_io.rarities import (
    delete_rarity,
    parse_rarities,
    sanitize_rarity_id,
    save_rarity
)
from .ui_common import draw_rounded_rect


def create_rarities_view(
    parent: tk.Frame,
    rarities_root: Path,
    rarities: list[dict]
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    container.columnconfigure(0, weight=0)
    container.columnconfigure(1, weight=0)
    container.columnconfigure(2, weight=1)
    container.rowconfigure(0, weight=1)

    list_frame = tk.Frame(container)
    list_frame.grid(row=0, column=0, sticky="nsw", padx=(0, 10))

    divider = tk.Frame(container, width=2, bg=DIVIDER_COLOR)
    divider.grid(row=0, column=1, sticky="ns")

    detail_frame = tk.Frame(container)
    detail_frame.grid(row=0, column=2, sticky="nsew", padx=(12, 0))

    detail_title = tk.Label(
        detail_frame, text="Select a rarity", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    input_row = tk.Frame(detail_frame)
    input_row.pack(anchor="nw", pady=(10, 6))

    input_label = tk.Label(input_row, text="Preview text")
    input_label.pack(side="left")

    preview_text_var = tk.StringVar(value="Stone")
    preview_entry = tk.Entry(input_row, textvariable=preview_text_var, width=24)
    preview_entry.pack(side="left", padx=(8, 0))

    add_frame = tk.LabelFrame(detail_frame, text="Add rarity")
    add_frame.pack(anchor="nw", fill="x", pady=(8, 10))

    add_id_var = tk.StringVar()
    add_label_var = tk.StringVar()
    add_color_var = tk.StringVar(value="#ffffff")
    error_var = tk.StringVar()
    mode_var = tk.StringVar(value="Mode: New")
    selected_id = {"value": None}
    id_conflict_var = tk.StringVar()

    add_row = tk.Frame(add_frame)
    add_row.pack(fill="x", padx=10, pady=(8, 0))

    tk.Label(add_row, text="Id").grid(row=0, column=0, sticky="w")
    tk.Entry(add_row, textvariable=add_id_var, width=18).grid(
        row=0, column=1, sticky="w", padx=(6, 14)
    )
    tk.Label(add_row, text="Label").grid(row=0, column=2, sticky="w")
    tk.Entry(add_row, textvariable=add_label_var, width=18).grid(
        row=0, column=3, sticky="w", padx=(6, 14)
    )
    tk.Label(add_row, text="Color").grid(row=0, column=4, sticky="w")
    tk.Entry(add_row, textvariable=add_color_var, width=12).grid(
        row=0, column=5, sticky="w", padx=(6, 0)
    )

    action_row = tk.Frame(add_frame)
    action_row.pack(fill="x", padx=10, pady=(6, 8))

    error_label = tk.Label(action_row, textvariable=error_var, fg="#b44")
    error_label.pack(side="left")

    conflict_label = tk.Label(action_row, textvariable=id_conflict_var, fg="#b44")
    conflict_label.pack(side="left", padx=(8, 0))

    mode_label = tk.Label(action_row, textvariable=mode_var)
    mode_label.pack(side="left", padx=(8, 0))

    save_button = tk.Button(action_row, text="Save")
    save_button.pack(side="right")

    delete_button = tk.Button(action_row, text="Delete")
    delete_button.pack(side="right", padx=(0, 8))

    new_button = tk.Button(action_row, text="New")
    new_button.pack(side="right", padx=(0, 8))

    preview_frame = tk.Frame(detail_frame)
    preview_frame.pack(anchor="nw", pady=(12, 10))

    tooltip_font = tkfont.Font(family="Space Mono", size=11)
    tooltip_canvas = tk.Canvas(
        preview_frame,
        highlightthickness=0,
        bg=detail_frame.cget("bg")
    )
    tooltip_canvas.pack()

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw")

    row_entries: list[dict] = []
    selected_item_id: str | None = None
    hovered_item_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER

    def update_row_styles() -> None:
        for entry in row_entries:
            item_id = entry["id"]
            widgets = entry["widgets"]
            if item_id == selected_item_id:
                color = row_selected_hover_bg if item_id == hovered_item_id else row_selected_bg
            elif item_id == hovered_item_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    selected_color = {"value": DEFAULT_RARITY_COLORS["common"]}
    selected_label = {"value": "Common"}

    def render_tooltip(text: str, color: str) -> None:
        tooltip_canvas.delete("all")
        text_width = tooltip_font.measure(text)
        text_height = tooltip_font.metrics("linespace")
        pad_x = 10
        pad_y = 6
        width = text_width + pad_x * 2
        height = text_height + pad_y * 2
        radius = min(10, height // 2)
        tooltip_canvas.config(width=width, height=height)
        draw_rounded_rect(
            tooltip_canvas,
            1,
            1,
            width - 1,
            height - 1,
            radius,
            fill=TOOLTIP_BG,
            outline=TOOLTIP_BORDER
        )
        tooltip_canvas.create_text(
            width / 2,
            height / 2,
            text=text,
            fill=color,
            font=tooltip_font
        )

    def set_edit_mode(item: dict | None) -> None:
        nonlocal selected_item_id
        if item:
            selected_id["value"] = item["id"]
            add_id_var.set(item["id"])
            add_label_var.set(item["label"])
            add_color_var.set(item["color"])
            mode_var.set(f"Mode: Editing {item['id']}")
            selected_item_id = item["id"]
        else:
            selected_id["value"] = None
            add_id_var.set("")
            add_label_var.set("")
            add_color_var.set("#ffffff")
            mode_var.set("Mode: New")
            selected_item_id = None
        update_row_styles()

    def show_rarity(item: dict) -> None:
        selected_color["value"] = item["color"]
        selected_label["value"] = item["label"]
        detail_title.config(text=item["label"])
        detail_text.config(
            text="\n".join(
                [
                    f"ID: {item['id']}",
                    f"Label: {item['label']}",
                    f"Color: {item['color']}"
                ]
            )
        )
        render_tooltip(preview_text_var.get() or item["label"], item["color"])
        set_edit_mode(item)

    def on_row_enter(item_id: str) -> None:
        nonlocal hovered_item_id
        hovered_item_id = item_id
        update_row_styles()

    def on_row_leave(item_id: str) -> None:
        nonlocal hovered_item_id
        if hovered_item_id == item_id:
            hovered_item_id = None
            update_row_styles()

    def on_text_change(*_args: object) -> None:
        render_tooltip(
            preview_text_var.get() or selected_label["value"],
            selected_color["value"]
        )

    preview_text_var.trace_add("write", on_text_change)
    render_tooltip(preview_text_var.get(), selected_color["value"])

    def reload_view() -> None:
        for child in parent.winfo_children():
            child.destroy()
        next_rarities = parse_rarities(rarities_root)
        create_rarities_view(parent, rarities_root, next_rarities)

    def handle_pick_color() -> None:
        current = add_color_var.get().strip()
        picked = colorchooser.askcolor(
            color=current if re.match(r"^#[0-9a-fA-F]{6}$", current) else None
        )
        if picked and picked[1]:
            add_color_var.set(picked[1])

    def handle_save() -> None:
        raw_id = add_id_var.get().strip()
        label = add_label_var.get().strip() or raw_id
        color = add_color_var.get().strip()
        if not raw_id:
            error_var.set("Id is required.")
            return
        rarity_id = sanitize_rarity_id(raw_id)
        if not rarity_id:
            error_var.set("Id must contain letters or numbers.")
            return
        if not re.match(r"^#[0-9a-fA-F]{6}$", color):
            error_var.set("Color must be #RRGGBB.")
            return
        error_var.set("")
        existing_ids = {item["id"] for item in rarities}
        current_id = selected_id["value"]
        if current_id and current_id != rarity_id and rarity_id in existing_ids:
            error_var.set("Id already exists.")
            return
        if not current_id and rarity_id in existing_ids:
            error_var.set("Id already exists.")
            return

        if current_id and current_id != rarity_id:
            delete_rarity(rarities_root, current_id)

        save_rarity(
            rarities_root,
            {"id": rarity_id, "label": label, "color": color}
        )
        reload_view()

    save_button.config(command=handle_save)
    new_button.config(command=lambda: set_edit_mode(None))

    def handle_delete() -> None:
        current_id = selected_id["value"]
        if not current_id:
            error_var.set("Select a rarity to delete.")
            return
        if not messagebox.askyesno(
            "Delete rarity", f"Delete rarity '{current_id}'?"
        ):
            return
        delete_rarity(rarities_root, current_id)
        reload_view()

    delete_button.config(command=handle_delete)

    def update_conflict(_event: object | None = None) -> None:
        raw_id = add_id_var.get().strip()
        if not raw_id:
            id_conflict_var.set("")
            save_button.config(state="disabled")
            return
        rarity_id = sanitize_rarity_id(raw_id)
        existing_ids = {item["id"] for item in rarities}
        current_id = selected_id["value"]
        if rarity_id in existing_ids and rarity_id != current_id:
            id_conflict_var.set("Id already exists.")
            save_button.config(state="disabled")
        else:
            id_conflict_var.set("")
            save_button.config(state="normal")

    add_id_var.trace_add("write", update_conflict)

    canvas = tk.Canvas(list_frame, width=260, highlightthickness=0)
    scrollbar = create_scrollbar(list_frame, orient="vertical", command=canvas.yview)
    inner = tk.Frame(canvas)

    def on_configure(_event) -> None:
        canvas.configure(scrollregion=canvas.bbox("all"))

    inner.bind("<Configure>", on_configure)
    canvas.create_window((0, 0), window=inner, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill="y", expand=False)
    scrollbar.pack(side="right", fill="y")

    pick_row = tk.Frame(add_frame)
    pick_row.pack(fill="x", padx=10, pady=(0, 8))

    pick_button = tk.Button(pick_row, text="Pick color", command=handle_pick_color)
    pick_button.pack(side="left")

    for item in rarities:
        row = tk.Frame(
            inner,
            bg=row_bg,
            highlightthickness=1,
            highlightbackground=row_border,
            highlightcolor=row_border
        )
        row.pack(fill="x", pady=5)

        row_inner = tk.Frame(row, bg=row_bg)
        row_inner.pack(fill="x", padx=8, pady=6)

        row_widgets: list[tk.Widget] = [row, row_inner]

        color_box = tk.Canvas(
            row_inner,
            width=16,
            height=16,
            highlightthickness=0,
            bg=row_bg
        )
        color_box.create_rectangle(0, 0, 16, 16, fill=item["color"], outline="")
        color_box.pack(side="left", padx=(0, 10))
        row_widgets.append(color_box)

        text_label = tk.Label(row_inner, text=item["label"], anchor="w", bg=row_bg)
        text_label.pack(side="left", fill="x", expand=True)
        row_widgets.append(text_label)

        row_entries.append({"id": item["id"], "widgets": row_widgets})

        def bind_interaction(widget: tk.Widget, item_id: str, current: dict) -> None:
            widget.bind(
                "<Enter>",
                lambda _event, current_id=item_id: on_row_enter(current_id)
            )
            widget.bind(
                "<Leave>",
                lambda _event, current_id=item_id: on_row_leave(current_id)
            )
            widget.bind(
                "<Button-1>",
                lambda _event, selected=current: show_rarity(selected)
            )

        for widget in row_widgets:
            bind_interaction(widget, item["id"], item)

    update_row_styles()
