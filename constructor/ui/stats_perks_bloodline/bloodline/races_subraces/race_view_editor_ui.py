import tkinter as tk

from ....theme import create_scrollbar


def build_editor_ui(view) -> None:
    view.editor_container = tk.Frame(view.paned)
    view.editor_container.columnconfigure(0, weight=1, uniform="editor")
    view.editor_container.columnconfigure(1, weight=1, uniform="editor")
    view.editor_container.columnconfigure(2, weight=1, uniform="editor")
    view.editor_container.columnconfigure(3, weight=1, uniform="editor")
    view.editor_container.columnconfigure(4, weight=1, uniform="editor")
    view.editor_container.rowconfigure(0, weight=1)

    view.race_archive_panel = tk.LabelFrame(
        view.editor_container, text="Race Archive"
    )
    view.race_archive_panel.grid(
        row=0, column=0, sticky="nsew", padx=(0, 12), pady=(0, 0)
    )

    view.race_editor = tk.LabelFrame(view.editor_container, text="Race Builder")
    view.race_editor.grid(
        row=0, column=1, sticky="nsew", padx=(0, 12), pady=(0, 0)
    )

    view.tag_editor = tk.LabelFrame(view.editor_container, text="Tag Builder")
    view.tag_editor.grid(
        row=0, column=2, sticky="nsew", padx=(0, 12), pady=(0, 0)
    )

    view.tag_archive_panel = tk.LabelFrame(
        view.editor_container, text="Tag Archive"
    )
    view.tag_archive_panel.grid(
        row=0, column=3, sticky="nsew", padx=(0, 12), pady=(0, 0)
    )

    view.tag_list_panel = tk.LabelFrame(view.editor_container, text="Tags")
    view.tag_list_panel.grid(row=0, column=4, sticky="nsew", pady=(0, 0))

    view.race_id_var = tk.StringVar()
    view.race_name_var = tk.StringVar()
    view.race_name_locked = tk.BooleanVar(value=True)
    view.race_error_var = tk.StringVar()
    view.current_race_id = None

    name_row = tk.Frame(view.race_editor)
    name_row.pack(fill="x", padx=10, pady=(8, 6))
    tk.Label(name_row, text="Id").pack(side="left")
    view.race_id_entry = tk.Entry(
        name_row, textvariable=view.race_id_var, width=16
    )
    view.race_id_entry.pack(side="left", padx=(6, 12))
    tk.Label(name_row, text="Name").pack(side="left")
    view.race_name_entry = tk.Entry(
        name_row, textvariable=view.race_name_var, width=18
    )
    view.race_name_entry.pack(side="left", padx=(6, 0))
    view.race_name_entry.config(state="disabled")

    view.name_lock = tk.Checkbutton(
        view.race_editor,
        text="Unlock Name",
        variable=view.race_name_locked,
        onvalue=False,
        offvalue=True
    )
    view.name_lock.pack(anchor="w", padx=10, pady=(4, 4))

    tk.Label(view.race_editor, text="Tags").pack(anchor="w", padx=10, pady=(4, 4))
    view.tag_listbox = tk.Listbox(
        view.race_editor,
        selectmode="multiple",
        height=8,
        exportselection=False
    )
    view.tag_listbox.pack(fill="both", expand=True, padx=10)

    view.race_error_label = tk.Label(
        view.race_editor, textvariable=view.race_error_var, fg="#b44"
    )
    view.race_error_label.pack(anchor="w", padx=10, pady=(6, 4))

    view.race_action_row = tk.Frame(view.race_editor)
    view.race_action_row.pack(fill="x", padx=10, pady=(6, 10))

    view.create_race_button = tk.Button(
        view.race_action_row, text="Create Race", width=12, height=2
    )
    view.create_race_button.pack(side="left")

    view.edit_race_button = tk.Button(
        view.race_action_row, text="Edit", width=12, height=2
    )
    view.edit_race_button.pack(side="left", padx=(12, 0))

    view.delete_race_button = tk.Button(
        view.race_action_row, text="Delete", width=12, height=2
    )
    view.delete_race_button.pack(side="left", padx=(12, 0))

    view.tag_id_var = tk.StringVar()
    view.tag_error_var = tk.StringVar()
    view.current_tag_id = None

    tag_input_row = tk.Frame(view.tag_editor)
    tag_input_row.pack(fill="x", padx=10, pady=(8, 6))
    tk.Label(tag_input_row, text="Tag").pack(side="left")
    view.tag_id_entry = tk.Entry(
        tag_input_row, textvariable=view.tag_id_var, width=22
    )
    view.tag_id_entry.pack(side="left", padx=(6, 0))

    view.tag_error_label = tk.Label(
        view.tag_editor, textvariable=view.tag_error_var, fg="#b44"
    )
    view.tag_error_label.pack(anchor="w", padx=10, pady=(4, 4))

    view.tag_action_row = tk.Frame(view.tag_editor)
    view.tag_action_row.pack(fill="x", padx=10, pady=(6, 10), side="bottom")

    view.create_tag_button = tk.Button(
        view.tag_action_row, text="Create Tag", width=12, height=2
    )
    view.create_tag_button.pack(side="left")

    view.edit_tag_button = tk.Button(
        view.tag_action_row, text="Edit", width=12, height=2
    )
    view.edit_tag_button.pack(side="left", padx=(12, 0))

    view.delete_tag_button = tk.Button(
        view.tag_action_row, text="Delete", width=12, height=2
    )
    view.delete_tag_button.pack(side="left", padx=(12, 0))

    view.tag_list_frame = tk.Frame(view.tag_list_panel)
    view.tag_list_frame.pack(fill="both", expand=True, padx=10, pady=(10, 10))

    view.tag_list_canvas = tk.Canvas(view.tag_list_frame, highlightthickness=0)
    view.tag_list_scrollbar = create_scrollbar(
        view.tag_list_frame, orient="vertical", command=view.tag_list_canvas.yview
    )
    view.tag_list_inner = tk.Frame(view.tag_list_canvas)
    view._bind_scroll_region(view.tag_list_canvas, view.tag_list_inner)
    view.tag_list_canvas.create_window(
        (0, 0), window=view.tag_list_inner, anchor="nw"
    )
    view.tag_list_canvas.configure(yscrollcommand=view.tag_list_scrollbar.set)
    view.tag_list_canvas.pack(side="left", fill="both", expand=True)
    view.tag_list_scrollbar.pack(side="right", fill="y")

    view.race_archive_search_row = tk.Frame(view.race_archive_panel)
    view.race_archive_search_row.pack(fill="x", padx=10, pady=(10, 6))
    tk.Label(view.race_archive_search_row, text="Search").pack(side="left")
    view.race_archive_search_var = tk.StringVar()
    view.race_archive_search_entry = tk.Entry(
        view.race_archive_search_row,
        textvariable=view.race_archive_search_var,
        width=18
    )
    view.race_archive_search_entry.pack(side="left", padx=(6, 0))

    view.race_archive_frame = tk.Frame(view.race_archive_panel)
    view.race_archive_frame.pack(fill="both", expand=True, padx=10, pady=(0, 8))
    view.race_archive_list = tk.Listbox(
        view.race_archive_frame,
        selectmode="extended",
        exportselection=False
    )
    view.race_archive_list.pack(fill="both", expand=True)

    view.race_archive_detail = tk.Label(
        view.race_archive_panel, text="", anchor="w", justify="left", wraplength=220
    )
    view.race_archive_detail.pack(fill="x", padx=10, pady=(0, 6))

    view.race_archive_actions = tk.Frame(view.race_archive_panel)
    view.race_archive_actions.pack(fill="x", padx=10, pady=(0, 10), side="bottom")

    view.restore_race_button = tk.Button(
        view.race_archive_actions, text="Restore", width=12, height=2
    )
    view.restore_race_button.pack(side="left")

    view.delete_race_archive_button = tk.Button(
        view.race_archive_actions, text="Delete", width=12, height=2
    )
    view.delete_race_archive_button.pack(side="left", padx=(12, 0))

    view.tag_archive_search_row = tk.Frame(view.tag_archive_panel)
    view.tag_archive_search_row.pack(fill="x", padx=10, pady=(10, 6))
    tk.Label(view.tag_archive_search_row, text="Search").pack(side="left")
    view.tag_archive_search_var = tk.StringVar()
    view.tag_archive_search_entry = tk.Entry(
        view.tag_archive_search_row,
        textvariable=view.tag_archive_search_var,
        width=18
    )
    view.tag_archive_search_entry.pack(side="left", padx=(6, 0))

    view.tag_archive_frame = tk.Frame(view.tag_archive_panel)
    view.tag_archive_frame.pack(fill="both", expand=True, padx=10, pady=(0, 8))
    view.tag_archive_list = tk.Listbox(
        view.tag_archive_frame,
        selectmode="extended",
        exportselection=False
    )
    view.tag_archive_list.pack(fill="both", expand=True)

    view.tag_archive_actions = tk.Frame(view.tag_archive_panel)
    view.tag_archive_actions.pack(fill="x", padx=10, pady=(0, 10), side="bottom")

    view.restore_tag_button = tk.Button(
        view.tag_archive_actions, text="Restore", width=12, height=2
    )
    view.restore_tag_button.pack(side="left")

    view.delete_tag_archive_button = tk.Button(
        view.tag_archive_actions, text="Delete", width=12, height=2
    )
    view.delete_tag_archive_button.pack(side="left", padx=(12, 0))
