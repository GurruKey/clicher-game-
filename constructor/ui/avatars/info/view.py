import tkinter as tk
import tkinter.font as tkfont

from ...theme import (
    DIVIDER_COLOR,
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    create_scrollbar
)

from constants import TOOLTIP_BG, TOOLTIP_BORDER, SLOT_BG, SLOT_BORDER
from ...ui_common import draw_rounded_rect
from ..common import build_layer


def create_avatars_view(parent: tk.Frame, avatars: list[dict]) -> None:
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
        detail_frame, text="Select an avatar", font=("Segoe UI", 12, "bold")
    )
    detail_title.pack(anchor="nw")

    preview_frame = tk.Frame(detail_frame)
    preview_frame.pack(anchor="nw", pady=(12, 10))

    preview_canvas = tk.Canvas(
        preview_frame,
        width=64,
        height=64,
        highlightthickness=0,
        bg=detail_frame.cget("bg")
    )
    preview_canvas.grid(row=0, column=0, sticky="w")

    tooltip_font = tkfont.Font(family="Space Mono", size=11)
    tooltip_canvas = tk.Canvas(
        preview_frame,
        highlightthickness=0,
        bg=detail_frame.cget("bg")
    )
    tooltip_canvas.grid(row=1, column=0, sticky="w", pady=(6, 0))

    detail_text = tk.Label(detail_frame, text="", justify="left", anchor="nw")
    detail_text.pack(anchor="nw")

    search_row = tk.Frame(list_frame)
    search_row.pack(fill="x", pady=(0, 8))

    search_label = tk.Label(search_row, text="Search")
    search_label.pack(side="left")

    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var, width=22)
    search_entry.pack(side="left", padx=(8, 0))

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

    view_images: list[tk.PhotoImage] = []
    preview_images: list[tk.PhotoImage] = []
    row_entries: list[dict] = []
    image_cache: dict[tuple, tk.PhotoImage] = {}
    source_cache: dict[str, tk.PhotoImage] = {}
    scaled_cache: dict[tuple, tk.PhotoImage] = {}
    preview_cache: dict[str, tuple[tk.PhotoImage | None, tk.PhotoImage | None]] = {}

    selected_avatar_id: str | None = None
    hovered_avatar_id: str | None = None

    row_bg = ROW_BG
    row_hover_bg = ROW_HOVER_BG
    row_selected_bg = ROW_SELECTED_BG
    row_selected_hover_bg = ROW_SELECTED_HOVER_BG
    row_border = ROW_BORDER


    def update_row_styles() -> None:
        for entry in row_entries:
            avatar_id = entry["id"]
            widgets = entry["widgets"]
            if avatar_id == selected_avatar_id:
                color = (
                    row_selected_hover_bg
                    if avatar_id == hovered_avatar_id
                    else row_selected_bg
                )
            elif avatar_id == hovered_avatar_id:
                color = row_hover_bg
            else:
                color = row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def select_avatar(avatar: dict) -> None:
        nonlocal selected_avatar_id
        selected_avatar_id = avatar["id"]
        show_avatar(avatar)
        update_row_styles()

    def on_row_enter(avatar_id: str) -> None:
        nonlocal hovered_avatar_id
        hovered_avatar_id = avatar_id
        update_row_styles()

    def on_row_leave(avatar_id: str) -> None:
        nonlocal hovered_avatar_id
        if hovered_avatar_id == avatar_id:
            hovered_avatar_id = None
            update_row_styles()

    def render_preview(
        bg_image: tk.PhotoImage | None,
        icon_image: tk.PhotoImage | None
    ) -> None:
        preview_canvas.delete("all")
        preview_canvas.create_oval(1, 1, 63, 63, fill=SLOT_BG, outline="")
        if bg_image:
            preview_canvas.create_image(32, 32, image=bg_image)
        if icon_image:
            preview_canvas.create_image(32, 32, image=icon_image)
        preview_canvas.create_oval(
            1,
            1,
            63,
            63,
            fill="",
            outline=SLOT_BORDER,
            width=2
        )

    def render_tooltip(text: str) -> None:
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
            fill="#f5d36b",
            font=tooltip_font
        )

    def show_avatar(avatar: dict) -> None:
        detail_title.config(text=avatar["name"])
        details = [
            f"ID: {avatar['id']}",
            f"Race: {avatar['race']}",
            f"Race Level: {avatar['raceLevel']}",
            f"Subrace: {avatar['subrace']}",
            f"Subrace Level: {avatar['subraceLevel']}",
            f"Gender: {avatar['gender']}",
            f"Origin: {avatar['origin']}",
            f"Origin Level: {avatar['originLevel']}",
            f"Faction: {avatar['faction']}",
            f"Faction Level: {avatar['factionLevel']}",
            f"Subfaction: {avatar['subfaction']}",
            f"Subfaction Level: {avatar['subfactionLevel']}",
            f"Faction Subtype: {avatar['factionSubtype']}",
            f"Faction Subtype Level: {avatar['factionSubtypeLevel']}"
        ]
        detail_text.config(text="\n".join(details))
        render_tooltip(avatar["name"])

        cached = preview_cache.get(avatar["id"])
        if cached:
            bg_image, icon_image = cached
        else:
            bg_image = build_layer(
                avatar.get("bg"),
                64,
                float(avatar.get("bgScale", 1)),
                avatar.get("bgOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            icon_image = build_layer(
                avatar.get("icon"),
                64,
                float(avatar.get("iconScale", 1)),
                avatar.get("iconOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            preview_cache[avatar["id"]] = (bg_image, icon_image)

        preview_images.clear()
        if bg_image:
            preview_images.append(bg_image)
        if icon_image:
            preview_images.append(icon_image)
        render_preview(bg_image, icon_image)

    render_tooltip("Select an avatar")
    render_preview(None, None)

    for avatar in avatars:
        if avatar["id"] not in preview_cache:
            bg_image = build_layer(
                avatar.get("bg"),
                64,
                float(avatar.get("bgScale", 1)),
                avatar.get("bgOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            icon_image = build_layer(
                avatar.get("icon"),
                64,
                float(avatar.get("iconScale", 1)),
                avatar.get("iconOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            preview_cache[avatar["id"]] = (bg_image, icon_image)

    search_index = []
    for avatar in avatars:
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

    def render_list(filtered: list[dict]) -> None:
        for child in inner.winfo_children():
            child.destroy()
        view_images.clear()
        row_entries.clear()

        for avatar in filtered:
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

            icon_canvas = tk.Canvas(
                row_inner,
                width=44,
                height=44,
                highlightthickness=0,
                bg=row_bg
            )
            icon_canvas.pack(side="left", padx=(0, 10))
            icon_canvas.create_oval(2, 2, 42, 42, fill=SLOT_BG, outline="")

            bg_image = build_layer(
                avatar.get("bg"),
                44,
                float(avatar.get("bgScale", 1)),
                avatar.get("bgOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            icon_image = build_layer(
                avatar.get("icon"),
                44,
                float(avatar.get("iconScale", 1)),
                avatar.get("iconOffset"),
                image_cache,
                source_cache,
                scaled_cache
            )
            if bg_image:
                icon_canvas.create_image(22, 22, image=bg_image)
                view_images.append(bg_image)
            if icon_image:
                icon_canvas.create_image(22, 22, image=icon_image)
                view_images.append(icon_image)
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
                row_inner, text=avatar["name"], anchor="w", bg=row_bg
            )
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            row_entries.append({"id": avatar["id"], "widgets": row_widgets})

            def bind_interaction(widget: tk.Widget, avatar_id: str, current: dict) -> None:
                widget.bind(
                    "<Enter>",
                    lambda _event, current_id=avatar_id: on_row_enter(current_id)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, current_id=avatar_id: on_row_leave(current_id)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current: select_avatar(selected)
                )

            for widget in row_widgets:
                bind_interaction(widget, avatar["id"], avatar)

        parent.images = view_images
        update_row_styles()

    def on_filter_change(*_args: object) -> None:
        query = search_var.get().strip().lower()
        filtered = [
            avatar
            for avatar, blob in search_index
            if not query or query in blob
        ]
        render_list(filtered)

    search_entry.bind("<KeyRelease>", on_filter_change)

    render_list([avatar for avatar, _ in search_index])

    parent.images = view_images
    parent.preview_images = preview_images
