import tkinter as tk

from ui.theme import (
    BUTTON_ACTIVE_BG,
    BUTTON_ACTIVE_FG,
    BUTTON_BG,
    BUTTON_HOVER_BG,
    DIVIDER_COLOR,
    TEXT_COLOR,
    TEXT_MUTED
)


class UIState:
    def __init__(self, root: tk.Tk, handlers: dict[str, callable]) -> None:
        header = tk.Frame(root)
        header.pack(fill="x", padx=24, pady=(16, 6), anchor="nw")
        self.header = header

        toolbar = tk.Frame(header)
        toolbar.pack(fill="x", anchor="nw")
        self.toolbar = toolbar

        self.items_button = tk.Button(
            toolbar, text="Items", command=handlers["items"]
        )
        self.items_button.pack(side="left")

        self.avatar_button = tk.Button(
            toolbar, text="Avatar", command=handlers["avatar"]
        )
        self.avatar_button.pack(side="left", padx=(12, 0))

        self.rarities_button = tk.Button(
            toolbar, text="Rarities", command=handlers["rarities"]
        )
        self.rarities_button.pack(side="left", padx=(12, 0))

        self.locations_button = tk.Button(
            toolbar, text="Locations", command=handlers["locations"]
        )
        self.locations_button.pack(side="left", padx=(12, 0))

        self.stats_perks_button = tk.Button(
            toolbar, text="Stats/Perks/Bloodline", command=handlers["stats_perks"]
        )
        self.stats_perks_button.pack(side="left", padx=(12, 0))

        self.map_button = tk.Button(
            toolbar, text="Map", command=handlers["map"]
        )
        self.map_button.pack(side="left", padx=(12, 0))

        self.help_button = tk.Button(
            toolbar, text="Help", command=handlers["help"]
        )
        self.help_button.pack(side="left", padx=(12, 0))

        self.exit_button = tk.Button(
            toolbar, text="Exit", command=handlers["exit"]
        )
        self.exit_button.pack(side="right")

        self.back_button = tk.Button(
            toolbar, text="Back", command=handlers["back"]
        )
        self.back_button.pack(side="left", padx=(12, 0))

        self.avatar_subbar = tk.Frame(header)
        self.avatars_info_button = tk.Button(
            self.avatar_subbar, text="Info", command=handlers["avatar_info"]
        )
        self.avatars_info_button.pack(side="left")
        self.avatar_icon_button = tk.Button(
            self.avatar_subbar,
            text="Icon Editor",
            command=handlers["avatar_editor"]
        )
        self.avatar_icon_button.pack(side="left", padx=(12, 0))

        self.stats_perks_subbar = tk.Frame(header)
        self.stats_info_button = tk.Button(
            self.stats_perks_subbar, text="Stats", command=handlers["stats_info"]
        )
        self.stats_info_button.pack(side="left")
        self.perks_info_button = tk.Button(
            self.stats_perks_subbar, text="Perks", command=handlers["perks_info"]
        )
        self.perks_info_button.pack(side="left", padx=(12, 0))
        self.bloodline_info_button = tk.Button(
            self.stats_perks_subbar,
            text="Bloodline",
            command=handlers["bloodline_info"]
        )
        self.bloodline_info_button.pack(side="left", padx=(12, 0))

        self.stats_subbar = tk.Frame(header)
        self.stats_menu_info_button = tk.Button(
            self.stats_subbar, text="Info", command=handlers["stats_info"]
        )
        self.stats_menu_info_button.pack(side="left")

        self.perks_subbar = tk.Frame(header)
        self.perks_menu_info_button = tk.Button(
            self.perks_subbar, text="Info", command=handlers["perks_info"]
        )
        self.perks_menu_info_button.pack(side="left")

        self.bloodline_subbar = tk.Frame(header)
        self.bloodline_menu_info_button = tk.Button(
            self.bloodline_subbar,
            text="Info",
            command=handlers["bloodline_info"]
        )
        self.bloodline_menu_info_button.pack(side="left")
        self.bloodline_race_button = tk.Button(
            self.bloodline_subbar,
            text="Race/Subraces",
            command=handlers["bloodline_race"]
        )
        self.bloodline_race_button.pack(side="left", padx=(12, 0))
        self.bloodline_gender_button = tk.Button(
            self.bloodline_subbar,
            text="Gender",
            command=handlers["bloodline_section"]
        )
        self.bloodline_gender_button.pack(side="left", padx=(12, 0))
        self.bloodline_origin_button = tk.Button(
            self.bloodline_subbar,
            text="Origin",
            command=handlers["bloodline_section"]
        )
        self.bloodline_origin_button.pack(side="left", padx=(12, 0))
        self.bloodline_faction_button = tk.Button(
            self.bloodline_subbar,
            text="Faction",
            command=handlers["bloodline_section"]
        )
        self.bloodline_faction_button.pack(side="left", padx=(12, 0))
        self.bloodline_subfaction_button = tk.Button(
            self.bloodline_subbar,
            text="Subfaction",
            command=handlers["bloodline_section"]
        )
        self.bloodline_subfaction_button.pack(side="left", padx=(12, 0))
        self.bloodline_subtype_button = tk.Button(
            self.bloodline_subbar,
            text="Subtype",
            command=handlers["bloodline_section"]
        )
        self.bloodline_subtype_button.pack(side="left", padx=(12, 0))

        self.help_subbar = tk.Frame(header)
        self.help_info_button = tk.Button(
            self.help_subbar, text="Info", command=handlers["help"]
        )
        self.help_info_button.pack(side="left")

        divider = tk.Frame(root, height=2, bg=DIVIDER_COLOR)
        divider.pack(fill="x", padx=24)
        self.divider = divider

        self.content_frame = tk.Frame(root)
        self.content_frame.pack(fill="both", expand=True)

    def _show_avatar_menu(self) -> None:
        self.avatar_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_avatar_menu(self) -> None:
        self.avatar_subbar.pack_forget()

    def _show_stats_perks_menu(self) -> None:
        self.stats_perks_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_stats_perks_menu(self) -> None:
        self.stats_perks_subbar.pack_forget()

    def _show_stats_menu(self) -> None:
        self.stats_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_stats_menu(self) -> None:
        self.stats_subbar.pack_forget()

    def _show_perks_menu(self) -> None:
        self.perks_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_perks_menu(self) -> None:
        self.perks_subbar.pack_forget()

    def _show_bloodline_menu(self) -> None:
        self.bloodline_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_bloodline_menu(self) -> None:
        self.bloodline_subbar.pack_forget()

    def _show_help_menu(self) -> None:
        self.help_subbar.pack(fill="x", pady=(6, 0), anchor="nw")

    def _hide_help_menu(self) -> None:
        self.help_subbar.pack_forget()

    def set_active_view(self, active: str | None) -> None:
        self.items_button.config(
            state="disabled" if active == "items" else "normal"
        )
        self.avatars_info_button.config(
            state="disabled" if active == "avatars" else "normal"
        )
        self.avatar_icon_button.config(
            state="disabled" if active == "avatar_editor" else "normal"
        )
        self.rarities_button.config(
            state="disabled" if active == "rarities" else "normal"
        )
        self.locations_button.config(
            state="disabled" if active == "locations" else "normal"
        )
        self.stats_perks_button.config(
            state="disabled"
            if active in (
                "stats_info",
                "perks_info",
                "bloodline_info",
                "bloodline_race"
            )
            else "normal"
        )
        self.stats_info_button.config(
            state="disabled" if active == "stats_info" else "normal"
        )
        self.stats_menu_info_button.config(
            state="disabled" if active == "stats_info" else "normal"
        )
        self.perks_info_button.config(
            state="disabled" if active == "perks_info" else "normal"
        )
        self.perks_menu_info_button.config(
            state="disabled" if active == "perks_info" else "normal"
        )
        self.bloodline_info_button.config(
            state="disabled" if active == "bloodline_info" else "normal"
        )
        self.bloodline_menu_info_button.config(
            state="disabled" if active == "bloodline_info" else "normal"
        )
        self.bloodline_race_button.config(
            state="disabled" if active == "bloodline_race" else "normal"
        )
        self.map_button.config(
            state="disabled" if active == "map" else "normal"
        )
        self.help_button.config(
            state="disabled" if active == "help" else "normal"
        )
        self.help_info_button.config(
            state="disabled" if active == "help" else "normal"
        )
        self.back_button.config(state="normal" if active else "disabled")
        self._apply_active_style(self.items_button, active == "items")
        self._apply_active_style(self.avatars_info_button, active == "avatars")
        self._apply_active_style(self.avatar_icon_button, active == "avatar_editor")
        self._apply_active_style(self.rarities_button, active == "rarities")
        self._apply_active_style(self.locations_button, active == "locations")
        self._apply_active_style(
            self.stats_perks_button,
            active in ("stats_info", "perks_info", "bloodline_info", "bloodline_race")
        )
        self._apply_active_style(self.stats_info_button, active == "stats_info")
        self._apply_active_style(self.stats_menu_info_button, active == "stats_info")
        self._apply_active_style(self.perks_info_button, active == "perks_info")
        self._apply_active_style(self.perks_menu_info_button, active == "perks_info")
        self._apply_active_style(
            self.bloodline_info_button, active == "bloodline_info"
        )
        self._apply_active_style(
            self.bloodline_menu_info_button, active == "bloodline_info"
        )
        self._apply_active_style(
            self.bloodline_race_button, active == "bloodline_race"
        )
        self._apply_active_style(self.map_button, active == "map")
        self._apply_active_style(self.help_button, active == "help")
        self._apply_active_style(self.help_info_button, active == "help")
        if active in ("avatars", "avatar_editor"):
            self._show_avatar_menu()
        else:
            self._hide_avatar_menu()
        if active in ("stats_info", "perks_info", "bloodline_info", "bloodline_race"):
            self._show_stats_perks_menu()
        else:
            self._hide_stats_perks_menu()
        if active == "stats_info":
            self._show_stats_menu()
        else:
            self._hide_stats_menu()
        if active == "perks_info":
            self._show_perks_menu()
        else:
            self._hide_perks_menu()
        if active in ("bloodline_info", "bloodline_race"):
            self._show_bloodline_menu()
        else:
            self._hide_bloodline_menu()
        if active == "help":
            self._show_help_menu()
        else:
            self._hide_help_menu()

    def _apply_active_style(self, button: tk.Button, is_active: bool) -> None:
        if is_active:
            button.config(
                relief="sunken",
                bg=BUTTON_ACTIVE_BG,
                fg=BUTTON_ACTIVE_FG,
                disabledforeground=BUTTON_ACTIVE_FG,
                activebackground=BUTTON_ACTIVE_BG,
                activeforeground=BUTTON_ACTIVE_FG
            )
            return
        button.config(
            relief="raised",
            bg=BUTTON_BG,
            fg=TEXT_COLOR,
            disabledforeground=TEXT_MUTED,
            activebackground=BUTTON_HOVER_BG,
            activeforeground=TEXT_COLOR
        )

    def all_buttons(self) -> list[tk.Button]:
        return [
            self.items_button,
            self.avatar_button,
            self.rarities_button,
            self.locations_button,
            self.stats_perks_button,
            self.map_button,
            self.help_button,
            self.exit_button,
            self.back_button,
            self.avatars_info_button,
            self.avatar_icon_button,
            self.stats_info_button,
            self.stats_menu_info_button,
            self.perks_info_button,
            self.perks_menu_info_button,
            self.bloodline_info_button,
            self.bloodline_menu_info_button,
            self.bloodline_race_button,
            self.bloodline_gender_button,
            self.bloodline_origin_button,
            self.bloodline_faction_button,
            self.bloodline_subfaction_button,
            self.bloodline_subtype_button,
            self.help_info_button
        ]
