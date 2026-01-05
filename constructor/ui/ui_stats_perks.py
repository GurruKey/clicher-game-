import tkinter as tk


def create_stats_perks_view(
    parent: tk.Frame,
    stats: list[dict],
    perks: list[dict]
) -> None:
    container = tk.Frame(parent)
    container.pack(fill="both", expand=True, padx=12, pady=12)
    container.columnconfigure(0, weight=1)
    container.columnconfigure(1, weight=1)
    container.rowconfigure(0, weight=1)

    stats_frame = tk.Frame(container)
    stats_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 12))
    stats_frame.columnconfigure(0, weight=1)

    perks_frame = tk.Frame(container)
    perks_frame.grid(row=0, column=1, sticky="nsew")
    perks_frame.columnconfigure(0, weight=1)

    stats_title = tk.Label(stats_frame, text="Stats", font=("Segoe UI", 12, "bold"))
    stats_title.pack(anchor="nw")

    stats_list = tk.Listbox(stats_frame, height=16)
    stats_list.pack(fill="both", expand=True, pady=(8, 8))

    stats_detail = tk.Label(stats_frame, text="", justify="left", anchor="nw")
    stats_detail.pack(fill="x")

    perks_title = tk.Label(perks_frame, text="Perks", font=("Segoe UI", 12, "bold"))
    perks_title.pack(anchor="nw")

    perks_list = tk.Listbox(perks_frame, height=16)
    perks_list.pack(fill="both", expand=True, pady=(8, 8))

    perks_detail = tk.Label(perks_frame, text="", justify="left", anchor="nw")
    perks_detail.pack(fill="x")

    stats_sorted = sorted(stats, key=lambda item: item["label"].lower())
    perks_sorted = sorted(perks, key=lambda item: item["name"].lower())

    for stat in stats_sorted:
        stats_list.insert("end", stat["label"])

    for perk in perks_sorted:
        perks_list.insert("end", perk["name"])

    def show_stat_detail(index: int) -> None:
        if index < 0 or index >= len(stats_sorted):
            stats_detail.config(text="")
            return
        stat = stats_sorted[index]
        stats_detail.config(text=f"ID: {stat['id']}\nLabel: {stat['label']}")

    def show_perk_detail(index: int) -> None:
        if index < 0 or index >= len(perks_sorted):
            perks_detail.config(text="")
            return
        perk = perks_sorted[index]
        stats_lines = []
        for key, value in sorted(perk.get("stats", {}).items()):
            stats_lines.append(f"- {key}: {value}")
        if not stats_lines:
            stats_lines.append("- None")
        detail = [
            f"ID: {perk['id']}",
            f"Name: {perk['name']}",
            "",
            "Stats:",
            *stats_lines
        ]
        perks_detail.config(text="\n".join(detail))

    def on_stats_select(_event) -> None:
        selection = stats_list.curselection()
        if not selection:
            show_stat_detail(-1)
            return
        show_stat_detail(selection[0])

    def on_perks_select(_event) -> None:
        selection = perks_list.curselection()
        if not selection:
            show_perk_detail(-1)
            return
        show_perk_detail(selection[0])

    stats_list.bind("<<ListboxSelect>>", on_stats_select)
    perks_list.bind("<<ListboxSelect>>", on_perks_select)

    show_stat_detail(-1)
    show_perk_detail(-1)
