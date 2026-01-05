from ....theme import BUTTON_BG, MODE_ACTIVE_BG, MODE_ACTIVE_FG, TEXT_COLOR


class RaceViewActionCoreMixin:
    def init_actions(self) -> None:
        self.race_id_var.trace_add("write", self.on_race_id_change)
        self.name_lock.config(command=self.handle_name_lock_toggle)

        self.create_race_button.config(command=self.handle_create_race)
        self.edit_race_button.config(command=self.handle_edit_race)
        self.delete_race_button.config(command=self.handle_delete_race)
        self.create_tag_button.config(command=self.handle_create_tag)
        self.edit_tag_button.config(command=self.handle_edit_tag)
        self.delete_tag_button.config(command=self.handle_delete_tag)
        self.restore_race_button.config(command=self.handle_restore_race_archive)
        self.delete_race_archive_button.config(command=self.handle_delete_race_archive)
        self.restore_tag_button.config(command=self.handle_restore_tag_archive)
        self.delete_tag_archive_button.config(command=self.handle_delete_tag_archive)

        self.create_button.config(command=lambda: self.set_editor_mode("create"))
        self.edit_button.config(command=lambda: self.set_editor_mode("edit"))
        self.exit_button.config(command=self.exit_editor_mode)

        self.race_archive_list.bind("<<ListboxSelect>>", self.on_archive_race_select)
        self.race_archive_search_var.trace_add("write", self.on_race_archive_filter)
        self.tag_archive_search_var.trace_add("write", self.on_tag_archive_filter)

        self.update_editor_buttons()

    def update_name_lock(self) -> None:
        if self.race_name_locked.get():
            self.race_name_entry.config(state="disabled")
            if self.editor_mode == "create":
                self.race_name_var.set(self.race_id_var.get().strip().title())
        else:
            self.race_name_entry.config(state="normal")

    def apply_race_edit_state(self) -> None:
        if not self.editor_active:
            self.race_id_entry.config(state="disabled")
            self.race_name_entry.config(state="disabled")
            self.tag_listbox.config(state="disabled")
            self.name_lock.config(state="disabled")
            self.edit_race_button.config(state="disabled")
            self.delete_race_button.config(state="disabled")
            return
        if self.editor_mode == "create":
            self.race_id_entry.config(state="normal")
            self.tag_listbox.config(state="normal")
            self.name_lock.config(state="normal")
            self.update_name_lock()
            self.edit_race_button.config(state="disabled")
            self.delete_race_button.config(state="disabled")
            return
        self.name_lock.config(state="disabled")
        if not self.current_race_id:
            self.race_id_entry.config(state="disabled")
            self.race_name_entry.config(state="disabled")
            self.tag_listbox.config(state="disabled")
            self.edit_race_button.config(state="disabled")
            self.delete_race_button.config(state="disabled")
            return
        self.race_id_entry.config(state="normal")
        self.race_name_entry.config(state="normal")
        self.tag_listbox.config(state="normal")
        self.edit_race_button.config(state="normal")
        self.delete_race_button.config(state="normal")

    def apply_tag_edit_state(self) -> None:
        if not self.editor_active:
            self.tag_id_entry.config(state="disabled")
            self.edit_tag_button.config(state="disabled")
            self.delete_tag_button.config(state="disabled")
            return
        if self.editor_mode == "create":
            self.tag_id_entry.config(state="normal")
            self.edit_tag_button.config(state="disabled")
            self.delete_tag_button.config(state="disabled")
            return
        if not self.current_tag_id:
            self.tag_id_entry.config(state="disabled")
            self.edit_tag_button.config(state="disabled")
            self.delete_tag_button.config(state="disabled")
            return
        self.tag_id_entry.config(state="normal")
        self.edit_tag_button.config(state="normal")
        self.delete_tag_button.config(state="normal")

    def on_race_id_change(self, *_args: object) -> None:
        if self.race_name_locked.get() and self.editor_mode == "create":
            self.race_name_var.set(self.race_id_var.get().strip().title())

    def handle_name_lock_toggle(self) -> None:
        self.update_name_lock()
        self.apply_race_edit_state()

    def update_editor_buttons(self) -> None:
        if self.editor_active:
            if self.editor_mode == "create":
                self.create_race_button.pack(side="left")
                self.edit_race_button.pack_forget()
                self.delete_race_button.pack_forget()
                self.create_tag_button.pack(side="left")
                self.edit_tag_button.pack_forget()
                self.delete_tag_button.pack_forget()
            else:
                self.create_race_button.pack_forget()
                self.edit_race_button.pack(side="left")
                self.delete_race_button.pack(side="left", padx=(12, 0))
                self.create_tag_button.pack_forget()
                self.edit_tag_button.pack(side="left")
                self.delete_tag_button.pack(side="left", padx=(12, 0))
        else:
            self.create_race_button.pack_forget()
            self.edit_race_button.pack_forget()
            self.delete_race_button.pack_forget()
            self.create_tag_button.pack_forget()
            self.edit_tag_button.pack_forget()
            self.delete_tag_button.pack_forget()

        self.exit_button.config(state="normal" if self.editor_active else "disabled")
        self._update_mode_button_styles()
        state = "normal" if self.editor_active else "disabled"
        self.restore_race_button.config(state=state)
        self.delete_race_archive_button.config(state=state)
        self.restore_tag_button.config(state=state)
        self.delete_tag_archive_button.config(state=state)
        self.apply_race_edit_state()
        self.apply_tag_edit_state()

    def enter_editor_mode(self, mode: str) -> None:
        if self.editor_active:
            return
        self.editor_mode = mode
        self.current_race_id = None
        self.current_tag_id = None
        self.race_id_var.set("")
        self.race_name_var.set("")
        self.tag_id_var.set("")
        self.tag_listbox.selection_clear(0, "end")
        self.race_error_var.set("")
        self.tag_error_var.set("")
        self.paned.forget(self.level_frame)
        self.paned.forget(self.variant_frame)
        self.paned.forget(self.detail_frame)
        self.paned.add(self.editor_container, minsize=520)
        self.editor_active = True
        self.update_editor_buttons()

    def exit_editor_mode(self) -> None:
        if not self.editor_active:
            return
        self.paned.forget(self.editor_container)
        self.paned.add(self.level_frame, minsize=170)
        self.paned.add(self.variant_frame, minsize=220)
        self.paned.add(self.detail_frame, minsize=260)
        self.editor_active = False
        self.update_editor_buttons()
        self.on_filter_change()

    def set_editor_mode(self, mode: str) -> None:
        if not self.editor_active:
            self.enter_editor_mode(mode)
            return
        if mode == self.editor_mode:
            return
        self.editor_mode = mode
        self.update_editor_buttons()

    def _update_mode_button_styles(self) -> None:
        if self.editor_active and self.editor_mode == "create":
            self.create_button.config(bg=MODE_ACTIVE_BG, fg=MODE_ACTIVE_FG)
            self.edit_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
        elif self.editor_active and self.editor_mode == "edit":
            self.edit_button.config(bg=MODE_ACTIVE_BG, fg=MODE_ACTIVE_FG)
            self.create_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
        else:
            self.create_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
            self.edit_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
