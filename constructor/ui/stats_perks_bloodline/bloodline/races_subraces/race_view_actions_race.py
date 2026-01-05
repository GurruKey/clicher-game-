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
        new_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", new_id):
            self.race_error_var.set("Id must be letters, numbers, underscores.")
            return

        if new_id == self.current_race_id:
            # If ID hasn't changed, just save other data
            name = self.race_name_var.get().strip() or new_id
            selected_tags = [
                self.race_tag_options[index]["id"]
                for index in self.tag_listbox.curselection()
            ]
            save_race(self.races_root, new_id, name, selected_tags)
            self.race_error_var.set("Saved.")
            return

        existing_ids = {race["id"] for race in self.races_data}
        if new_id in existing_ids:
            self.race_error_var.set("Race id already exists.")
            return
        
        # Correctly update references on disk before renaming file
        self._replace_race_references(self.current_race_id, new_id)
        
        # Rename the race file
        old_path = self.races_root / f"{self.current_race_id}.js"
        new_path = self.races_root / f"{new_id}.js"
        if old_path.exists():
            old_path.rename(new_path)

        # Save the content to the new file
        name = self.race_name_var.get().strip() or new_id
        selected_tags = [
            self.race_tag_options[index]["id"]
            for index in self.tag_listbox.curselection()
        ]
        save_race(self.races_root, new_id, name, selected_tags)
        
        # Refresh all data sources
        self.races_data[:] = parse_races(self.races_root)
        self.rebuild_variants_index()
        self.refresh_race_items()
        self.on_filter_change()
        self.current_race_id = new_id
        self.race_error_var.set("Saved and updated references.")

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
        if not variants_root:
            return
            
        for file_path in variants_root.rglob("*.js"):
            parts = file_path.relative_to(variants_root).parts
            if "races" in parts or "levels" in parts or file_path.name == "index.js":
                continue
            
            try:
                text = file_path.read_text(encoding="utf-8")
                updated = re.sub(
                    rf'raceId\s*:\s*["\']{re.escape(old_id)}["\']',
                    f'raceId: "{new_id}"',
                    text
                )
                if updated != text:
                    file_path.write_text(updated, encoding="utf-8")
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")

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
    
    def handle_delete_race_archive(self) -> None:
        if not self.race_archive_root:
            self.race_error_var.set("Race archive folder not set.")
            return
        
        selections = list(self.race_archive_list.curselection())
        if not selections:
            self.race_error_var.set("Select archived races to delete.")
            return

        to_delete = [self.race_archive_visible[i] for i in selections]
        in_use = [item for item in to_delete if item.get("refs")]

        if in_use:
            if not self.races_data:
                messagebox.showinfo(
                    "Cannot Delete Race",
                    "The selected race(s) are in use, but no active races are available to use as a replacement."
                )
                return

            selector = tk.Toplevel(self.parent)
            selector.title("Replace and Delete Race")
            selector.geometry("400x400")
            
            in_use_labels = ", ".join(f"'{item['id']}'" for item in in_use)
            tk.Label(selector, text=f"Races {in_use_labels} are in use. Select a replacement:", wraplength=380).pack(padx=12, pady=6)
            
            listbox = tk.Listbox(selector, exportselection=False)
            listbox.pack(fill="both", expand=True, padx=12, pady=6)
            
            # Use self.races_data which contains full race objects from the main folder
            available_races = sorted(self.races_data, key=lambda r: r.get("name", ""))
            for race in available_races:
                listbox.insert("end", f'{race["name"]} ({race["id"]})')

            def apply_replace_and_delete() -> None:
                selection = listbox.curselection()
                if not selection:
                    return
                
                replacement_race = available_races[selection[0]]
                replacement_id = replacement_race["id"]
                
                # Replace references for all races that were in use
                for item in in_use:
                    old_id = item["id"]
                    if old_id != replacement_id:
                        self._replace_race_references(old_id, replacement_id)
                
                # Now delete all selected files from archive
                for item in to_delete:
                    src = self.race_archive_root / f"{item['id']}.js"
                    if src.exists():
                        src.unlink()
                
                self.rebuild_variants_index()
                self.refresh_race_items()
                self.refresh_archived_races()
                self.on_filter_change()
                self.race_error_var.set("Deleted and replaced references.")
                selector.destroy()

            tk.Button(selector, text="Replace and Delete", command=apply_replace_and_delete).pack(pady=12)

        else:  # Not in use
            if not messagebox.askyesno(
                "Delete archived races",
                f"Permanently delete {len(to_delete)} selected race(s) from archive?"
            ):
                return
            
            for item in to_delete:
                src = self.race_archive_root / f"{item['id']}.js"
                if src.exists():
                    src.unlink()
            
            self.refresh_archived_races()
            self.race_error_var.set(f"Deleted {len(to_delete)} race(s).")
