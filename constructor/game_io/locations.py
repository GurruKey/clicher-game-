from pathlib import Path
import re


def parse_locations(location_root: Path) -> dict[str, list[str]]:
    results: dict[str, list[str]] = {}
    if not location_root.exists():
        return results

    for location_dir in location_root.iterdir():
        if not location_dir.is_dir():
            continue

        name = location_dir.name
        index_path = location_dir / "index.js"
        loot_path = location_dir / "loot.js"

        if index_path.exists():
            index_text = index_path.read_text(encoding="utf-8")
            name_match = re.search(r'name\s*:\s*"([^"]+)"', index_text)
            if name_match:
                name = name_match.group(1)

        if not loot_path.exists():
            continue

        loot_text = loot_path.read_text(encoding="utf-8")
        for match in re.finditer(
            r'\{\s*id\s*:\s*"([^"]+)"\s*,\s*chance\s*:\s*([0-9.]+)\s*\}',
            loot_text
        ):
            item_id, chance = match.group(1), match.group(2)
            results.setdefault(item_id, []).append(f"{name} ({chance}%)")

    return results


def parse_location_catalog(location_root: Path) -> list[dict]:
    locations: list[dict] = []
    if not location_root.exists():
        return locations

    for location_dir in location_root.iterdir():
        if not location_dir.is_dir():
            continue

        location_id = location_dir.name
        location_name = location_dir.name
        index_path = location_dir / "index.js"
        loot_path = location_dir / "loot.js"

        coords = None
        if index_path.exists():
            index_text = index_path.read_text(encoding="utf-8")
            id_match = re.search(r'id\s*:\s*"([^"]+)"', index_text)
            name_match = re.search(r'name\s*:\s*"([^"]+)"', index_text)
            coords_match = re.search(
                r'coords\s*:\s*\{\s*x\s*:\s*([0-9.+-]+)\s*,\s*y\s*:\s*([0-9.+-]+)\s*\}',
                index_text,
                re.S
            )
            if id_match:
                location_id = id_match.group(1)
            if name_match:
                location_name = name_match.group(1)
            if coords_match:
                coords = {
                    "x": float(coords_match.group(1)),
                    "y": float(coords_match.group(2))
                }

        loot = []
        if loot_path.exists():
            loot_text = loot_path.read_text(encoding="utf-8")
            for match in re.finditer(
                r'\{\s*id\s*:\s*"([^"]+)"\s*,\s*chance\s*:\s*([0-9.]+)\s*\}',
                loot_text
            ):
                item_id, chance = match.group(1), match.group(2)
                loot.append({"id": item_id, "chance": chance})

        locations.append(
            {
                "id": location_id,
                "name": location_name,
                "loot": loot,
                "coords": coords
            }
        )

    locations.sort(key=lambda item: item["name"].lower())
    return locations
