import re
import tkinter as tk
from tkinter import messagebox

from game_io.races import parse_races, save_race


class RaceViewRaceActionMixin:
    def handle_create_race(self) -> None:
        if self.races_root is None:
            self.race_error_var.set("Race folder not set.")
            return
        raw_id = self.race_id_var.get().strip()
        if not raw_id:
            self.race_error_var.set("Race id is required.")
            return
        race_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", race_id):
            self.race_error_var.set("Id must be letters, numbers, underscores.")
            return
        existing_ids = {race["id"] for race in self.races_data}
        if race_id in existing_ids:
            self.race_error_var.set("Race id already exists.")
            return
        name = self.race_name_var.get().strip() or race_id
        selected_tags = [
            self.race_tag_options[index]["id"]
            for index in self.tag_listbox.curselection()
        ]
        save_race(self.races_root, race_id, name, selected_tags)
        self.race_error_var.set("Saved.")
        self.race_id_var.set("")
        self.race_name_var.set("")
        if self.races_root:
            self.races_data[:] = parse_races(self.races_root)
        self.refresh_race_items()
        self.on_filter_change()

    def select_race_for_edit(self, race_item: dict) -> None:
        race = race_item["race"]
        self.current_race_id = race["id"]
        self.race_id_var.set(race["id"])
        self.race_name_var.set(race["name"])
        self.tag_listbox.selection_clear(0, "end")
        for index, tag in enumerate(self.race_tag_options):
            if tag["id"] in race.get("tagIds", []):
                self.tag_listbox.selection_set(index)
        self.apply_race_edit_state()

    def handle_edit_race(self) -> None:
        if self.editor_mode != "edit":
            return
        if not self.current_race_id:
            self.race_error_var.set("Select a race to edit.")
            return
        if self.races_root is None:
            self.race_error_var.set("Race folder not set.")
            return
        raw_id = self.race_id_var.get().strip()
        if not raw_id:
            self.race_error_var.set("Race id is required.")
            return
        race_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", race_id):
            self.race_error_var.set("Id must be letters, numbers, underscores.")
            return
        existing_ids = {race["id"] for race in self.races_data}
        if race_id in existing_ids and race_id != self.current_race_id:
            self.race_error_var.set("Race id already exists.")
            return
        name = self.race_name_var.get().strip() or race_id
        selected_tags = [
            self.race_tag_options[index]["id"]
            for index in self.tag_listbox.curselection()
        ]
        old_path = self.races_root / f"{self.current_race_id}.js"
        new_path = self.races_root / f"{race_id}.js"
        if old_path.exists() and old_path != new_path:
            old_path.rename(new_path)
        save_race(self.races_root, race_id, name, selected_tags)
        if race_id != self.current_race_id:
            for variant in self.race_variants:
                if variant.get("raceId") == self.current_race_id:
                    variant["raceId"] = race_id
        self.races_data[:] = parse_races(self.races_root)
        self.refresh_race_items()
        self.on_filter_change()
        self.current_race_id = race_id
        self.race_error_var.set("Saved.")

    def handle_delete_race(self) -> None:
        if self.editor_mode != "edit":
            return
        if not self.current_race_id:
            self.race_error_var.set("Select a race to archive.")
            return
        if self.races_root is None or self.race_archive_root is None:
            self.race_error_var.set("Race archive folder not set.")
            return
        race_id = self.current_race_id
        race_path = self.races_root / f"{race_id}.js"
        if race_path.exists():
            self.race_archive_root.mkdir(parents=True, exist_ok=True)
            archive_path = self.race_archive_root / f"{race_id}.js"
            if archive_path.exists():
                self.race_error_var.set("Archived race already exists.")
                return
            race_path.rename(archive_path)
        self.races_data[:] = parse_races(self.races_root)
        self.refresh_race_items()
        self.refresh_archived_races()
        self.on_filter_change()
        self.current_race_id = None
        self.race_id_var.set("")
        self.race_name_var.set("")
        self.race_error_var.set("Archived.")
        self.apply_race_edit_state()

    def restore_missing_race(self, race_id: str) -> None:
        if not self.race_archive_root or not self.races_root:
            self.race_error_var.set("Race archive folder not set.")
            return
        src = self.race_archive_root / f"{race_id}.js"
        dst = self.races_root / f"{race_id}.js"
        if not src.exists():
            self.race_error_var.set("Archived race not found.")
            return
        if dst.exists():
            self.race_error_var.set("Race id already exists.")
            return
        src.rename(dst)
        self.races_data[:] = parse_races(self.races_root)
        self.refresh_race_items()
        self.refresh_archived_races()
        self.on_filter_change()
        self.race_error_var.set("")

    def _replace_race_references(self, old_id: str, new_id: str) -> None:
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
                    rf'''raceId\\s*:\\s*["']{re.escape(old_id)}["']''',
                    f'''raceId: "{new_id}"''',
                    text
                )
                if updated != text:
                    file_path.write_text(updated, encoding="utf-8")
        for variant in self.race_variants:
            if variant.get("raceId") == old_id:
                variant["raceId"] = new_id

    def replace_missing_race(self, race_id: str) -> None:
        if not self.races_root or not self.races_data:
            self.race_error_var.set("No races available.")
            return

        selector = tk.Toplevel(self.parent)
        selector.title("Replace missing race")
        selector.geometry("320x360")
        tk.Label(selector, text=f"Select replacement for '{race_id}'").pack(
            anchor="w", padx=12, pady=(12, 6)
        )
        listbox = tk.Listbox(selector, exportselection=False)
        listbox.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        
        available_races = [r for r in self.races_data if r.get("id") != race_id]
        for race in available_races:
            listbox.insert("end", f'{race["name"]} ({race["id"]})')

        def apply_replacement() -> None:
            selection = listbox.curselection()
            if not selection:
                return
            replacement_id = available_races[selection[0]]["id"]
            self._replace_race_references(race_id, replacement_id)
            self.rebuild_variants_index()
            self.refresh_race_items()
            self.on_filter_change()
            self.race_error_var.set(f"Replaced {race_id} with {replacement_id}.")
            selector.destroy()

        tk.Button(selector, text="Replace", command=apply_replacement).pack(
            pady=(0, 12)
        )

    def handle_restore_race_archive(self) -> None:
        if not self.race_archive_root or not self.races_root:
            self.race_error_var.set("Race archive folder not set.")
            return
        selections = list(self.race_archive_list.curselection())
        if not selections:
            self.race_error_var.set("Select archived races to restore.")
            return
        self.race_error_var.set("")
        for index in selections:
            if index >= len(self.race_archive_visible):
                continue
            race = self.race_archive_visible[index]
            src = self.race_archive_root / f'{race["id"]}.js'
            dst = self.races_root / f'{race["id"]}.js'
            if dst.exists():
                self.race_error_var.set(f"Race id exists: {race['id']}.")
                continue
            if src.exists():
                src.rename(dst)
        self.races_data[:] = parse_races(self.races_root)
        self.refresh_race_items()
        self.refresh_archived_races()
        self.on_filter_change()

    def _show_replace_and_delete_dialog(self, race_to_delete: dict) -> None:
        dialog = tk.Toplevel(self.parent)
        dialog.title("Replace and Delete Race")
        dialog.geometry("380x400")

        race_id = race_to_delete["id"]
        refs_count = len(race_to_delete.get("refs", []))
        
        label_text = (
            f"Race '{race_id}' is used by {refs_count} variants.\n"
            "Select a replacement to delete it."
        )
        tk.Label(dialog, text=label_text, justify="left").pack(anchor="w", padx=12, pady=12)

        listbox = tk.Listbox(dialog, exportselection=False)
        listbox.pack(fill="both", expand=True, padx=12, pady=0)

        available_races = [r for r in self.races_data if r.get("id") != race_id]
        for race in available_races:
            listbox.insert("end", f'{race["name"]} ({race["id"]})')

        def apply_and_delete():
            selection = listbox.curselection()
            if not selection:
                messagebox.showwarning("No Selection", "Please select a replacement race.", parent=dialog)
                return

            replacement_id = available_races[selection[0]]["id"]
            
            # Replace references
            self._replace_race_references(race_id, replacement_id)

            # Delete the archived file
            src = self.race_archive_root / f"{race_id}.js"
            if src.exists():
                src.unlink()
            
            self.rebuild_variants_index()
            self.refresh_archived_races()
            self.refresh_race_items()
            self.on_filter_change()

            messagebox.showinfo("Success", f"Replaced all references to '{race_id}' with '{replacement_id}' and deleted it from archive.", parent=self.parent)
            dialog.destroy()

        button_frame = tk.Frame(dialog)
        button_frame.pack(pady=12)
        tk.Button(button_frame, text="Replace and Delete", command=apply_and_delete).pack(side="left", padx=6)
        tk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side="left", padx=6)

    def handle_delete_race_archive(self) -> None:
        if not self.race_archive_root:
            self.race_error_var.set("Race archive folder not set.")
            return

        selections = list(self.race_archive_list.curselection())
        if not selections:
            self.race_error_var.set("Select archived races to delete.")
            return

        if len(selections) > 1:
            races_with_refs = []
            for index in selections:
                if index < len(self.race_archive_visible):
                    race = self.race_archive_visible[index]
                    if race.get("refs"):
                        races_with_refs.append(race["id"])
            if races_with_refs:
                messagebox.showwarning(
                    "Deletion Blocked",
                    f"Cannot delete multiple items when some have references.\n"
                    f"Referenced races: {', '.join(races_with_refs)}\n\n"
                    "Please handle these one by one."
                )
                return
        
        if not messagebox.askyesno("Confirm Deletion", f"Permanently delete {len(selections)} selected race(s) from the archive?"):
            return

        # Handle a single selection that might have references
        if len(selections) == 1:
            race = self.race_archive_visible[selections[0]]
            if race.get("refs"):
                self._show_replace_and_delete_dialog(race)
                return # The dialog will handle the rest

        # Handle items without any references
        deleted_count = 0
        for index in selections:
            if index >= len(self.race_archive_visible):
                continue
            race = self.race_archive_visible[index]
            if not race.get("refs"):
                src = self.race_archive_root / f"{race['id']}.js"
                if src.exists():
                    src.unlink()
                    deleted_count += 1
        
        if deleted_count > 0:
            self.race_error_var.set(f"Deleted {deleted_count} race(s).")
            self.refresh_archived_races()
            self.on_filter_change()
