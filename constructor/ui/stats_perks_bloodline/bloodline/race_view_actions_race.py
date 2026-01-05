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

    def replace_missing_race(self, race_id: str) -> None:
        if not self.races_root or not self.races_data:
            self.race_error_var.set("No races available.")
            return
        selector = tk.Toplevel(self.parent)
        selector.title("Replace missing race")
        selector.geometry("320x360")
        tk.Label(selector, text="Select replacement race").pack(
            anchor="w", padx=12, pady=(12, 6)
        )
        listbox = tk.Listbox(selector, exportselection=False)
        listbox.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        for race in self.races_data:
            listbox.insert("end", f"{race['name']} ({race['id']})")

        def apply_replacement() -> None:
            selection = listbox.curselection()
            if not selection:
                return
            replacement = self.races_data[selection[0]]["id"]
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
                        rf"raceId\\s*:\\s*\"{re.escape(race_id)}\"",
                        f"raceId: \"{replacement}\"",
                        text
                    )
                    if updated != text:
                        file_path.write_text(updated, encoding="utf-8")
            for variant in self.race_variants:
                if variant.get("raceId") == race_id:
                    variant["raceId"] = replacement
            self.rebuild_variants_index()
            self.refresh_race_items()
            self.on_filter_change()
            self.race_error_var.set("")
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
            src = self.race_archive_root / f"{race['id']}.js"
            dst = self.races_root / f"{race['id']}.js"
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
        if not self.race_archive_root or not self.races_root:
            self.race_error_var.set("Race archive folder not set.")
            return
        selections = list(self.race_archive_list.curselection())
        if not selections:
            self.race_error_var.set("Select archived races to delete.")
            return
        if not messagebox.askyesno(
            "Delete archived races",
            "Delete selected races from archive?"
        ):
            return
        for index in selections:
            if index >= len(self.race_archive_visible):
                continue
            race = self.race_archive_visible[index]
            if race.get("refs"):
                messagebox.showinfo(
                    "Race in use",
                    f"Race '{race['id']}' is still referenced. Restore or replace."
                )
                continue
            src = self.race_archive_root / f"{race['id']}.js"
            if src.exists():
                src.unlink()
            if self.races_root.parent.exists():
                variants_root = self.races_root.parent
                for file_path in variants_root.rglob("*.js"):
                    parts = file_path.relative_to(variants_root).parts
                    if "races" in parts or "levels" in parts:
                        continue
                    if file_path.name == "index.js":
                        continue
                    text = file_path.read_text(encoding="utf-8")
                    updated = re.sub(
                        rf"raceId\\s*:\\s*\"{re.escape(race['id'])}\"",
                        "raceId: \"unknown\"",
                        text
                    )
                    if updated != text:
                        file_path.write_text(updated, encoding="utf-8")
            for variant in self.race_variants:
                if variant.get("raceId") == race["id"]:
                    variant["raceId"] = "unknown"
        self.rebuild_variants_index()
        self.refresh_archived_races()
        self.refresh_race_items()
        self.on_filter_change()
