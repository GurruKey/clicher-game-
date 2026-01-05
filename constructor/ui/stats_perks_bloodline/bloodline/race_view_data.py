from game_io.race_levels import parse_race_levels
from game_io.races import parse_races
from game_io.race_tags import parse_race_tags


class RaceViewDataMixin:
    def init_data(self) -> None:
        self.variants_by_race: dict[str, dict[int, list[dict]]] = {}
        self.races_data = list(self.races)
        self.race_tags_data = list(self.race_tags)
        self.race_archive_root = self.races_root / "archive" if self.races_root else None
        self.tag_archive_root = (
            self.race_tags_root / "archive" if self.race_tags_root else None
        )
        self.archived_races_data: list[dict] = []
        self.archived_tags_data: list[dict] = []
        self.race_archive_items: list[dict] = []
        self.race_archive_visible: list[dict] = []
        self.tag_archive_items: list[dict] = []
        self.tag_archive_visible: list[dict] = []
        self.archived_levels_data: list[dict] = []
        self.level_archive_items: list[dict] = []
        self.level_archive_visible: list[dict] = []
        self.race_tag_options: list[dict] = []
        self.race_items: list[dict] = []
        self.search_index: list[tuple[dict, str]] = []
        self.race_name_by_id: dict[str, str] = {}
        self.race_tags_by_id: dict[str, list[str]] = {}

        self.rebuild_variants_index()
        self.refresh_race_levels()
        self.refresh_race_items()
        self.refresh_archived_races()
        self.refresh_archived_tags()
        self.refresh_tag_list()

    def refresh_race_levels(self) -> None:
        if self.race_levels_root:
            self.race_levels[:] = parse_race_levels(self.race_levels_root)
        self.race_levels_by_id = {level["id"]: level for level in self.race_levels}
        self.race_levels_by_number = {}
        for level in self.race_levels:
            level_number = level["level"]
            existing = self.race_levels_by_number.get(level_number)
            if not existing:
                self.race_levels_by_number[level_number] = level
                continue
            if self.level_suffix_rank(level) > self.level_suffix_rank(existing):
                self.race_levels_by_number[level_number] = level

    def get_level_suffix(self, level: dict) -> str | None:
        label = level.get("label") or ""
        if label.endswith("+"):
            return "+"
        if label.endswith("-"):
            return "-"
        level_id = level.get("id", "")
        if level_id.endswith("_plus"):
            return "+"
        if level_id.endswith("_minus"):
            return "-"
        return None

    def level_suffix_rank(self, level: dict) -> int:
        suffix = self.get_level_suffix(level)
        ranks = {"-": 0, None: 1, "+": 2}
        return ranks.get(suffix, 1)

    def level_sort_key(self, level: dict) -> tuple[int, int, str]:
        return (-int(level.get("level", 0)), -self.level_suffix_rank(level), level["id"])

    def rebuild_variants_index(self) -> None:
        self.variants_by_race.clear()
        for variant in self.race_variants:
            race_id = variant.get("raceId", "unknown")
            level = int(variant.get("level", 1))
            self.variants_by_race.setdefault(race_id, {}).setdefault(level, []).append(
                variant
            )

    def refresh_race_items(self) -> None:
        self.race_items = []
        race_ids = set()
        for race in self.races_data:
            tags = race.get("tagIds") or []
            race_ids.add(race["id"])
            self.race_items.append(
                {
                    "id": race["id"],
                    "label": race["name"],
                    "race": race,
                    "tags": tags,
                    "missing": False
                }
            )
        for race_id in self.variants_by_race.keys():
            if race_id not in race_ids:
                self.race_items.append(
                    {
                        "id": race_id,
                        "label": race_id,
                        "race": {"id": race_id, "name": race_id},
                        "tags": [],
                        "missing": True,
                        "fg": "#caa830"
                    }
                )
        self.race_items.sort(key=lambda item: item["label"].lower())

        self.search_index = []
        for item in self.race_items:
            tag_blob = " ".join(item.get("tags") or [])
            blob = " ".join([item["id"], item["label"], tag_blob]).lower()
            self.search_index.append((item, blob))

        self.race_name_by_id = {race["id"]: race["label"] for race in self.race_items}
        self.race_tags_by_id = {
            race["id"]: race.get("race", {}).get("tagIds", [])
            for race in self.race_items
        }

    def refresh_archived_races(self) -> None:
        self.archived_races_data.clear()
        if self.race_archive_root and self.race_archive_root.exists():
            self.archived_races_data.extend(parse_races(self.race_archive_root))
        variant_refs: dict[str, list[str]] = {}
        for variant in self.race_variants:
            race_id = variant.get("raceId")
            if race_id:
                variant_refs.setdefault(race_id, []).append(variant.get("id"))
        self.race_archive_items = []
        for race in self.archived_races_data:
            tags = race.get("tagIds") or []
            tag_text = ", ".join(tags) if tags else "none"
            refs = variant_refs.get(race["id"], [])
            count_text = f" [{len(refs)}]" if refs else ""
            race_name = race.get("name") or race["id"]
            if race_name.strip().lower() == race["id"].strip().lower():
                label_base = race_name
            else:
                label_base = f"{race_name} [{race['id']}]"
            self.race_archive_items.append(
                {
                    "id": race["id"],
                    "label": f"{label_base}{count_text} | Tags: {tag_text}",
                    "refs": refs
                }
            )
        query = self.race_archive_search_var.get().strip().lower()
        self.race_archive_visible = [
            item
            for item in self.race_archive_items
            if not query or query in item["label"].lower()
        ]
        self.race_archive_list.delete(0, "end")
        for item in self.race_archive_visible:
            self.race_archive_list.insert("end", item["label"])
        self.race_archive_detail.config(text="")

    def refresh_archived_tags(self) -> None:
        self.archived_tags_data.clear()
        if self.tag_archive_root and self.tag_archive_root.exists():
            self.archived_tags_data.extend(parse_race_tags(self.tag_archive_root))
        self.tag_archive_items = []
        for tag in self.archived_tags_data:
            label = tag.get("label") or tag["id"]
            self.tag_archive_items.append(
                {"id": tag["id"], "label": f"{label} ({tag['id']})"}
            )
        query = self.tag_archive_search_var.get().strip().lower()
        self.tag_archive_visible = [
            item
            for item in self.tag_archive_items
            if not query or query in item["label"].lower()
        ]
        self.tag_archive_list.delete(0, "end")
        for item in self.tag_archive_visible:
            self.tag_archive_list.insert("end", item["label"])

    def refresh_tag_list(self) -> None:
        self.refresh_archived_tags()
        self.tag_listbox.delete(0, "end")
        self.race_tag_options.clear()
        for tag in self.race_tags_data:
            label = tag.get("label") or tag["id"]
            self.race_tag_options.append(
                {"id": tag["id"], "label": f"{label} ({tag['id']})", "archived": False}
            )
        for tag in self.archived_tags_data:
            label = tag.get("label") or tag["id"]
            self.race_tag_options.append(
                {
                    "id": tag["id"],
                    "label": f"{label} ({tag['id']})",
                    "archived": True
                }
            )
        for tag in self.race_tag_options:
            self.tag_listbox.insert("end", tag["label"])
        tag_items = [
            {"id": tag["id"], "label": tag["label"]}
            for tag in self.race_tags_data
        ]
        self.render_list(
            self.tag_list_inner,
            self.tag_list_state,
            tag_items,
            lambda item: item["label"],
            self.select_tag
        )

    def on_archive_race_select(self, _event=None) -> None:
        selections = list(self.race_archive_list.curselection())
        if not selections:
            self.race_archive_detail.config(text="")
            return
        details = []
        for index in selections:
            if index >= len(self.race_archive_visible):
                continue
            item = self.race_archive_visible[index]
            refs = item.get("refs") or []
            if refs:
                details.append(f"{item['id']}: {', '.join(sorted(refs))}")
            else:
                details.append(f"{item['id']}: no variants")
        self.race_archive_detail.config(text="\n".join(details))

    def on_race_archive_filter(self, *_args: object) -> None:
        self.refresh_archived_races()
        self.on_archive_race_select()

    def on_tag_archive_filter(self, *_args: object) -> None:
        self.refresh_archived_tags()

    def sync_races_from_disk(self) -> None:
        if not self.races_root:
            return
        self.races_data[:] = parse_races(self.races_root)

    def sync_tags_from_disk(self) -> None:
        if not self.race_tags_root:
            return
        self.race_tags_data[:] = parse_race_tags(self.race_tags_root)
