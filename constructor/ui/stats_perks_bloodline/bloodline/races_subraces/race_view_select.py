import tkinter as tk

from ....theme import ModernButton


class RaceViewSelectMixin:
    def format_level_label(self, level_number: int) -> str:
        level_guide = self.race_levels_by_number.get(level_number)
        if level_guide:
            return level_guide.get("label") or str(level_number)
        return str(level_number)

    def format_stat_budget(self, level_guide: dict) -> str | None:
        stat_range = level_guide.get("statBudgetRange") or {}
        stat_min = stat_range.get("min")
        stat_max = stat_range.get("max")
        if stat_min is not None or stat_max is not None:
            if stat_min is None:
                return f"0-{stat_max}"
            if stat_max is None:
                return f"{stat_min}+"
            return f"{stat_min}-{stat_max}"
        stat_budget = level_guide.get("statBudget")
        if stat_budget is not None:
            return str(stat_budget)
        return None

    def select_tag(self, tag_item: dict) -> None:
        self.tag_list_state["selected"] = tag_item["id"]
        self.update_row_styles(self.tag_list_state)
        if self.editor_active and self.editor_mode == "edit":
            self.select_tag_for_edit(tag_item)

    def show_variant_details(self, variant: dict | None) -> None:
        if not variant:
            self.detail_title.config(text="Select a variant")
            self.detail_text.config(text="")
            return
        level_number = variant.get("level", 1)
        level_label = self.format_level_label(level_number)
        lines = [
            f"ID: {variant.get('id', 'Unknown')}",
            f"Race: {self.race_name_by_id.get(variant.get('raceId'), 'unknown')}",
            f"Level: {level_label}"
        ]
        tags = self.race_tags_by_id.get(variant.get("raceId"), [])
        if tags:
            lines.append(f"Tags: {', '.join(tags)}")
        stats = variant.get("stats") or {}
        if stats:
            lines.append("")
            lines.append("Stats:")
            for key, value in stats.items():
                lines.append(f"- {key.title()}: {value}")
        else:
            lines.append("")
            lines.append("Stats:")
            lines.append("- None")
        perks = variant.get("perks") or []
        if perks:
            lines.append("")
            lines.append("Perks:")
            for perk in perks:
                lines.append(f"- {perk}")
        else:
            lines.append("")
            lines.append("Perks:")
            lines.append("- None")
        description = variant.get("description")
        if description:
            lines.append("")
            lines.append("Description:")
            lines.append(description)
        dev_note = variant.get("devNote")
        if dev_note:
            lines.append("")
            lines.append("Dev Note:")
            lines.append(dev_note)
        if level_number:
            level_guide = self.race_levels_by_number.get(level_number)
            if not level_guide:
                level_guide = self.race_levels_by_id.get(str(level_number))
            guide_lines = []
            if level_guide:
                stat_budget_text = self.format_stat_budget(level_guide)
                if stat_budget_text is not None:
                    guide_lines.append(f"- Stat Budget: {stat_budget_text}")
                perk_range = level_guide.get("perkRange") or {}
                perk_min = perk_range.get("min")
                perk_max = perk_range.get("max")
                if perk_min is not None or perk_max is not None:
                    if perk_min is None:
                        guide_lines.append(f"- Perk Range: 0-{perk_max}")
                    elif perk_max is None:
                        guide_lines.append(f"- Perk Range: {perk_min}+")
                    else:
                        guide_lines.append(f"- Perk Range: {perk_min}-{perk_max}")
                notes = level_guide.get("notes") or []
                if isinstance(notes, str):
                    notes = [notes]
                if notes:
                    guide_lines.append("- Notes:")
                    for note in notes:
                        guide_lines.append(f"  - {note}")
            if guide_lines:
                lines.extend(["", "Level Guide:", *guide_lines])
        self.detail_title.config(text=variant.get("id", "Variant"))
        self.detail_text.config(text="\n".join(lines))

    def select_variant(self, variant: dict) -> None:
        self.variant_state["selected"] = variant["id"]
        self.update_row_styles(self.variant_state)
        self.show_variant_details(variant)

    def select_level(self, level_item: dict) -> None:
        if getattr(self, "level_editor_active", False):
            return
        self.level_state["selected"] = level_item["id"]
        self.update_row_styles(self.level_state)
        self.variant_state["selected"] = None
        level_variants = level_item["variants"]
        level_variants = sorted(level_variants, key=lambda item: item["id"])
        variant_items = [
            {"id": variant["id"], "label": variant["id"], "variant": variant}
            for variant in level_variants
        ]
        self.render_list(
            self.variant_inner,
            self.variant_state,
            variant_items,
            lambda item: item["label"],
            lambda item: self.select_variant(item["variant"])
        )

    def select_race(self, race_item: dict) -> None:
        if getattr(self, "level_editor_active", False):
            return
        self.race_state["selected"] = race_item["id"]
        self.update_row_styles(self.race_state)
        if self.editor_active and self.editor_mode == "edit":
            self.select_race_for_edit(race_item)
            return
        self.level_state["selected"] = None
        self.variant_state["selected"] = None
        self.show_variant_details(None)
        race_id = race_item["id"]
        levels = self.variants_by_race.get(race_id, {})
        level_items = []
        for level, variants in sorted(levels.items(), reverse=True):
            level_guide = self.race_levels_by_number.get(level)
            display_level = (
                level_guide.get("label") if level_guide else None
            ) or str(level)
            level_items.append(
                {
                    "id": str(level),
                    "label": f"Level {display_level}",
                    "level": level,
                    "variants": variants,
                    "guide": level_guide,
                    "missing": level_guide is None
                }
            )

        def level_label(item: dict) -> str:
            guide = item.get("guide") or {}
            stat_budget = self.format_stat_budget(guide or {})
            perk_range = guide.get("perkRange") or {}
            perk_min = perk_range.get("min")
            perk_max = perk_range.get("max")
            hints: list[str] = []
            if stat_budget is not None:
                hints.append(f"Stats: {stat_budget}")
            if perk_min is not None or perk_max is not None:
                if perk_min is None:
                    hints.append(f"Perks: 0-{perk_max}")
                elif perk_max is None:
                    hints.append(f"Perks: {perk_min}+")
                else:
                    hints.append(f"Perks: {perk_min}-{perk_max}")
            label = item["label"]
            if item.get("missing"):
                label = f"(!) {label}"
            if hints:
                return f"{label}\n" + " | ".join(hints)
            return label

        def level_row_extra(row, _row_inner, item, register_widget) -> None:
            if not item.get("missing"):
                return
            action_row = tk.Frame(row, bg=self.row_bg)
            action_row.pack(fill="x", padx=8, pady=(0, 6))
            register_widget(action_row)

            icon = tk.Label(
                action_row,
                text="!",
                fg="#caa830",
                font=("Segoe UI", 12, "bold"),
                bg=self.row_bg
            )
            icon.pack(side="left")
            register_widget(icon)

            restore_button = ModernButton(
                action_row,
                text="Restore",
                width=6,
                command=lambda lvl=item["level"]: self.restore_missing_level(lvl)
            )
            restore_button.pack(side="left")

            replace_button = ModernButton(
                action_row,
                text="Replace",
                width=6,
                command=lambda lvl=item["level"]: self.replace_missing_level(lvl)
            )
            replace_button.pack(side="left", padx=(8, 0))

        self.render_list(
            self.level_inner,
            self.level_state,
            level_items,
            level_label,
            lambda item: self.select_level(item),
            row_extra=level_row_extra
        )
        self.render_list(
            self.variant_inner,
            self.variant_state,
            [],
            lambda item: item["label"],
            lambda item: self.select_variant(item["variant"])
        )

    def race_label(self, item: dict) -> str:
        tags = item.get("tags") or []
        if not tags:
            if item.get("missing"):
                return f"(!) {item['label']}"
            return item["label"]
        label = f"{item['label']}\nTags: {', '.join(tags)}"
        if item.get("missing"):
            return f"(!) {label}"
        return label

    def race_row_extra(self, row, _row_inner, item, register_widget) -> None:
        if not item.get("missing"):
            return
        action_row = tk.Frame(row, bg=self.row_bg)
        action_row.pack(fill="x", padx=8, pady=(0, 6))
        register_widget(action_row)

        icon = tk.Label(
            action_row,
            text="!",
            fg="#caa830",
            font=("Segoe UI", 12, "bold"),
            bg=self.row_bg
        )
        icon.pack(side="left")
        register_widget(icon)

        restore_button = ModernButton(
            action_row,
            text="Restore",
            width=6,
            command=lambda rid=item["id"]: self.restore_missing_race(rid)
        )
        restore_button.pack(side="left")

        replace_button = ModernButton(
            action_row,
            text="Replace",
            width=6,
            command=lambda rid=item["id"]: self.replace_missing_race(rid)
        )
        replace_button.pack(side="left", padx=(8, 0))

    def render_race_list(self, filtered: list[dict]) -> None:
        self.render_list(
            self.race_inner,
            self.race_state,
            filtered,
            self.race_label,
            self.select_race,
            row_extra=self.race_row_extra
        )

    def on_filter_change(self, *_args: object) -> None:
        query = self.search_var.get().strip().lower()
        filtered = [
            item
            for item, blob in self.search_index
            if not query or query in blob
        ]
        self.render_race_list(filtered)
        if self.current_race_id:
            self.race_state["selected"] = self.current_race_id
            self.update_row_styles(self.race_state)
