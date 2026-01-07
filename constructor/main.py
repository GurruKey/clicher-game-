import sys
from pathlib import Path
import shutil
import tkinter as tk

# Ensure constructor directory is in sys.path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

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
    root.geometry(f"{min(1280, screen_width)}x{min(720, screen_height)}")
    root.minsize(640, 360)

    paths = build_paths(current_dir)
    help_sources = build_help_sources(paths)
    data = load_app_data(paths)
    view_builders = ViewBuilders(paths, data, help_sources)

    views = {}
    current_view_name = [None] 

    def show_view(name, builder, force=False):
        if current_view_name[0] and current_view_name[0] in views:
            views[current_view_name[0]].pack_forget()
        
        if force and name in views:
            views[name].destroy()
            del views[name]
            
        if name and name not in views:
            frame = tk.Frame(ui.content_frame)
            builder(frame)
            views[name] = frame
            
        if name:
            views[name].pack(fill="both", expand=True)
            current_view_name[0] = name
            ui.set_active_view(name)
        else:
            current_view_name[0] = None
            ui.set_active_view(None)

    view_builders.set_show_view_callback(show_view)

    def handle_exit():
        for cache in current_dir.rglob("__pycache__"):
            shutil.rmtree(cache, ignore_errors=True)
        root.destroy()

    ui = UIState(root, handlers={
        "items": lambda: show_view("items", view_builders.build_items_view),
        "avatar": lambda: show_view("avatars", view_builders.build_avatars_view, view_builders.consume_avatars_dirty()),
        "avatar_info": lambda: show_view("avatars", view_builders.build_avatars_view),
        "avatar_editor": lambda: show_view("avatar_editor", view_builders.build_avatar_editor_view),
        "rarities": lambda: show_view("rarities", view_builders.build_rarities_view),
        "locations": lambda: show_view("locations", view_builders.build_locations_view),
        
        # Stats & Perks entry opens Stats by default
        "stats_perks": lambda: show_view("stats_info", view_builders.build_stats_info_view),
        
        # Sub-menu button handlers
        "stats_info": lambda: show_view("stats_info", view_builders.build_stats_info_view),
        "stats_config": lambda: show_view("stats_config", view_builders.build_stats_config_view, True),
        "resources_info": lambda: show_view("resources_info", view_builders.build_resources_info_view),
        "perks_info": lambda: show_view("perks_info", view_builders.build_perks_info_view),
        
        "bloodline_info": lambda: show_view("bloodline_info", view_builders.build_bloodline_info_view),
        "bloodline_race": lambda: show_view("bloodline_race", view_builders.build_bloodline_race_view),
        "map": lambda: show_view("map", view_builders.build_map_view),
        "help": lambda: show_view("help", view_builders.build_help_view),
        "exit": handle_exit,
        "back": lambda: show_view(None, None)
    })

    loading = LoadingOverlay.create(root, paths.images_root)

    def preload():
        loading.show_loading()
        tasks = [
            ("items", view_builders.build_items_view),
            ("avatars", view_builders.build_avatars_view),
            ("stats_info", view_builders.build_stats_info_view),
            ("perks_info", view_builders.build_perks_info_view),
            ("resources_info", view_builders.build_resources_info_view)
        ]
        def run():
            if not tasks:
                loading.show_ready(); ui.set_active_view(None); return
            name, b = tasks.pop(0)
            if name not in views:
                f = tk.Frame(ui.content_frame); b(f); views[name] = f
            root.after(10, run)
        run()

    ui.set_active_view(None)
    root.after(10, preload)
    root.mainloop()

if __name__ == "__main__":
    main()
