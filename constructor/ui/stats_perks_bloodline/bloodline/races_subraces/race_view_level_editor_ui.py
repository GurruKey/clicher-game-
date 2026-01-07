import tkinter as tk


def build_level_editor_ui(view) -> None:
    view.level_editor_active = False
    view.current_level_id = None

    view.level_action_row = tk.Frame(view.level_frame)
    view.level_action_row.pack(side="bottom", fill="x", pady=(10, 0))

    view.level_action_wrap = tk.Frame(view.level_action_row)
    view.level_action_wrap.pack(anchor="center")

    view.level_toggle_button = tk.Button(
        view.level_action_wrap, text="Create/Edit", width=12, height=2
    )
    view.level_toggle_button.pack(side="left")

    view.level_exit_button = tk.Button(
        view.level_action_wrap, text="Exit", width=12, height=2, state="disabled"
    )
    view.level_exit_button.pack(side="left", padx=(12, 0))

    # --- Parent frames are now the hidden frames from RaceViewBase ---
    # level_create_frame (replaces variants column)
    # level_edit_frame (replaces detail column)
    
    view.level_create_panel = tk.LabelFrame(view.level_create_frame, text="Create Level")
    
    view.level_edit_container = tk.Frame(view.level_edit_frame)
    view.level_edit_container.columnconfigure(0, weight=1, uniform="level_edit")
    view.level_edit_container.columnconfigure(1, weight=1, uniform="level_edit")
    view.level_edit_container.rowconfigure(0, weight=1)

    view.level_edit_panel = tk.LabelFrame(view.level_edit_container, text="Edit Level")
    view.level_edit_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 12))

    view.level_archive_panel = tk.LabelFrame(
        view.level_edit_container, text="Level Archive"
    )
    view.level_archive_panel.grid(row=0, column=1, sticky="nsew")

    view.level_create_level_var = tk.StringVar()
    view.level_create_stat_min_var = tk.StringVar()
    view.level_create_stat_max_var = tk.StringVar()
    view.level_create_perk_min_var = tk.StringVar()
    view.level_create_perk_max_var = tk.StringVar()
    view.level_create_note_var = tk.StringVar()
    view.level_create_notes: list[str] = []
    view.level_create_error_var = tk.StringVar()

    view.level_edit_level_var = tk.StringVar()
    view.level_edit_stat_min_var = tk.StringVar()
    view.level_edit_stat_max_var = tk.StringVar()
    view.level_edit_perk_min_var = tk.StringVar()
    view.level_edit_perk_max_var = tk.StringVar()
    view.level_edit_note_var = tk.StringVar()
    view.level_edit_notes: list[str] = []
    view.level_edit_error_var = tk.StringVar()

    _build_level_form(
        view,
        view.level_create_panel,
        view.level_create_level_var,
        view.level_create_stat_min_var,
        view.level_create_stat_max_var,
        view.level_create_perk_min_var,
        view.level_create_perk_max_var,
        view.level_create_note_var,
        "create"
    )

    view.level_create_error_label = tk.Label(
        view.level_create_panel,
        textvariable=view.level_create_error_var,
        fg="#b44"
    )
    view.level_create_error_label.pack(anchor="w", padx=10, pady=(6, 4))

    view.level_create_action_row = tk.Frame(view.level_create_panel)
    view.level_create_action_row.pack(fill="x", padx=10, pady=(6, 10))

    view.create_level_button = tk.Button(
        view.level_create_action_row, text="Create Level", width=14, height=2
    )
    view.create_level_button.pack(side="left")

    _build_level_form(
        view,
        view.level_edit_panel,
        view.level_edit_level_var,
        view.level_edit_stat_min_var,
        view.level_edit_stat_max_var,
        view.level_edit_perk_min_var,
        view.level_edit_perk_max_var,
        view.level_edit_note_var,
        "edit"
    )

    view.level_edit_error_label = tk.Label(
        view.level_edit_panel,
        textvariable=view.level_edit_error_var,
        fg="#b44"
    )
    view.level_edit_error_label.pack(anchor="w", padx=10, pady=(6, 4))

    view.level_edit_action_row = tk.Frame(view.level_edit_panel)
    view.level_edit_action_row.pack(fill="x", padx=10, pady=(6, 10))

    view.update_level_button = tk.Button(
        view.level_edit_action_row, text="Save Changes", width=14, height=2
    )
    view.update_level_button.pack(side="left")

    view.delete_level_button = tk.Button(
        view.level_edit_action_row, text="Delete", width=12, height=2
    )
    view.delete_level_button.pack(side="left", padx=(12, 0))

    view.level_archive_search_row = tk.Frame(view.level_archive_panel)
    view.level_archive_search_row.pack(fill="x", padx=10, pady=(10, 6))
    tk.Label(view.level_archive_search_row, text="Search").pack(side="left")
    view.level_archive_search_var = tk.StringVar()
    view.level_archive_search_entry = tk.Entry(
        view.level_archive_search_row,
        textvariable=view.level_archive_search_var,
        width=18
    )
    view.level_archive_search_entry.pack(side="left", padx=(6, 0))

    view.level_archive_frame = tk.Frame(view.level_archive_panel)
    view.level_archive_frame.pack(fill="both", expand=True, padx=10, pady=(0, 8))
    view.level_archive_list = tk.Listbox(
        view.level_archive_frame,
        selectmode="extended",
        exportselection=False
    )
    view.level_archive_list.pack(fill="both", expand=True)

    view.level_archive_detail = tk.Label(
        view.level_archive_panel, text="", anchor="w", justify="left", wraplength=220
    )
    view.level_archive_detail.pack(fill="x", padx=10, pady=(0, 6))

    view.level_archive_actions = tk.Frame(view.level_archive_panel)
    view.level_archive_actions.pack(fill="x", padx=10, pady=(0, 10), side="bottom")

    view.restore_level_button = tk.Button(
        view.level_archive_actions, text="Restore", width=12, height=2
    )
    view.restore_level_button.pack(side="left")

    view.delete_level_archive_button = tk.Button(
        view.level_archive_actions, text="Delete", width=12, height=2
    )
    view.delete_level_archive_button.pack(side="left", padx=(12, 0))


