from constants import DEFAULT_RARITY_COLORS
from game_io.avatars import parse_avatars
from game_io.items import parse_bag_capacities, parse_currencies
from game_io.locations import parse_location_catalog, parse_locations
from game_io.perks import parse_perks
from game_io.rarities import load_rarity_colors, parse_rarities
from game_io.stats import parse_stats
from ui.avatars.editor import create_avatar_editor_view
from ui.avatars.info import create_avatars_view
from ui.stats_perks_bloodline.bloodline import create_bloodline_race_view
from ui.stats_perks_bloodline.perks import create_perks_info_view
from ui.stats_perks_bloodline.stats import create_stats_info_view
from ui.ui_help import create_help_view
from ui.ui_items import create_items_view
from ui.ui_locations import create_locations_view
from ui.ui_map import create_map_view
from ui.ui_rarities import create_rarities_view

from app_context import AppData, AppPaths


class ViewBuilders:
    def __init__(self, paths: AppPaths, data: AppData, help_sources: list[dict]):
        self.paths = paths
        self.data = data
        self.help_sources = help_sources
        self._avatars_cache: list[dict] | None = None
        self._avatars_dirty = False

    def get_avatars(self) -> list[dict]:
        if self._avatars_cache is None:
            self._avatars_cache = parse_avatars(
                self.paths.avatars_root,
                race_variants=self.data.race_variants_by_id,
                races=self.data.races_by_id
            )
        return self._avatars_cache

    def mark_avatars_dirty(self) -> None:
        self._avatars_dirty = True

    def consume_avatars_dirty(self) -> bool:
        dirty = self._avatars_dirty
        self._avatars_dirty = False
        return dirty

    def build_items_view(self, frame) -> None:
        if not self.paths.currencies_path.exists():
            return
        items = parse_currencies(self.paths.currencies_path)
        locations_by_item = parse_locations(self.paths.locations_root)
        bag_capacities = parse_bag_capacities(self.paths.bags_path)
        rarity_colors = load_rarity_colors(self.paths.rarities_root)
        if not rarity_colors:
            rarity_colors = DEFAULT_RARITY_COLORS
        create_items_view(
            frame,
            items,
            locations_by_item,
            rarity_colors,
            bag_capacities
        )

    def build_avatars_view(self, frame) -> None:
        avatars = self.get_avatars()
        create_avatars_view(frame, avatars)

    def build_avatar_editor_view(self, frame) -> None:
        avatars = self.get_avatars()
        create_avatar_editor_view(
            frame,
            avatars,
            on_dirty=self.mark_avatars_dirty,
            assets_root=self.paths.avatar_assets_root
        )

    def build_rarities_view(self, frame) -> None:
        rarities = parse_rarities(self.paths.rarities_root)
        if not rarities:
            rarities = [
                {"id": key, "label": key.title(), "color": color}
                for key, color in DEFAULT_RARITY_COLORS.items()
            ]
        create_rarities_view(frame, self.paths.rarities_root, rarities)

    def build_locations_view(self, frame) -> None:
        locations = parse_location_catalog(self.paths.locations_root)
        items = (
            parse_currencies(self.paths.currencies_path)
            if self.paths.currencies_path.exists()
            else []
        )
        item_names = {item["id"]: item["name"] for item in items}
        create_locations_view(frame, locations, item_names)

    def build_map_view(self, frame) -> None:
        locations = parse_location_catalog(self.paths.locations_root)
        items = (
            parse_currencies(self.paths.currencies_path)
            if self.paths.currencies_path.exists()
            else []
        )
        item_lookup = {item["id"]: item for item in items}
        rarity_colors = load_rarity_colors(self.paths.rarities_root)
        if not rarity_colors:
            rarity_colors = DEFAULT_RARITY_COLORS
        create_map_view(
            frame,
            locations,
            item_lookup,
            rarity_colors,
            default_location_id=locations[0]["id"] if locations else None
        )

    def build_help_view(self, frame) -> None:
        create_help_view(frame, self.help_sources)

    def build_stats_info_view(self, frame) -> None:
        stats = parse_stats(self.paths.stats_path)
        create_stats_info_view(frame, stats)

    def build_perks_info_view(self, frame) -> None:
        stats = parse_stats(self.paths.stats_path)
        perks = parse_perks(self.paths.perks_path)
        create_perks_info_view(frame, perks, stats)

    def build_bloodline_info_view(self, frame) -> None:
        avatars = self.get_avatars()
        create_avatars_view(frame, avatars)

    def build_bloodline_race_view(self, frame) -> None:
        create_bloodline_race_view(
            frame,
            self.data.races,
            self.data.race_variants,
            self.data.race_levels,
            self.data.race_tags,
            self.paths.races_root,
            self.paths.race_tags_root,
            self.paths.race_levels_root
        )
