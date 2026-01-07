import tkinter as tk

from ....theme import BUTTON_BG, MODE_ACTIVE_BG, MODE_ACTIVE_FG, TEXT_COLOR


class RaceViewLevelEditorMixin:
    def init_level_editor_actions(self) -> None:
        self.level_toggle_button.config(command=self.toggle_level_editor)
        self.level_exit_button.config(command=self.exit_level_editor)
        self.create_level_button.config(command=self.handle_create_level)
        self.update_level_button.config(command=self.handle_update_level)
        self.delete_level_button.config(command=self.handle_delete_level)
        self.restore_level_button.config(command=self.handle_restore_level_archive)
        self.delete_level_archive_button.config(command=self.handle_delete_level_archive)
        self.level_create_add_note_button.config(
            command=lambda: self.add_level_note("create")
        )
        self.level_create_remove_note_button.config(
            command=lambda: self.remove_level_note("create")
        )
        self.level_edit_add_note_button.config(
            command=lambda: self.add_level_note("edit")
        )
        self.level_edit_remove_note_button.config(
            command=lambda: self.remove_level_note("edit")
        )
        self.level_archive_list.bind(
            "<<ListboxSelect>>", self.on_level_archive_select
        )
        self.level_archive_search_var.trace_add(
            "write", self.on_level_archive_filter
        )
        self.update_level_editor_buttons()

    def update_level_editor_buttons(self) -> None:
        if self.level_editor_active:
            self.level_toggle_button.config(bg=MODE_ACTIVE_BG, fg=MODE_ACTIVE_FG)
            self.level_exit_button.config(state="normal")
        else:
            self.level_toggle_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
            self.level_exit_button.config(state="disabled")
        archive_state = "normal" if self.level_editor_active else "disabled"
        self.restore_level_button.config(state=archive_state)
        self.delete_level_archive_button.config(state=archive_state)
        self.apply_level_edit_state()

    def apply_level_edit_state(self) -> None:
        state = "normal" if self.level_editor_active else "disabled"
        for widget in (
            self.level_create_level_entry,
            self.level_create_stat_min_entry,
            self.level_create_stat_max_entry,
            self.level_create_perk_min_entry,
            self.level_create_perk_max_entry,
            self.level_create_notes_list,
            self.level_create_add_note_button,
            self.level_create_remove_note_button,
            self.create_level_button
        ):
            widget.config(state=state)

        edit_state = (
            "normal"
            if self.level_editor_active and self.current_level_id
            else "disabled"
        )
        for widget in (
            self.level_edit_level_entry,
            self.level_edit_stat_min_entry,
            self.level_edit_stat_max_entry,
            self.level_edit_perk_min_entry,
            self.level_edit_perk_max_entry,
            self.level_edit_notes_list,
            self.level_edit_add_note_button,
            self.level_edit_remove_note_button,
            self.update_level_button,
            self.delete_level_button
        ):
            widget.config(state=edit_state)

    def toggle_level_editor(self) -> None:
        if self.level_editor_active:
            return
        self.enter_level_editor()

    def enter_level_editor(self) -> None:
        if self.level_editor_active:
            return
        self.level_editor_active = True
        self.current_level_id = None
        self.refresh_race_levels()
        
        # Hide standard columns EXCEPT Level frame
        self.paned.forget(self.race_frame)
        self.paned.forget(self.variant_frame)
        self.paned.forget(self.detail_frame)
        
        # Add Level Editor columns
        self.paned.add(self.level_create_frame, minsize=300, stretch="always")
        self.paned.add(self.level_edit_frame, minsize=400, stretch="always")
        
        self.level_create_panel.pack(fill="both", expand=True, padx=5, pady=5)
        self.level_edit_container.pack(fill="both", expand=True, padx=5, pady=5)
        
        self.clear_level_form("create")
        self.clear_level_form("edit")
        self.refresh_archived_levels()
        self.render_level_editor_list()
        self.update_level_editor_buttons()

    def exit_level_editor(self) -> None:
        if not self.level_editor_active:
            return
        self.level_editor_active = False
        
        # Hide editor columns
        self.paned.forget(self.level_create_frame)
        self.paned.forget(self.level_edit_frame)
        self.level_create_panel.pack_forget()
        self.level_edit_container.pack_forget()
        
        # Restore standard layout: [Races] [Levels] [Variants] [Details]
        # self.level_frame is currently visible.
        
        # Add races BEFORE levels
        self.paned.add(self.race_frame, before=self.level_frame, minsize=220)
        
        # Add variants and details AFTER levels
        self.paned.add(self.variant_frame, minsize=220) # will append to end
        self.paned.add(self.detail_frame, minsize=260) # will append to end
        
        self.update_level_editor_buttons()
        
        if self.race_state["selected"]:
            selected = next(
                (item for item in self.race_items if item["id"] == self.race_state["selected"]),
                None
            )
            if selected:
                self.select_race(selected)

    def render_level_editor_list(self) -> None:
        def level_label(level: dict) -> str:
            display = level.get("label") or str(level.get("level", ""))
            lines = [f"Level {display}"]
            stat_hint = self.format_stat_budget(level)
            perk_range = level.get("perkRange") or {}
            perk_min = perk_range.get("min")
            perk_max = perk_range.get("max")
            hints = []
            if stat_hint:
                hints.append(f"Stats: {stat_hint}")
            if perk_min is not None or perk_max is not None:
                if perk_min is None:
                    hints.append(f"Perks: 0-{perk_max}")
                elif perk_max is None:
                    hints.append(f"Perks: {perk_min}+")
                else:
                    hints.append(f"Perks: {perk_min}-{perk_max}")
            if hints:
                lines.append(" | ".join(hints))
            return "\n".join(lines)

        levels = sorted(self.race_levels, key=self.level_sort_key)
        level_items = [{"id": level["id"], "level": level} for level in levels]
        self.render_list(
            self.level_inner,
            self.level_state,
            level_items,
            lambda item: level_label(item["level"]),
            lambda item: self.select_level_for_edit(item["level"])
        )
        if self.current_level_id:
            self.level_state["selected"] = self.current_level_id
        else:
            self.level_state["selected"] = None
        self.update_row_styles(self.level_state)

    def select_level_for_edit(self, level: dict) -> None:
        self.level_state["selected"] = level["id"]
        self.update_row_styles(self.level_state)
        self.current_level_id = level["id"]
        label = level.get("label") or str(level.get("level", ""))
        self.level_edit_level_var.set(label)
        stat_range = level.get("statBudgetRange")
        if stat_range:
            self.level_edit_stat_min_var.set(str(stat_range.get("min", "")))
            self.level_edit_stat_max_var.set(str(stat_range.get("max", "")))
        else:
            budget = level.get("statBudget")
            self.level_edit_stat_min_var.set("" if budget is None else str(budget))
            self.level_edit_stat_max_var.set("" if budget is None else str(budget))
        perk_range = level.get("perkRange")
        if perk_range:
            self.level_edit_perk_min_var.set(str(perk_range.get("min", "")))
            self.level_edit_perk_max_var.set(str(perk_range.get("max", "")))
        else:
            self.level_edit_perk_min_var.set("")
            self.level_edit_perk_max_var.set("")
        self.level_edit_notes = list(level.get("notes") or [])
        self.refresh_level_notes("edit")
        self.level_edit_error_var.set("")
        self.apply_level_edit_state()

    def add_level_note(self, mode: str) -> None:
        if mode == "create":
            note = self.level_create_note_var.get().strip()
            if not note:
                return
            self.level_create_notes.append(note)
            self.level_create_note_var.set("")
            self.refresh_level_notes("create")
            return
        note = self.level_edit_note_var.get().strip()
        if not note:
            return
        self.level_edit_notes.append(note)
        self.level_edit_note_var.set("")
        self.refresh_level_notes("edit")

    def remove_level_note(self, mode: str) -> None:
        if mode == "create":
            selection = self.level_create_notes_list.curselection()
            if not selection:
                return
            if not tk.messagebox.askyesno("Remove Note", "Remove selected note?"):
                return
            index = selection[0]
            if 0 <= index < len(self.level_create_notes):
                self.level_create_notes.pop(index)
            self.refresh_level_notes("create")
            return
        selection = self.level_edit_notes_list.curselection()
        if not selection:
            return
        if not tk.messagebox.askyesno("Remove Note", "Remove selected note?"):
                return
        index = selection[0]
        if 0 <= index < len(self.level_edit_notes):
            self.level_edit_notes.pop(index)
        self.refresh_level_notes("edit")

    def refresh_level_notes(self, mode: str) -> None:
        if mode == "create":
            self.level_create_notes_list.delete(0, "end")
            for note in self.level_create_notes:
                self.level_create_notes_list.insert("end", note)
            return
        self.level_edit_notes_list.delete(0, "end")
        for note in self.level_edit_notes:
            self.level_edit_notes_list.insert("end", note)

    def clear_level_form(self, mode: str) -> None:
        if mode == "create":
            self.level_create_level_var.set("")
            self.level_create_stat_min_var.set("")
            self.level_create_stat_max_var.set("")
            self.level_create_perk_min_var.set("")
            self.level_create_perk_max_var.set("")
            self.level_create_note_var.set("")
            self.level_create_notes.clear()
            self.refresh_level_notes("create")
            self.level_create_error_var.set("")
            return
        self.level_edit_level_var.set("")
        self.level_edit_stat_min_var.set("")
        self.level_edit_stat_max_var.set("")
        self.level_edit_perk_min_var.set("")
        self.level_edit_perk_max_var.set("")
        self.level_edit_note_var.set("")
        self.level_edit_notes.clear()
        self.refresh_level_notes("edit")
        self.level_edit_error_var.set("")

    def on_level_archive_filter(self, *_args: object) -> None:
        self.refresh_archived_levels()
        self.on_level_archive_select()

    def on_level_archive_select(self, _event=None) -> None:
        selections = list(self.level_archive_list.curselection())
        if not selections:
            self.level_archive_detail.config(text="")
            return
        details = []
        for index in selections:
            if index >= len(self.level_archive_visible):
                continue
            item = self.level_archive_visible[index]
            refs = item.get("refs") or []
            level = item["level"]
            label = level.get("label") or str(level.get("level", ""))
            if refs:
                details.append(f"{label}: {', '.join(sorted(refs))}")
            else:
                details.append(f"{label}: no variants")
        self.level_archive_detail.config(text="\n".join(details))
