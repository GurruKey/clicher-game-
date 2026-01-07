import tkinter as tk

from ui.theme import (
    BUTTON_ACTIVE_BG,
    BUTTON_ACTIVE_FG,
    BUTTON_BG,
    BUTTON_HOVER_BG,
    DIVIDER_COLOR,
    TEXT_COLOR,
    TEXT_MUTED,
    ACCENT_COLOR
)


class UIState:
    def __init__(self, root: tk.Tk, handlers: dict[str, callable]) -> None:
        header = tk.Frame(root)
        header.pack(fill="x", padx=24, pady=(16, 6), anchor="nw")
        self.header = header

        toolbar = tk.Frame(header)
        toolbar.pack(fill="x", anchor="nw")
        self.toolbar = toolbar

        self.items_button = tk.Button(toolbar, text="Items", command=handlers["items"])
        self.items_button.pack(side="left")

        self.avatar_button = tk.Button(toolbar, text="Avatar", command=handlers["avatar"])
        self.avatar_button.pack(side="left", padx=(12, 0))

        self.rarities_button = tk.Button(toolbar, text="Rarities", command=handlers["rarities"])
        self.rarities_button.pack(side="left", padx=(12, 0))

        self.locations_button = tk.Button(toolbar, text="Locations", command=handlers["locations"])
        self.locations_button.pack(side="left", padx=(12, 0))

        self.stats_perks_button = tk.Button(toolbar, text="Stats/Res/Perks/Bloodline", command=handlers["stats_perks"])
        self.stats_perks_button.pack(side="left", padx=(12, 0))

        self.map_button = tk.Button(toolbar, text="Map", command=handlers["map"])
        self.map_button.pack(side="left", padx=(12, 0))

        self.help_button = tk.Button(toolbar, text="Help", command=handlers["help"])
        self.help_button.pack(side="left", padx=(12, 0))

        self.exit_button = tk.Button(toolbar, text="Exit", command=handlers["exit"])
        self.exit_button.pack(side="right")

        self.back_button = tk.Button(toolbar, text="Back", command=handlers["back"])
        self.back_button.pack(side="left", padx=(12, 0))

        # --- LEVEL 2 SUBBARS ---
        self.avatar_subbar = tk.Frame(header)
        self.avatars_info_button = tk.Button(self.avatar_subbar, text="Info", command=handlers["avatar_info"])
        self.avatars_info_button.pack(side="left")
        self.avatar_icon_button = tk.Button(self.avatar_subbar, text="Icon Editor", command=handlers["avatar_editor"])
        self.avatar_icon_button.pack(side="left", padx=(12, 0))

        self.stats_perks_group_subbar = tk.Frame(header)
        self.stats_group_btn = tk.Button(self.stats_perks_group_subbar, text="Stats", command=handlers["stats_info"])
        self.stats_group_btn.pack(side="left")
        self.res_group_btn = tk.Button(self.stats_perks_group_subbar, text="Resources", command=handlers["resources_info"])
        self.res_group_btn.pack(side="left", padx=(12, 0))
        self.perks_group_btn = tk.Button(self.stats_perks_group_subbar, text="Perks", command=handlers["perks_info"])
        self.perks_group_btn.pack(side="left", padx=(12, 0))
        self.bloodline_group_btn = tk.Button(self.stats_perks_group_subbar, text="Bloodline", command=handlers["bloodline_info"])
        self.bloodline_group_btn.pack(side="left", padx=(12, 0))

        # --- LEVEL 3 SUBBARS ---
        self.stats_section_subbar = tk.Frame(header)
        self.stats_info_btn = tk.Button(self.stats_section_subbar, text="Info", command=handlers["stats_info"])
        self.stats_info_btn.pack(side="left")
        self.stats_config_btn = tk.Button(self.stats_section_subbar, text="Display Order", command=handlers["stats_config"])
        self.stats_config_btn.pack(side="left", padx=(12, 0))

        self.resources_section_subbar = tk.Frame(header)
        self.resources_info_btn = tk.Button(self.resources_section_subbar, text="Info", state="disabled")
        self.resources_info_btn.pack(side="left")

        self.perks_section_subbar = tk.Frame(header)
        self.perks_info_btn = tk.Button(self.perks_section_subbar, text="Info", state="disabled")
        self.perks_info_btn.pack(side="left")

        self.bloodline_section_subbar = tk.Frame(header)
        self.bloodline_info_btn = tk.Button(self.bloodline_section_subbar, text="Info", command=handlers["bloodline_info"])
        self.bloodline_info_btn.pack(side="left")
        self.bloodline_race_btn = tk.Button(self.bloodline_section_subbar, text="Race/Subraces", command=handlers["bloodline_race"])
        self.bloodline_race_btn.pack(side="left", padx=(12, 0))

        divider = tk.Frame(root, height=2, bg=DIVIDER_COLOR)
        divider.pack(fill="x", padx=24)
        self.divider = divider

        self.content_frame = tk.Frame(root)
        self.content_frame.pack(fill="both", expand=True)

    def set_active_view(self, active: str | None) -> None:
        # Detect Groups
        is_avatar = active in ("avatars", "avatar_editor")
        is_stats_perks_group = active in ("stats_info", "stats_config", "resources_info", "perks_info", "bloodline_info", "bloodline_race")
        
        # 1. Main Styles
        self._apply_active_style(self.items_button, active == "items")
        self._apply_active_style(self.avatar_button, is_avatar)
        self._apply_active_style(self.rarities_button, active == "rarities")
        self._apply_active_style(self.locations_button, active == "locations")
        self._apply_active_style(self.stats_perks_button, is_stats_perks_group)
        self._apply_active_style(self.map_button, active == "map")
        self._apply_active_style(self.help_button, active == "help")

        # 2. Level 2 (Category) Styles
        self._apply_active_style(self.stats_group_btn, active in ("stats_info", "stats_config"))
        self._apply_active_style(self.res_group_btn, active == "resources_info")
        self._apply_active_style(self.perks_group_btn, active == "perks_info")
        self._apply_active_style(self.bloodline_group_btn, active in ("bloodline_info", "bloodline_race"))
        
        # 3. Level 3 (Section) Styles
        self._apply_active_style(self.stats_info_btn, active == "stats_info")
        self._apply_active_style(self.stats_config_btn, active == "stats_config")
        self._apply_active_style(self.resources_info_btn, active == "resources_info")
        self._apply_active_style(self.perks_info_btn, active == "perks_info")
        self._apply_active_style(self.bloodline_info_btn, active == "bloodline_info")
        self._apply_active_style(self.bloodline_race_btn, active == "bloodline_race")

        # 4. Visibility Control
        for bar in (self.avatar_subbar, self.stats_perks_group_subbar, self.stats_section_subbar, 
                    self.resources_section_subbar, self.perks_section_subbar, self.bloodline_section_subbar):
            bar.pack_forget()

        if is_avatar:
            self.avatar_subbar.pack(fill="x", pady=(6, 0), anchor="nw")
        elif is_stats_perks_group:
            self.stats_perks_group_subbar.pack(fill="x", pady=(6, 0), anchor="nw")
            if active in ("stats_info", "stats_config"): self.stats_section_subbar.pack(fill="x", pady=(6, 0), anchor="nw")
            elif active == "resources_info": self.resources_section_subbar.pack(fill="x", pady=(6, 0), anchor="nw")
            elif active == "perks_info": self.perks_section_subbar.pack(fill="x", pady=(6, 0), anchor="nw")
            elif active in ("bloodline_info", "bloodline_race"): self.bloodline_section_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

        self.back_button.config(state="normal" if active else "disabled")

    def _apply_active_style(self, button: tk.Button, is_active: bool) -> None:
        if is_active:
            # RESTORED: BUTTON_ACTIVE_FG (Yellow) for both normal and disabled state
            button.config(
                relief="sunken", 
                bg=BUTTON_ACTIVE_BG, 
                fg=BUTTON_ACTIVE_FG, 
                state="disabled", 
                disabledforeground=BUTTON_ACTIVE_FG
            )
        else:
            button.config(
                relief="raised", 
                bg=BUTTON_BG, 
                fg=TEXT_COLOR, 
                state="normal"
            )

    def all_buttons(self) -> list[tk.Button]:
        return [
            self.items_button, self.avatar_button, self.rarities_button, self.locations_button, 
            self.stats_perks_button, self.map_button, self.help_button, self.exit_button, self.back_button,
            self.avatars_info_button, self.avatar_icon_button, self.stats_group_btn, self.res_group_btn,
            self.perks_group_btn, self.bloodline_group_btn, self.bloodline_info_btn, self.bloodline_race_btn,
            self.stats_info_btn, self.stats_config_btn, self.resources_info_btn, self.perks_info_btn
        ]
