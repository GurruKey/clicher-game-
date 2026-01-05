import tkinter as tk

from ....theme import (
    ROW_BG,
    ROW_BORDER,
    ROW_HOVER_BG,
    ROW_SELECTED_BG,
    ROW_SELECTED_HOVER_BG,
    TEXT_COLOR
)


class RaceViewListMixin:
    def init_list_states(self) -> None:
        self.row_bg = ROW_BG
        self.row_hover_bg = ROW_HOVER_BG
        self.row_selected_bg = ROW_SELECTED_BG
        self.row_selected_hover_bg = ROW_SELECTED_HOVER_BG
        self.row_border = ROW_BORDER

        self.race_state = self.build_list_state()
        self.level_state = self.build_list_state()
        self.variant_state = self.build_list_state()
        self.tag_list_state = self.build_list_state()

    def build_list_state(self) -> dict:
        return {"selected": None, "hovered": None, "rows": []}

    def update_row_styles(self, state) -> None:
        for entry in state["rows"]:
            item_id = entry["id"]
            widgets = entry["widgets"]
            if item_id == state["selected"]:
                color = (
                    self.row_selected_hover_bg
                    if item_id == state["hovered"]
                    else self.row_selected_bg
                )
            elif item_id == state["hovered"]:
                color = self.row_hover_bg
            else:
                color = self.row_bg

            for widget in widgets:
                widget.configure(bg=color)

    def on_row_enter(self, state, item_id: str) -> None:
        state["hovered"] = item_id
        self.update_row_styles(state)

    def on_row_leave(self, state, item_id: str) -> None:
        if state["hovered"] == item_id:
            state["hovered"] = None
            self.update_row_styles(state)

    def render_list(self, inner, state, items, label_fn, on_select, row_extra=None):
        for child in inner.winfo_children():
            child.destroy()
        state["rows"].clear()

        for item in items:
            item_id = item["id"]
            row = tk.Frame(
                inner,
                bg=self.row_bg,
                highlightthickness=1,
                highlightbackground=self.row_border,
                highlightcolor=self.row_border
            )
            row.pack(fill="x", pady=5)

            row_inner = tk.Frame(row, bg=self.row_bg)
            row_inner.pack(fill="x", padx=8, pady=6)

            row_widgets: list[tk.Widget] = [row, row_inner]

            text_label = tk.Label(
                row_inner,
                text=label_fn(item),
                anchor="w",
                bg=self.row_bg,
                fg=item.get("fg", TEXT_COLOR)
            )
            text_label.pack(side="left", fill="x", expand=True)
            row_widgets.append(text_label)

            def bind_interaction(widget: tk.Widget, current_id: str, current_item):
                widget.bind(
                    "<Enter>",
                    lambda _event, cid=current_id: self.on_row_enter(state, cid)
                )
                widget.bind(
                    "<Leave>",
                    lambda _event, cid=current_id: self.on_row_leave(state, cid)
                )
                widget.bind(
                    "<Button-1>",
                    lambda _event, selected=current_item: on_select(selected)
                )

            def register_widget(widget: tk.Widget) -> None:
                row_widgets.append(widget)
                bind_interaction(widget, item_id, item)

            if row_extra:
                row_extra(row, row_inner, item, register_widget)

            state["rows"].append({"id": item_id, "widgets": row_widgets})

            for widget in row_widgets:
                bind_interaction(widget, item_id, item)

        self.update_row_styles(state)
