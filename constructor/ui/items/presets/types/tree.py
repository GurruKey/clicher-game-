import tkinter as tk
from tkinter import ttk
from ....theme import BG_COLOR, TEXT_COLOR, create_scrollbar

def create_types_tree(
    parent: tk.Frame,
    item_types: list[dict],
    on_select: callable
) -> tk.Frame:
    list_view_container = tk.Frame(parent, bg=BG_COLOR)
    
    # Search bar at top
    search_row = tk.Frame(list_view_container, bg=BG_COLOR)
    search_row.pack(fill="x", padx=10, pady=(0, 10))
    tk.Label(search_row, text="Search", bg=BG_COLOR, fg=TEXT_COLOR).pack(side="left")
    search_var = tk.StringVar()
    search_entry = tk.Entry(search_row, textvariable=search_var)
    search_entry.pack(side="left", fill="x", expand=True, padx=(8, 0))

    tree_frame = tk.Frame(list_view_container, bg=BG_COLOR)
    tree_frame.pack(fill="both", expand=True)
    
    tree = ttk.Treeview(
        tree_frame, 
        columns=("label"), 
        show="tree", 
        selectmode="browse",
        style="Dark.Treeview"
    )
    tree.pack(side="left", fill="both", expand=True)
    
    scrollbar = create_scrollbar(tree_frame, orient="vertical", command=tree.yview)
    
    def auto_set_scroll(first, last):
        if float(first) <= 0.0 and float(last) >= 1.0:
            scrollbar.pack_forget()
        else:
            scrollbar.pack(side="right", fill="y")
        scrollbar.set(first, last)

    tree.configure(yscrollcommand=auto_set_scroll)

    # Build hierarchy
    categories = {}
    for item in item_types:
        cat = item.get("category", "")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)

    # Render Tree
    tree_nodes = {}
    
    def get_or_create_node(cat_path: str):
        if not cat_path:
            return ""
        if cat_path in tree_nodes:
            return tree_nodes[cat_path]
        
        parts = [p.strip() for p in cat_path.split("/")]
        parent = ""
        current_path = ""
        for part in parts:
            prev_path = current_path
            current_path = f"{current_path}/{part}" if current_path else part
            if current_path not in tree_nodes:
                tree_nodes[current_path] = tree.insert(prev_path, "end", text=part, open=True)
        return tree_nodes[cat_path]

    for cat, items in categories.items():
        parent_node = get_or_create_node(cat)
        for item in items:
            node = tree.insert(parent_node, "end", text=item["label"], tags=(item["id"],))
            tree_nodes[item["id"]] = node

    def on_tree_select(event):
        selected = tree.selection()
        if not selected: return
        node_id = selected[0]
        tags = tree.item(node_id, "tags")
        if tags:
            item_id = tags[0]
            item = next((i for i in item_types if i["id"] == item_id), None)
            if item:
                on_select(item)

    tree.bind("<<TreeviewSelect>>", on_tree_select)

    def on_search(*args):
        query = search_var.get().lower()
        # Simple search - focus and highlight node
        for item in item_types:
            if query in item["label"].lower() or query in item["id"].lower():
                node = tree_nodes.get(item["id"])
                if node:
                    tree.see(node)
                    tree.selection_set(node)
                    break

    search_var.trace_add("write", on_search)
    
    return list_view_container
