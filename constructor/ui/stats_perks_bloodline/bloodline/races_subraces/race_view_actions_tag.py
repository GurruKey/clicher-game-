import re
import tkinter as tk
from tkinter import messagebox

from game_io.race_tags import parse_race_tags, save_race_tag
from game_io.races import parse_races, save_race
from ....theme import ModernButton


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
        if self.race_tags_root is None or self.races_root is None:
            self.tag_error_var.set("Tag or race folder not set.")
            return
            
        raw_id = self.tag_id_var.get().strip()
        if not raw_id:
            self.tag_error_var.set("Tag id is required.")
            return
        new_id = raw_id.lower().replace(" ", "_")
        if not re.match(r"^[a-z0-9_]+$", new_id):
            self.tag_error_var.set("Id must be letters, numbers, underscores.")
            return
        if new_id == self.current_tag_id:
            self.tag_error_var.set("Saved.")
            return

        existing_ids = {tag["id"] for tag in self.race_tags_data}
        if new_id in existing_ids:
            self.tag_error_var.set("Tag id already exists.")
            return

        # Efficiently update references on disk
        self._replace_tag_references([self.current_tag_id], new_id)

        # Now, rename the tag file itself
        old_path = self.race_tags_root / f"{self.current_tag_id}.js"
        new_path = self.race_tags_root / f"{new_id}.js"
        if old_path.exists():
            old_path.rename(new_path)
        save_race_tag(self.race_tags_root, new_id, raw_id)

        # Refresh everything
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        self.races_data[:] = parse_races(self.races_root)
        self.rebuild_variants_index()
        self.refresh_race_items()
        self.on_filter_change()
        
        self.current_tag_id = new_id
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
        
        # Clear references from races on disk
        self._replace_tag_references([old_id], None)
        
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        self.races_data[:] = parse_races(self.races_root)
        self.rebuild_variants_index()
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
            src = self.tag_archive_root / f'{tag["id"]}.js'
            dst = self.race_tags_root / f'{tag["id"]}.js'
            if dst.exists():
                self.tag_error_var.set(f"Tag id exists: {tag['id']}.")
                continue
            if src.exists():
                src.rename(dst)
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
        self.refresh_tag_list()
        self.races_data[:] = parse_races(self.races_root)
        self.rebuild_variants_index()
        self.refresh_race_items()
        self.on_filter_change()

    def _replace_tag_references(self, old_ids: list[str], new_id: str | None) -> None:
        if not self.races_root:
            return
        
        id_set_to_remove = set(old_ids)

        for file_path in self.races_root.rglob("*.js"):
            if file_path.name == "index.js":
                continue
            
            try:
                content = file_path.read_text(encoding="utf-8")
                match = re.search(r'(tagIds\s*:\s*\[)([^\]]*?)(\])', content, re.DOTALL)
                if not match:
                    continue

                tag_string = match.group(2)
                current_tags = {tag.strip().strip('\'"') for tag in tag_string.split(",") if tag.strip()}
                
                if not (id_set_to_remove & current_tags):
                    continue

                updated_tags = current_tags - id_set_to_remove
                if new_id and new_id not in updated_tags:
                    updated_tags.add(new_id)
                
                new_tag_string = ", ".join(sorted([f'"{tag}"' for tag in updated_tags]))
                new_line = f'{match.group(1)}{new_tag_string}{match.group(3)}'
                
                updated_content = content.replace(match.group(0), new_line)
                
                if content != updated_content:
                    file_path.write_text(updated_content, encoding="utf-8")

            except Exception as e:
                print(f"Error processing file {file_path}: {e}")

    def handle_delete_tag_archive(self) -> None:
        if not self.tag_archive_root or not self.races_root:
            self.tag_error_var.set("Folders not set.")
            return

        selections = list(self.tag_archive_list.curselection())
        if not selections:
            self.tag_error_var.set("Select tags to delete.")
            return

        to_delete = [self.tag_archive_visible[i] for i in selections]
        in_use = [item for item in to_delete if item.get("refs")]

        if in_use:
            selector = tk.Toplevel(self.parent)
            selector.title("Replace and Delete Tags")
            selector.geometry("400x400")
            
            in_use_labels = ", ".join(f"'{item['id']}'" for item in in_use)
            tk.Label(selector, text=f"Tags {in_use_labels} are in use. Select a replacement:", wraplength=380).pack(padx=12, pady=6)
            
            listbox = tk.Listbox(selector, exportselection=False)
            listbox.pack(fill="both", expand=True, padx=12, pady=6)
            
            listbox.insert("end", "[Remove Tag Only]")
            listbox.itemconfig(0, {"fg": "#b44"})
            
            available_tags = sorted(self.race_tags_data, key=lambda t: t.get("id", ""))
            for tag in available_tags:
                listbox.insert("end", tag["id"])

            def apply_replace_and_delete() -> None:
                selection = listbox.curselection()
                if not selection:
                    return
                
                replacement_id: str | None
                if selection[0] == 0:
                    replacement_id = None
                else:
                    replacement_id = available_tags[selection[0] - 1]["id"]

                ids_to_replace = [item["id"] for item in in_use]
                self._replace_tag_references(ids_to_replace, replacement_id)

                for item in to_delete:
                    src = self.tag_archive_root / f'{item["id"]}.js'
                    if src.exists():
                        src.unlink()
                
                self.races_data[:] = parse_races(self.races_root)
                self.rebuild_variants_index()
                self.refresh_tag_list()
                self.refresh_archived_tags()
                self.refresh_race_items()
                self.on_filter_change()
                self.tag_error_var.set("Deleted and replaced references.")
                selector.destroy()

            ModernButton(selector, text="Replace and Delete", command=apply_replace_and_delete).pack(pady=12)

        else:  # Not in use
            if not messagebox.askyesno(
                "Delete archived tags",
                f"Permanently delete {len(to_delete)} selected tag(s) from archive?"
            ):
                return
            
            for item in to_delete:
                src = self.tag_archive_root / f'{item["id"]}.js'
                if src.exists():
                    src.unlink()
            
            self.refresh_archived_tags()
            self.tag_error_var.set(f"Deleted {len(to_delete)} tag(s).")
