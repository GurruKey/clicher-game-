import re
import tkinter.messagebox as messagebox
import tkinter as tk

from constants import DEFAULT_RARITY_COLORS
from game_io.avatars import parse_avatars
from game_io.items import parse_bag_capacities, parse_currencies
from game_io.locations import parse_location_catalog, parse_locations, save_location
from game_io.perks import parse_perks, save_perk, delete_perk
from game_io.rarities import load_rarity_colors, parse_rarities
from game_io.stats import parse_stats, save_stat, delete_stat
from game_io.resources import parse_resources, save_resource, delete_resource
from game_io.stats_config import parse_stats_config, save_stats_config

from ui.avatars.editor import create_avatar_editor_view
from ui.avatars.info import create_avatars_view
from ui.stats_perks_bloodline.bloodline import create_bloodline_race_view, create_bloodline_info_view
from ui.stats_perks_bloodline.perks import create_perks_info_view
from ui.stats_perks_bloodline.stats import create_stats_info_view, create_stats_config_view
from ui.stats_perks_bloodline.resources import create_resources_info_view
from ui.ui_help import create_help_view
from ui.ui_items import create_items_view
from ui.ui_locations import create_locations_view
from ui.ui_map import create_map_view
# UPDATED: Import from new location
from ui.rarities import create_rarities_view
from ui.dialogs import DeleteConflictDialog, ReassignDialog, RenameDialog

from app_context import AppData, AppPaths


