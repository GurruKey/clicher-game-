from dataclasses import dataclass
from pathlib import Path

from game_io.race_levels import parse_race_levels
from game_io.race_tags import parse_race_tags
from game_io.race_variants import parse_race_variants
from game_io.races import parse_races


@dataclass(frozen=True)
class AppPaths:
    project_root: Path
    images_root: Path
    avatar_assets_root: Path
    currencies_path: Path
    bags_path: Path
    locations_root: Path
    race_variants_root: Path
    race_levels_root: Path
    race_tags_root: Path
    races_root: Path
    rarities_root: Path
    avatars_root: Path
    stats_path: Path
    perks_path: Path


@dataclass(frozen=True)
class AppData:
    race_variants: list[dict]
    race_levels: list[dict]
    race_tags: list[dict]
    races: list[dict]
    race_variants_by_id: dict[str, dict]
    race_levels_by_id: dict[str, dict]
    race_tags_by_id: dict[str, dict]
    races_by_id: dict[str, dict]


def build_paths(constructor_root: Path) -> AppPaths:
    project_root = constructor_root.parent
    return AppPaths(
        project_root=project_root,
        images_root=constructor_root / "images",
        avatar_assets_root=constructor_root / "assets" / "avatars",
        currencies_path=project_root / "src" / "data" / "currencies",
        bags_path=project_root / "src" / "data" / "bags.js",
        locations_root=project_root / "src" / "data" / "locations",
        race_variants_root=project_root / "src" / "data" / "race_variants",
        race_levels_root=project_root / "src" / "data" / "race_variants" / "levels",
        race_tags_root=project_root / "src" / "data" / "race_variants" / "tags",
        races_root=project_root / "src" / "data" / "race_variants" / "races",
        rarities_root=project_root / "src" / "data" / "rarities",
        avatars_root=project_root / "src" / "data" / "avatars",
        stats_path=project_root / "src" / "data" / "stats" / "index.js",
        perks_path=project_root / "src" / "data" / "perks" / "index.js"
    )


def build_help_sources(paths: AppPaths) -> list[dict]:
    return [
        {
            "id": "items",
            "title": "Items",
            "sources": [str(paths.currencies_path)]
        },
        {
            "id": "locations",
            "title": "Locations",
            "sources": [str(paths.locations_root)]
        },
        {
            "id": "map",
            "title": "Map",
            "sources": [str(paths.locations_root)]
        },
        {
            "id": "rarities",
            "title": "Rarities",
            "sources": [str(paths.rarities_root)]
        },
        {
            "id": "avatars",
            "title": "Avatars",
            "sources": [str(paths.avatars_root)]
        },
        {
            "id": "races",
            "title": "Race Catalog",
            "sources": [str(paths.races_root)]
        },
        {
            "id": "race_variants",
            "title": "Race Variants",
            "sources": [str(paths.race_variants_root)]
        },
        {
            "id": "race_levels",
            "title": "Race Levels",
            "sources": [str(paths.race_levels_root)]
        },
        {
            "id": "race_tags",
            "title": "Race Tags",
            "sources": [str(paths.race_tags_root)]
        },
        {
            "id": "stats",
            "title": "Stats",
            "sources": [str(paths.stats_path)]
        },
        {
            "id": "perks",
            "title": "Perks",
            "sources": [str(paths.perks_path)]
        },
        {
            "id": "bags",
            "title": "Bags",
            "sources": [str(paths.bags_path)]
        }
    ]


def load_app_data(paths: AppPaths) -> AppData:
    race_variants = parse_race_variants(paths.race_variants_root)
    race_levels = parse_race_levels(paths.race_levels_root)
    race_tags = parse_race_tags(paths.race_tags_root)
    races = parse_races(paths.races_root)
    race_variants_by_id = {variant["id"]: variant for variant in race_variants}
    race_levels_by_id = {level["id"]: level for level in race_levels}
    race_tags_by_id = {tag["id"]: tag for tag in race_tags}
    races_by_id = {race["id"]: race for race in races}
    return AppData(
        race_variants=race_variants,
        race_levels=race_levels,
        race_tags=race_tags,
        races=races,
        race_variants_by_id=race_variants_by_id,
        race_levels_by_id=race_levels_by_id,
        race_tags_by_id=race_tags_by_id,
        races_by_id=races_by_id
    )
