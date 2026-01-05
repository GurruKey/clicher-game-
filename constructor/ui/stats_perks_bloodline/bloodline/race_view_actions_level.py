import re
import tkinter as tk
from tkinter import messagebox

from game_io.race_levels import delete_race_level, parse_race_levels, save_race_level

from ...theme import BUTTON_BG, MODE_ACTIVE_BG, MODE_ACTIVE_FG, TEXT_COLOR


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
        self.variant_title.pack_forget()
        self.variant_canvas.pack_forget()
        self.variant_scrollbar.pack_forget()
        self.detail_title.pack_forget()
        self.detail_text.pack_forget()
        self.level_create_panel.pack(fill="both", expand=True, pady=(8, 0))
        self.level_edit_container.pack(fill="both", expand=True, pady=(8, 0))
        self.clear_level_form("create")
        self.clear_level_form("edit")
        self.refresh_archived_levels()
        self.render_level_editor_list()
        self.update_level_editor_buttons()

    def exit_level_editor(self) -> None:
        if not self.level_editor_active:
            return
        self.level_editor_active = False
        self.level_create_panel.pack_forget()
        self.level_edit_container.pack_forget()
        self.variant_title.pack(anchor="nw")
        self.variant_canvas.pack(side="left", fill="both", expand=True, pady=(8, 0))
        self.variant_scrollbar.pack(side="right", fill="y", pady=(8, 0))
        self.detail_title.pack(anchor="nw")
        self.detail_text.pack(anchor="nw", pady=(12, 0))
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

    def handle_create_level(self) -> None:
        if not self.race_levels_root:
            self.level_create_error_var.set("Levels folder missing.")
            return
        parsed = self.parse_level_input(
            self.level_create_level_var.get(),
            self.level_create_error_var,
            ignore_level_id=None
        )
        if not parsed:
            return
        level_number, suffix, level_id, label = parsed
        stat_range = self.parse_range(
            self.level_create_stat_min_var.get(),
            self.level_create_stat_max_var.get(),
            "Stats Range",
            self.level_create_error_var
        )
        if stat_range is None:
            return
        perk_range = self.parse_range(
            self.level_create_perk_min_var.get(),
            self.level_create_perk_max_var.get(),
            "Perks Range",
            self.level_create_error_var
        )
        if perk_range is None:
            return
        level_data = {
            "id": level_id,
            "level": level_number,
            "label": label,
            "statBudgetRange": stat_range,
            "perkRange": perk_range,
            "notes": list(self.level_create_notes)
        }
        save_race_level(self.race_levels_root, level_data)
        self.refresh_race_levels()
        self.clear_level_form("create")
        self.render_level_editor_list()
        self.level_create_error_var.set("Saved.")

    def handle_update_level(self) -> None:
        if not self.race_levels_root or not self.current_level_id:
            self.level_edit_error_var.set("Select a level first.")
            return
        parsed = self.parse_level_input(
            self.level_edit_level_var.get(),
            self.level_edit_error_var,
            ignore_level_id=self.current_level_id
        )
        if not parsed:
            return
        level_number, suffix, level_id, label = parsed
        stat_range = self.parse_range(
            self.level_edit_stat_min_var.get(),
            self.level_edit_stat_max_var.get(),
            "Stats Range",
            self.level_edit_error_var
        )
        if stat_range is None:
            return
        perk_range = self.parse_range(
            self.level_edit_perk_min_var.get(),
            self.level_edit_perk_max_var.get(),
            "Perks Range",
            self.level_edit_error_var
        )
        if perk_range is None:
            return
        level_data = {
            "id": level_id,
            "level": level_number,
            "label": label,
            "statBudgetRange": stat_range,
            "perkRange": perk_range,
            "notes": list(self.level_edit_notes)
        }
        save_race_level(self.race_levels_root, level_data)
        if level_id != self.current_level_id:
            delete_race_level(self.race_levels_root, self.current_level_id)
        self.current_level_id = level_id
        self.refresh_race_levels()
        self.render_level_editor_list()
        self.level_edit_error_var.set("Saved.")
        self.apply_level_edit_state()

    def handle_delete_level(self) -> None:
        if not self.race_levels_root or not self.current_level_id:
            return
        archive_root = self.race_levels_root / "archive"
        archive_root.mkdir(parents=True, exist_ok=True)
        src = self.race_levels_root / f"{self.current_level_id}.js"
        dst = archive_root / f"{self.current_level_id}.js"
        if dst.exists():
            self.level_edit_error_var.set("Archived level already exists.")
            return
        if src.exists():
            src.rename(dst)
        self.current_level_id = None
        self.refresh_race_levels()
        self.refresh_archived_levels()
        self.clear_level_form("edit")
        self.render_level_editor_list()
        self.level_edit_error_var.set("Archived.")
        self.apply_level_edit_state()

    def parse_level_input(
        self,
        value: str,
        error_var,
        ignore_level_id: str | None
    ) -> tuple[int, str | None, str, str | None] | None:
        text = value.strip()
        match = re.fullmatch(r"(\d+)([+-]?)", text)
        if not match:
            error_var.set("Level must be a number (optional + or -).")
            return None
        level_number = int(match.group(1))
        suffix = match.group(2) or None
        level_id = self.build_level_id(level_number, suffix)
        label = f"{level_number}{suffix}" if suffix else None
        for level in self.race_levels:
            if ignore_level_id and level["id"] == ignore_level_id:
                continue
            if level.get("level") == level_number:
                if self.get_level_suffix(level) == suffix:
                    error_var.set("Level already exists.")
                    return None
        error_var.set("")
        return level_number, suffix, level_id, label

    def build_level_id(self, level_number: int, suffix: str | None) -> str:
        suffix_map = {"+": "plus", "-": "minus"}
        if suffix in suffix_map:
            return f"level_{level_number}_{suffix_map[suffix]}"
        return f"level_{level_number}"

    def parse_range(
        self,
        min_text: str,
        max_text: str,
        label: str,
        error_var
    ) -> dict | None:
        min_text = min_text.strip()
        max_text = max_text.strip()
        if not min_text or not max_text:
            error_var.set(f"{label} requires min and max.")
            return None
        if not min_text.isdigit() or not max_text.isdigit():
            error_var.set(f"{label} must be numbers.")
            return None
        min_val = int(min_text)
        max_val = int(max_text)
        if min_val > max_val:
            error_var.set(f"{label} min must be <= max.")
            return None
        return {"min": min_val, "max": max_val}

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
            if not messagebox.askyesno("Remove Note", "Remove selected note?"):
                return
            index = selection[0]
            if 0 <= index < len(self.level_create_notes):
                self.level_create_notes.pop(index)
            self.refresh_level_notes("create")
            return
        selection = self.level_edit_notes_list.curselection()
        if not selection:
            return
        if not messagebox.askyesno("Remove Note", "Remove selected note?"):
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

    def refresh_archived_levels(self) -> None:
        self.archived_levels_data = []
        if self.race_levels_root:
            archive_root = self.race_levels_root / "archive"
            if archive_root.exists():
                self.archived_levels_data = list(parse_race_levels(archive_root))
        variant_refs: dict[int, list[str]] = {}
        for variant in self.race_variants:
            level = variant.get("level")
            if level is None:
                continue
            variant_refs.setdefault(int(level), []).append(variant.get("id"))
        self.level_archive_items = []
        for level in self.archived_levels_data:
            display = level.get("label") or str(level.get("level", ""))
            level_id = level["id"]
            if display.strip().lower() == level_id.strip().lower():
                label_base = display
            else:
                label_base = f"{display} [{level_id}]"
            refs = variant_refs.get(int(level.get("level", 0)), [])
            count_text = f" [{len(refs)}]" if refs else ""
            stat_hint = self.format_stat_budget(level) or "?"
            perk_range = level.get("perkRange") or {}
            perk_min = perk_range.get("min")
            perk_max = perk_range.get("max")
            if perk_min is None and perk_max is None:
                perk_hint = "?"
            elif perk_min is None:
                perk_hint = f"0-{perk_max}"
            elif perk_max is None:
                perk_hint = f"{perk_min}+"
            else:
                perk_hint = f"{perk_min}-{perk_max}"
            self.level_archive_items.append(
                {
                    "id": level_id,
                    "label": (
                        f"Level {label_base}{count_text} | "
                        f"Stats: {stat_hint} | Perks: {perk_hint}"
                    ),
                    "level": level,
                    "refs": refs
                }
            )
        query = self.level_archive_search_var.get().strip().lower()
        self.level_archive_visible = [
            item
            for item in self.level_archive_items
            if not query or query in item["label"].lower()
        ]
        self.level_archive_list.delete(0, "end")
        for item in self.level_archive_visible:
            self.level_archive_list.insert("end", item["label"])
        self.level_archive_detail.config(text="")

    def restore_missing_level(self, level_number: int) -> None:
        if not self.race_levels_root:
            self.level_edit_error_var.set("Levels folder missing.")
            return
        self.refresh_archived_levels()
        archive_root = self.race_levels_root / "archive"
        if not archive_root.exists():
            self.level_edit_error_var.set("Level archive not found.")
            return
        archived = [
            level
            for level in self.archived_levels_data
            if int(level.get("level", 0)) == int(level_number)
        ]
        if not archived:
            self.level_edit_error_var.set("Archived level not found.")
            return
        if len(archived) == 1:
            level = archived[0]
            src = archive_root / f"{level['id']}.js"
            dst = self.race_levels_root / f"{level['id']}.js"
            if dst.exists():
                self.level_edit_error_var.set("Level id already exists.")
                return
            if src.exists():
                src.rename(dst)
            self.refresh_race_levels()
            self.refresh_archived_levels()
            self.render_level_editor_list()
            self.level_edit_error_var.set("")
            return
        selector = tk.Toplevel(self.parent)
        selector.title("Restore level")
        selector.geometry("320x360")
        tk.Label(selector, text="Select level to restore").pack(
            anchor="w", padx=12, pady=(12, 6)
        )
        listbox = tk.Listbox(selector, exportselection=False)
        listbox.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        for level in archived:
            label = level.get("label") or str(level.get("level", ""))
            listbox.insert("end", f"{label} ({level['id']})")

        def apply_restore() -> None:
            selection = listbox.curselection()
            if not selection:
                return
            level = archived[selection[0]]
            src = archive_root / f"{level['id']}.js"
            dst = self.race_levels_root / f"{level['id']}.js"
            if dst.exists():
                self.level_edit_error_var.set("Level id already exists.")
                return
            if src.exists():
                src.rename(dst)
            self.refresh_race_levels()
            self.refresh_archived_levels()
            self.render_level_editor_list()
            self.level_edit_error_var.set("")
            selector.destroy()

        tk.Button(selector, text="Restore", command=apply_restore).pack(
            pady=(0, 12)
        )

    def replace_missing_level(self, level_number: int) -> None:
        if not self.race_levels_root or not self.race_levels:
            self.level_edit_error_var.set("No levels available.")
            return
        selector = tk.Toplevel(self.parent)
        selector.title("Replace missing level")
        selector.geometry("320x360")
        tk.Label(selector, text="Select replacement level").pack(
            anchor="w", padx=12, pady=(12, 6)
        )
        listbox = tk.Listbox(selector, exportselection=False)
        listbox.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        sorted_levels = sorted(self.race_levels, key=self.level_sort_key)
        for level in sorted_levels:
            label = level.get("label") or str(level.get("level", ""))
            listbox.insert("end", f"{label} ({level['id']})")

        def apply_replace() -> None:
            selection = listbox.curselection()
            if not selection:
                return
            replacement = sorted_levels[selection[0]]
            new_level_number = int(replacement.get("level", level_number))
            variants_root = self.races_root.parent if self.races_root else None
            if variants_root:
                for file_path in variants_root.rglob("*.js"):
                    parts = file_path.relative_to(variants_root).parts
                    if "races" in parts or "levels" in parts:
                        continue
                    if file_path.name == "index.js":
                        continue
                    text = file_path.read_text(encoding="utf-8")
                    updated = re.sub(
                        rf"level\\s*:\\s*{re.escape(str(level_number))}",
                        f"level: {new_level_number}",
                        text
                    )
                    if updated != text:
                        file_path.write_text(updated, encoding="utf-8")
            for variant in self.race_variants:
                if int(variant.get("level", 0)) == int(level_number):
                    variant["level"] = new_level_number
            self.rebuild_variants_index()
            self.refresh_race_items()
            self.on_filter_change()
            self.level_edit_error_var.set("")
            selector.destroy()

        tk.Button(selector, text="Replace", command=apply_replace).pack(
            pady=(0, 12)
        )

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

    def handle_restore_level_archive(self) -> None:
        if not self.race_levels_root:
            self.level_edit_error_var.set("Levels folder missing.")
            return
        selections = list(self.level_archive_list.curselection())
        if not selections:
            self.level_edit_error_var.set("Select archived levels to restore.")
            return
        archive_root = self.race_levels_root / "archive"
        for index in selections:
            if index >= len(self.level_archive_visible):
                continue
            entry = self.level_archive_visible[index]
            level = entry["level"]
            src = archive_root / f"{level['id']}.js"
            dst = self.race_levels_root / f"{level['id']}.js"
            if dst.exists():
                self.level_edit_error_var.set(f"Level id exists: {level['id']}.")
                continue
            if src.exists():
                src.rename(dst)
        self.refresh_race_levels()
        self.refresh_archived_levels()
        self.render_level_editor_list()
        self.level_edit_error_var.set("")

    def handle_delete_level_archive(self) -> None:
        if not self.race_levels_root:
            self.level_edit_error_var.set("Levels folder missing.")
            return
        selections = list(self.level_archive_list.curselection())
        if not selections:
            self.level_edit_error_var.set("Select archived levels to delete.")
            return
        if not messagebox.askyesno(
            "Delete archived levels",
            "Delete selected levels from archive?"
        ):
            return
        archive_root = self.race_levels_root / "archive"
        for index in selections:
            if index >= len(self.level_archive_visible):
                continue
            entry = self.level_archive_visible[index]
            if entry.get("refs"):
                messagebox.showinfo(
                    "Level in use",
                    "Level is still referenced. Restore or replace."
                )
                continue
            level = entry["level"]
            src = archive_root / f"{level['id']}.js"
            if src.exists():
                src.unlink()
        self.refresh_archived_levels()