class ViewBuilders:
    def __init__(self, paths: AppPaths, data: AppData, help_sources: list[dict]):
        self.paths = paths
        self.data = data
        self.help_sources = help_sources
        self._avatars_cache = None
        self._avatars_dirty = False
        self.show_view_callback = None

    def set_show_view_callback(self, callback):
        self.show_view_callback = callback

    def get_avatars(self):
        if self._avatars_cache is None:
            self._avatars_cache = parse_avatars(self.paths.avatars_root, self.data.race_variants_by_id, self.data.races_by_id)
        return self._avatars_cache

    def mark_avatars_dirty(self): self._avatars_dirty = True
    def consume_avatars_dirty(self):
        d = self._avatars_dirty; self._avatars_dirty = False; return d

    def build_items_view(self, f):
        items = parse_currencies(self.paths.currencies_path) if self.paths.currencies_path.exists() else []
        create_items_view(f, items, parse_locations(self.paths.locations_root), load_rarity_colors(self.paths.rarities_root) or DEFAULT_RARITY_COLORS, parse_bag_capacities(self.paths.bags_path))

    def build_avatars_view(self, f): create_avatars_view(f, self.get_avatars())

    def build_avatar_editor_view(self, f):
        create_avatar_editor_view(f, self.get_avatars(), on_dirty=self.mark_avatars_dirty, assets_root=self.paths.avatar_assets_root)

    def build_rarities_view(self, f):
        r = parse_rarities(self.paths.rarities_root) or [{"id": k, "label": k.title(), "color": v} for k, v in DEFAULT_RARITY_COLORS.items()]
        create_rarities_view(f, self.paths.rarities_root, r)

    def build_locations_view(self, f):
        def r(): return parse_location_catalog(self.paths.locations_root)
        create_locations_view(f, r(), {i["id"]: i["name"] for i in (parse_currencies(self.paths.currencies_path) if self.paths.currencies_path.exists() else [])}, resource_list=parse_resources(self.paths.resources_path), on_save=lambda d: save_location(self.paths.locations_root, d), on_refresh=r)

    def build_map_view(self, f):
        items = {i["id"]: i for i in (parse_currencies(self.paths.currencies_path) if self.paths.currencies_path.exists() else [])}
        create_map_view(f, parse_location_catalog(self.paths.locations_root), items, load_rarity_colors(self.paths.rarities_root) or DEFAULT_RARITY_COLORS, default_location_id=None)

    def build_help_view(self, f): create_help_view(f, self.help_sources)

    def _check_dependents(self, target_id: str):
        all_stats = parse_stats(self.paths.stats_path); all_resources = parse_resources(self.paths.resources_path); all_entities = all_stats + all_resources
        dependents = [e for e in all_entities if any(m["targetStatId"] == target_id for m in e.get("modifiers", []))]
        return dependents, all_entities

    def _handle_delete_with_dependencies(self, frame, item_id, delete_func, save_func_map):
        dependents, all_entities = self._check_dependents(item_id)
        target_stat = next((s for s in all_entities if s["id"] == item_id), None)
        if not dependents:
            if messagebox.askyesno("Confirm", f"Delete '{target_stat['label'] if target_stat else item_id}'?"):
                delete_func(item_id); return True
            return False
        dialog = DeleteConflictDialog(frame, target_stat['label'] if target_stat else item_id, [d["label"] for d in dependents], [s["label"] for s in all_entities if s["id"] != item_id])
        if dialog.action == "purge":
            for dep in dependents:
                dep["modifiers"] = [m for m in dep.get("modifiers", []) if m["targetStatId"] != item_id]
                save = save_func_map["resource" if dep.get("is_resource") else "stat"]
                save(self.paths.resources_path if dep.get("is_resource") else self.paths.stats_path, dep)
            delete_func(item_id); return True
        return False

    def _handle_reassign(self, frame, stat_id, is_resource=False):
        all_stats = parse_stats(self.paths.stats_path); all_resources = parse_resources(self.paths.resources_path); all_entities = all_stats + all_resources
        target_stat = next((s for s in all_entities if s["id"] == stat_id), None)
        if not target_stat: return False
        candidates = [s for s in all_entities if s["id"] != stat_id]
        dialog = ReassignDialog(frame, target_stat["label"], [s["label"] for s in candidates])
        if dialog.selection:
            new_target = next((s for s in candidates if s["label"] == dialog.selection), None)
            if new_target:
                for ent in all_entities:
                    mods = ent.get("modifiers", [])
                    changed = False
                    for m in mods:
                        if m["targetStatId"] == stat_id:
                            m["targetStatId"] = new_target["id"]; changed = True
                    if changed:
                        save = save_resource if ent.get("is_resource") else save_stat
                        save(self.paths.resources_path if ent.get("is_resource") else self.paths.stats_path, ent)
                return True
        return False

    def _handle_replace(self, frame, stat_id, is_resource=False):
        all_stats = parse_stats(self.paths.stats_path); all_resources = parse_resources(self.paths.resources_path); all_entities = all_stats + all_resources
        target_stat = next((s for s in all_entities if s["id"] == stat_id), None)
        if not target_stat: return False
        dialog = RenameDialog(frame, target_stat["label"])
        if dialog.result:
            new_label = dialog.result
            new_id = re.sub(r"[^a-z0-9_]+", "_", new_label.lower()).strip("_")
            if any(s["id"] == new_id for s in all_entities if s["id"] != stat_id):
                if not messagebox.askyesno("Merge", f"Stat '{new_id}' already exists. Merge into it?"): return False
            for ent in all_entities:
                mods = ent.get("modifiers", [])
                changed = False
                for m in mods:
                    if m["targetStatId"] == stat_id:
                        m["targetStatId"] = new_id; changed = True
                if changed:
                    save = save_resource if ent.get("is_resource") else save_stat
                    save(self.paths.resources_path if ent.get("is_resource") else self.paths.stats_path, ent)
            save_func = save_resource if is_resource else save_stat
            delete_func = delete_resource if is_resource else delete_stat
            target_stat["label"] = new_label; target_stat["id"] = new_id
            save_func(self.paths.resources_path if is_resource else self.paths.stats_path, target_stat)
            if new_id != stat_id: delete_func(self.paths.resources_path if is_resource else self.paths.stats_path, stat_id)
            return True
        return False

    def build_stats_info_view(self, f):
        def refresh():
            s = [x for x in parse_stats(self.paths.stats_path) if not x.get("is_resource")]
            return s, s, parse_resources(self.paths.resources_path)
        save_map = {"stat": save_stat, "resource": save_resource}
        data, s_t, r_t = refresh()
        create_stats_info_view(f, data, lambda d: save_stat(self.paths.stats_path, d), stat_targets=s_t, resource_targets=r_t, on_delete=lambda sid: self._handle_delete_with_dependencies(f, sid, lambda s: delete_stat(self.paths.stats_path, s), save_map), on_reassign=lambda sid: self._handle_reassign(f, sid), on_replace=lambda sid: self._handle_replace(f, sid), on_refresh=refresh)

    def build_stats_config_view(self, f):
        all_stats = parse_stats(self.paths.stats_path)
        current_config = parse_stats_config(self.paths.stats_path.parent)
        def on_save(cfg): save_stats_config(self.paths.stats_path.parent, cfg)
        def on_back():
            if self.show_view_callback: self.show_view_callback("stats_info", self.build_stats_info_view)
        create_stats_config_view(f, all_stats, current_config, on_save, on_back)

    def build_resources_info_view(self, f):
        def refresh():
            s = [x for x in parse_stats(self.paths.stats_path) if not x.get("is_resource")]
            return parse_resources(self.paths.resources_path), s, parse_resources(self.paths.resources_path)
        save_map = {"stat": save_stat, "resource": save_resource}
        data, s_t, r_t = refresh()
        create_resources_info_view(f, data, lambda d: save_resource(self.paths.resources_path, d), stat_targets=s_t, resource_targets=r_t, on_delete=lambda rid: self._handle_delete_with_dependencies(f, rid, lambda r: delete_resource(self.paths.resources_path, r), save_map), on_reassign=lambda rid: self._handle_reassign(f, rid, True), on_replace=lambda rid: self._handle_replace(f, rid, True), on_refresh=refresh)

    def build_perks_info_view(self, f):
        def refresh():
            s = [x for x in parse_stats(self.paths.stats_path) if not x.get("is_resource")]
            return parse_perks(self.paths.perks_path), s, parse_resources(self.paths.resources_path)
        data, s_t, r_t = refresh()
        create_perks_info_view(f, data, lambda d: save_perk(self.paths.perks_path, d), stat_targets=s_t, resource_targets=r_t, on_delete=lambda pid: delete_perk(self.paths.perks_path, pid) or True, on_refresh=refresh)

    def build_bloodline_info_view(self, f): create_bloodline_info_view(f, self.data.races, self.data.race_variants, self.data.race_levels, self.data.race_tags)
    def build_bloodline_race_view(self, f): create_bloodline_race_view(f, self.data.races, self.data.race_variants, self.data.race_levels, self.data.race_tags, self.paths.races_root, self.paths.race_tags_root, self.paths.race_levels_root)