def _build_level_form(
    view,
    panel: tk.LabelFrame,
    level_var: tk.StringVar,
    stat_min_var: tk.StringVar,
    stat_max_var: tk.StringVar,
    perk_min_var: tk.StringVar,
    perk_max_var: tk.StringVar,
    note_var: tk.StringVar,
    mode: str
) -> None:
    level_row = tk.Frame(panel)
    level_row.pack(fill="x", padx=10, pady=(8, 4))
    tk.Label(level_row, text="Level").pack(side="left")
    level_entry = tk.Entry(level_row, textvariable=level_var, width=10)
    level_entry.pack(side="left", padx=(6, 0))

    stat_row = tk.Frame(panel)
    stat_row.pack(fill="x", padx=10, pady=(4, 4))
    tk.Label(stat_row, text="Stats Range").pack(side="left")
    tk.Label(stat_row, text="Min").pack(side="left", padx=(10, 2))
    stat_min_entry = tk.Entry(stat_row, textvariable=stat_min_var, width=6)
    stat_min_entry.pack(side="left")
    tk.Label(stat_row, text="Max").pack(side="left", padx=(10, 2))
    stat_max_entry = tk.Entry(stat_row, textvariable=stat_max_var, width=6)
    stat_max_entry.pack(side="left")

    perk_row = tk.Frame(panel)
    perk_row.pack(fill="x", padx=10, pady=(4, 8))
    tk.Label(perk_row, text="Perks Range").pack(side="left")
    tk.Label(perk_row, text="Min").pack(side="left", padx=(10, 2))
    perk_min_entry = tk.Entry(perk_row, textvariable=perk_min_var, width=6)
    perk_min_entry.pack(side="left")
    tk.Label(perk_row, text="Max").pack(side="left", padx=(10, 2))
    perk_max_entry = tk.Entry(perk_row, textvariable=perk_max_var, width=6)
    perk_max_entry.pack(side="left")

    notes_label = tk.Label(panel, text="Notes")
    notes_label.pack(anchor="w", padx=10, pady=(4, 4))

    note_entry_row = tk.Frame(panel)
    note_entry_row.pack(fill="x", padx=10, pady=(0, 6))
    note_entry = tk.Entry(note_entry_row, textvariable=note_var, width=24)
    note_entry.pack(side="left", fill="x", expand=True)
    add_button = tk.Button(note_entry_row, text="+", width=3)
    add_button.pack(side="left", padx=(6, 0))

    notes_list = tk.Listbox(panel, height=6, exportselection=False)
    notes_list.pack(fill="both", expand=True, padx=10)

    remove_row = tk.Frame(panel)
    remove_row.pack(fill="x", padx=10, pady=(6, 0))
    remove_button = tk.Button(remove_row, text="Remove Note", width=12)
    remove_button.pack(side="left")

    if mode == "create":
        view.level_create_level_entry = level_entry
        view.level_create_stat_min_entry = stat_min_entry
        view.level_create_stat_max_entry = stat_max_entry
        view.level_create_perk_min_entry = perk_min_entry
        view.level_create_perk_max_entry = perk_max_entry
        view.level_create_notes_list = notes_list
        view.level_create_add_note_button = add_button
        view.level_create_remove_note_button = remove_button
    else:
        view.level_edit_level_entry = level_entry
        view.level_edit_stat_min_entry = stat_min_entry
        view.level_edit_stat_max_entry = stat_max_entry
        view.level_edit_perk_min_entry = perk_min_entry
        view.level_edit_perk_max_entry = perk_max_entry
        view.level_edit_notes_list = notes_list
        view.level_edit_add_note_button = add_button
        view.level_edit_remove_note_button = remove_button
