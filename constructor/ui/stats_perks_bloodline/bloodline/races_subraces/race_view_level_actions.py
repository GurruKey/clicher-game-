import re
import tkinter as tk
from tkinter import messagebox

from game_io.race_levels import delete_race_level, parse_race_levels, save_race_level
from ....theme import ModernButton


class RaceViewLevelActionsMixin:
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
        
        old_level_obj = next((lvl for lvl in self.race_levels if lvl["id"] == self.current_level_id), None)
        if not old_level_obj:
            self.level_edit_error_var.set("Could not find current level.")
            return
            
        old_level_number = old_level_obj.get("level")

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
        
        if level_id != self.current_level_id:
            old_file = self.race_levels_root / f"{self.current_level_id}.js"
            new_file = self.race_levels_root / f"{level_id}.js"
            if new_file.exists():
                self.level_edit_error_var.set(f"New level file {level_id}.js already exists.")
                return
            if old_file.exists():
                old_file.rename(new_file)
        
            if old_level_number is not None and old_level_number != level_number:
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
                            rf"level\s*:\s*{re.escape(str(old_level_number))}",
                            f"level: {level_number}",
                            text
                        )
                        if updated != text:
                            file_path.write_text(updated, encoding="utf-8")
                
                for variant in self.race_variants:
                    if int(variant.get("level", 0)) == int(old_level_number):
                        variant["level"] = level_number
        
        save_race_level(self.race_levels_root, level_data)

        self.current_level_id = level_id
        self.refresh_race_levels()
        self.rebuild_variants_index()
        self.refresh_race_items()
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
            
            level_number = int(level.get("level",0))
            refs = variant_refs.get(level_number, [])
            
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
                    "refs": refs,
                    "level_number": level_number
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

        ModernButton(selector, text="Restore", command=apply_restore).pack(
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
                        rf"level\s*:\s*{re.escape(str(level_number))}",
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

        ModernButton(selector, text="Replace", command=apply_replace).pack(
            pady=(0, 12)
        )

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
        
        to_delete = [self.level_archive_visible[i] for i in selections]
        
        in_use = [item for item in to_delete if item.get("refs")]
        if in_use:
            
            if not self.race_levels:
                messagebox.showinfo(
                    "Cannot Delete Level",
                    "The selected level(s) are in use, but no active levels are available to use as a replacement."
                )
                return

            selector = tk.Toplevel(self.parent)
            selector.title("Replace and Delete Level")
            selector.geometry("400x400")
            
            in_use_labels = ", ".join(f"'{item['id']}'" for item in in_use)
            tk.Label(selector, text=f"Levels {in_use_labels} are in use. Select a replacement:").pack(padx=12, pady=6)
            
            listbox = tk.Listbox(selector, exportselection=False)
            listbox.pack(fill="both", expand=True, padx=12, pady=6)
            
            sorted_levels = sorted(self.race_levels, key=self.level_sort_key)
            for level in sorted_levels:
                label = level.get("label") or str(level.get("level", ""))
                listbox.insert("end", f"{label} ({level['id']})")

            def apply_replace_and_delete() -> None:
                selection = listbox.curselection()
                if not selection:
                    return
                
                replacement_level = sorted_levels[selection[0]]
                new_level_number = int(replacement_level.get("level"))
                
                variants_root = self.races_root.parent if self.races_root else None
                if not variants_root:
                    selector.destroy()
                    return

                for item in in_use:
                    old_level_number = item["level_number"]
                    
                    for file_path in variants_root.rglob("*.js"):
                        parts = file_path.relative_to(variants_root).parts
                        if "races" in parts or "levels" in parts or file_path.name == "index.js":
                            continue
                        
                        text = file_path.read_text(encoding="utf-8")
                        updated = re.sub(
                            rf'level\s*:\s*{re.escape(str(old_level_number))}',
                            f'level: {new_level_number}',
                            text
                        )
                        if updated != text:
                            file_path.write_text(updated, encoding="utf-8")

                    for variant in self.race_variants:
                        if int(variant.get("level", 0)) == int(old_level_number):
                            variant["level"] = new_level_number
                
                archive_root = self.race_levels_root / "archive"
                for item in to_delete:
                     src = archive_root / f"{item['id']}.js"
                     if src.exists():
                         src.unlink()
                
                self.rebuild_variants_index()
                self.refresh_race_items()
                self.refresh_archived_levels()
                self.on_filter_change()
                self.level_edit_error_var.set("Deleted and replaced.")
                selector.destroy()

            ModernButton(selector, text="Replace and Delete", command=apply_replace_and_delete).pack(pady=12)

        else: # Not in use
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
                src = archive_root / f"{entry['id']}.js"
                if src.exists():
                    src.unlink()
            self.refresh_archived_levels()
