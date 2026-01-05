from pathlib import Path
import shutil
import tkinter as tk

from app_context import build_help_sources, build_paths, load_app_data
from app_ui import UIState
from app_views import ViewBuilders
from ui.loading_overlay import LoadingOverlay
from ui.theme import apply_dark_theme


def main() -> None:
    root = tk.Tk()
    root.title("Click Constructor")
    apply_dark_theme(root)
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    window_width = min(1280, screen_width)
    window_height = min(720, screen_height)
    root.geometry(f"{window_width}x{window_height}")
    root.minsize(640, 360)
    root.maxsize(screen_width, screen_height)

    paths = build_paths(Path(__file__).resolve().parent)
    help_sources = build_help_sources(paths)
    data = load_app_data(paths)
    view_builders = ViewBuilders(paths, data, help_sources)

    views: dict[str, tk.Frame] = {}
    current_view: str | None = None

    def hide_current_view() -> None:
        nonlocal current_view
        if current_view and current_view in views:
            views[current_view].pack_forget()
        current_view = None

    def clear_content() -> None:
        hide_current_view()
        ui.set_active_view(None)

    def ensure_view(name: str, builder, force_rebuild: bool = False) -> None:
        if force_rebuild and name in views:
            views[name].destroy()
            del views[name]
        if name not in views:
            frame = tk.Frame(ui.content_frame)
            builder(frame)
            views[name] = frame

    def show_view(name: str, builder, force_rebuild: bool = False) -> None:
        nonlocal current_view
        if current_view and current_view in views:
            views[current_view].pack_forget()
        ensure_view(name, builder, force_rebuild=force_rebuild)
        views[name].pack(fill="both", expand=True)
        current_view = name

    def handle_items_click() -> None:
        show_view("items", view_builders.build_items_view)
        ui.set_active_view("items")

    def handle_avatars_click() -> None:
        show_view(
            "avatars",
            view_builders.build_avatars_view,
            force_rebuild=view_builders.consume_avatars_dirty()
        )
        ui.set_active_view("avatars")

    def handle_avatar_editor_click() -> None:
        show_view("avatar_editor", view_builders.build_avatar_editor_view)
        ui.set_active_view("avatar_editor")

    def handle_rarities_click() -> None:
        show_view("rarities", view_builders.build_rarities_view)
        ui.set_active_view("rarities")

    def handle_locations_click() -> None:
        show_view("locations", view_builders.build_locations_view)
        ui.set_active_view("locations")

    def handle_map_click() -> None:
        show_view("map", view_builders.build_map_view)
        ui.set_active_view("map")

    def handle_help_click() -> None:
        show_view("help", view_builders.build_help_view)
        ui.set_active_view("help")

    def handle_stats_info_click() -> None:
        show_view("stats_info", view_builders.build_stats_info_view)
        ui.set_active_view("stats_info")

    def handle_perks_info_click() -> None:
        show_view("perks_info", view_builders.build_perks_info_view)
        ui.set_active_view("perks_info")

    def handle_bloodline_info_click() -> None:
        show_view("bloodline_info", view_builders.build_bloodline_info_view)
        ui.set_active_view("bloodline_info")

    def handle_bloodline_race_click() -> None:
        show_view("bloodline_race", view_builders.build_bloodline_race_view)
        ui.set_active_view("bloodline_race")

    def handle_stats_perks_click() -> None:
        handle_stats_info_click()

    def handle_bloodline_section_click() -> None:
        return

    def handle_exit() -> None:
        for cache_dir in Path(__file__).resolve().parent.rglob("__pycache__"):
            if cache_dir.is_dir():
                shutil.rmtree(cache_dir, ignore_errors=True)
        root.destroy()

    ui = UIState(
        root,
        handlers={
            "items": handle_items_click,
            "avatar": handle_avatars_click,
            "rarities": handle_rarities_click,
            "locations": handle_locations_click,
            "stats_perks": handle_stats_perks_click,
            "map": handle_map_click,
            "help": handle_help_click,
            "exit": handle_exit,
            "back": clear_content,
            "avatar_info": handle_avatars_click,
            "avatar_editor": handle_avatar_editor_click,
            "stats_info": handle_stats_info_click,
            "perks_info": handle_perks_info_click,
            "bloodline_info": handle_bloodline_info_click,
            "bloodline_race": handle_bloodline_race_click,
            "bloodline_section": handle_bloodline_section_click
        }
    )

    loading_overlay = LoadingOverlay.create(root, paths.images_root)

    def preload_views() -> None:
        buttons = ui.all_buttons()
        for button in buttons:
            button.config(state="disabled")
        loading_overlay.show_loading()

        tasks = [
            ("items", view_builders.build_items_view),
            ("avatars", view_builders.build_avatars_view),
            ("avatar_editor", view_builders.build_avatar_editor_view),
            ("rarities", view_builders.build_rarities_view),
            ("locations", view_builders.build_locations_view),
            ("stats_info", view_builders.build_stats_info_view),
            ("perks_info", view_builders.build_perks_info_view),
            ("bloodline_info", view_builders.build_bloodline_info_view),
            ("bloodline_race", view_builders.build_bloodline_race_view),
            ("map", view_builders.build_map_view),
            ("help", view_builders.build_help_view)
        ]

        def run_next() -> None:
            if not tasks:
                loading_overlay.show_ready()
                for button in buttons:
                    button.config(state="normal")
                ui.set_active_view(None)
                return
            name, builder = tasks.pop(0)
            ensure_view(name, builder)
            root.after(10, run_next)

        run_next()

    ui.set_active_view(None)
    loading_overlay.show_loading()
    root.after(10, preload_views)
    root.mainloop()


if __name__ == "__main__":
    main()
