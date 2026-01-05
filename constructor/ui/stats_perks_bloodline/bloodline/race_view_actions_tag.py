import re
from tkinter import messagebox

from game_io.race_tags import parse_race_tags, save_race_tag
from game_io.races import parse_races, save_race


class RaceViewTagActionMixin:
    def handle_create_tag(self) -> None:
        if self.race_tags_root is None:
            self.tag_error_var.set("Tag folder not set.")
            return
        raw_id = self.tag_id_var.get().strip()
        if not raw_id:
            self.tag_error_var.set("Tag id is required.")
            return
        tag_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", tag_id):
            self.tag_error_var.set("Id must be letters, numbers, underscores.")
            return
        existing_ids = {tag["id"] for tag in self.race_tags_data}
        if tag_id in existing_ids:
            self.tag_error_var.set("Tag id already exists.")
            return
        save_race_tag(self.race_tags_root, tag_id, raw_id)
        self.tag_error_var.set("Saved.")
        self.tag_id_var.set("")
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        if self.races_root is not None:
            self.races_data[:] = parse_races(self.races_root)
            self.refresh_race_items()
            self.on_filter_change()

    def select_tag_for_edit(self, tag_item: dict) -> None:
        self.current_tag_id = tag_item["id"]
        self.tag_id_var.set(tag_item["id"])
        self.apply_tag_edit_state()

    def handle_edit_tag(self) -> None:
        if self.editor_mode != "edit":
            return
        if not self.current_tag_id:
            self.tag_error_var.set("Select a tag to edit.")
            return
        if self.race_tags_root is None:
            self.tag_error_var.set("Tag folder not set.")
            return
        raw_id = self.tag_id_var.get().strip()
        if not raw_id:
            self.tag_error_var.set("Tag id is required.")
            return
        new_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", new_id):
            self.tag_error_var.set("Id must be letters, numbers, underscores.")
            return
        existing_ids = {tag["id"] for tag in self.race_tags_data}
        if new_id in existing_ids and new_id != self.current_tag_id:
            self.tag_error_var.set("Tag id already exists.")
            return
        old_path = self.race_tags_root / f"{self.current_tag_id}.js"
        new_path = self.race_tags_root / f"{new_id}.js"
        if old_path.exists() and old_path != new_path:
            old_path.rename(new_path)
        save_race_tag(self.race_tags_root, new_id, raw_id)
        if new_id != self.current_tag_id:
            for race in self.races_data:
                tags = race.get("tagIds") or []
                if self.current_tag_id in tags:
                    race["tagIds"] = [
                        new_id if tag_id == self.current_tag_id else tag_id
                        for tag_id in tags
                    ]
            for race in self.races_data:
                save_race(
                    self.races_root,
                    race["id"],
                    race.get("name", race["id"]),
                    race.get("tagIds", [])
                )
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        if self.races_root is not None:
            self.races_data[:] = parse_races(self.races_root)
            self.refresh_race_items()
            self.on_filter_change()
        self.current_tag_id = new_id
        self.tag_id_var.set(new_id)
        self.tag_error_var.set("Saved.")
        self.apply_tag_edit_state()

    def handle_delete_tag(self) -> None:
        if self.editor_mode != "edit":
            return
        if not self.current_tag_id:
            self.tag_error_var.set("Select a tag to archive.")
            return
        if self.race_tags_root is None or self.tag_archive_root is None:
            self.tag_error_var.set("Tag archive folder not set.")
            return
        old_id = self.current_tag_id
        tag_path = self.race_tags_root / f"{old_id}.js"
        if tag_path.exists():
            self.tag_archive_root.mkdir(parents=True, exist_ok=True)
            archive_path = self.tag_archive_root / f"{old_id}.js"
            if archive_path.exists():
                self.tag_error_var.set("Archived tag already exists.")
                return
            tag_path.rename(archive_path)
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        if self.races_root is not None:
            self.races_data[:] = parse_races(self.races_root)
            self.refresh_race_items()
            self.on_filter_change()
        self.current_tag_id = None
        self.tag_id_var.set("")
        self.tag_error_var.set("Archived.")
        self.apply_tag_edit_state()

    def handle_restore_tag_archive(self) -> None:
        if not self.tag_archive_root or not self.race_tags_root:
            self.tag_error_var.set("Tag archive folder not set.")
            return
        selections = list(self.tag_archive_list.curselection())
        if not selections:
            self.tag_error_var.set("Select archived tags to restore.")
            return
        self.tag_error_var.set("")
        for index in selections:
            if index >= len(self.tag_archive_visible):
                continue
            tag = self.tag_archive_visible[index]
            src = self.tag_archive_root / f"{tag['id']}.js"
            dst = self.race_tags_root / f"{tag['id']}.js"
            if dst.exists():
                self.tag_error_var.set(f"Tag id exists: {tag['id']}.")
                continue
            if src.exists():
                src.rename(dst)
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        if self.races_root is not None:
            self.races_data[:] = parse_races(self.races_root)
            self.refresh_race_items()
            self.on_filter_change()

    def handle_delete_tag_archive(self) -> None:
        if not self.tag_archive_root or not self.race_tags_root:
            self.tag_error_var.set("Tag archive folder not set.")
            return
        selections = list(self.tag_archive_list.curselection())
        if not selections:
            self.tag_error_var.set("Select archived tags to delete.")
            return
        if not messagebox.askyesno(
            "Delete archived tags",
            "Delete selected tags from archive?"
        ):
            return
        for index in selections:
            if index >= len(self.tag_archive_visible):
                continue
            tag = self.tag_archive_visible[index]
            src = self.tag_archive_root / f"{tag['id']}.js"
            if src.exists():
                src.unlink()
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        if self.races_root is not None:
            self.races_data[:] = parse_races(self.races_root)
            self.refresh_race_items()
            self.on_filter_change()
