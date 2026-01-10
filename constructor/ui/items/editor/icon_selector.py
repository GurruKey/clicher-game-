import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, filedialog
from pathlib import Path
from PIL import Image, ImageTk
import shutil
import os
import re

from ...theme import (
    BG_COLOR, PANEL_BG, TEXT_COLOR, ACCENT_COLOR, TEXT_MUTED,
    ScrollableFrame, ModernButton, BUTTON_BG, ENTRY_BG
)

class IconSelectorDialog(tk.Toplevel):
    def __init__(self, parent, assets_root: Path, currencies_root: Path, current_icon: Path = None):
        super().__init__(parent)
        self.title("Select Icon")
        self.geometry("1000x700")
        self.configure(bg=BG_COLOR)
        
        self.assets_root = assets_root
        self.currencies_root = currencies_root
        self.archive_root = assets_root / "archive"
        self.archive_root.mkdir(parents=True, exist_ok=True)
        
        self.current_icon = current_icon
        self.selected_icons = [] # Changed to list for multi-selection
        self.selected_icon = None # Final selection for caller
        
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *args: self.refresh_grid())
        
        self.folder_search_var = tk.StringVar()
        self.folder_search_var.trace_add("write", lambda *args: self.refresh_folders())
        
        self.current_folder = self.assets_root
        self.photos = [] # To keep references to images
        
        self._setup_ui()
        self.refresh_data()
        
        self.transient(parent)
        self.grab_set()
        
    def _setup_ui(self):
        # Top Search Bar
        top_bar = tk.Frame(self, bg=PANEL_BG, pady=10, padx=10)
        top_bar.pack(fill="x")
        
        tk.Label(top_bar, text="Search:", bg=PANEL_BG, fg=TEXT_COLOR).pack(side="left", padx=(0, 5))
        search_entry = tk.Entry(top_bar, textvariable=self.search_var, bg=ENTRY_BG, fg=TEXT_COLOR, insertbackground=TEXT_COLOR)
        search_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        ModernButton(top_bar, text="New Folder", command=self.create_folder).pack(side="right")
        
        # Main Content Area
        paned = tk.PanedWindow(self, orient="horizontal", bg=BG_COLOR, sashwidth=4)
        paned.pack(fill="both", expand=True)
        
        # Sidebar for folders
        self.sidebar = tk.Frame(paned, bg=PANEL_BG, width=220)
        paned.add(self.sidebar)
        
        ModernButton(self.sidebar, text="Import Icons", command=self.import_icons).pack(fill="x", padx=10, pady=(10, 0))

        tk.Label(self.sidebar, text="Folders", bg=PANEL_BG, fg=ACCENT_COLOR, font=("Segoe UI", 10, "bold")).pack(pady=10)
        
        # Folder Search
        folder_search_frame = tk.Frame(self.sidebar, bg=PANEL_BG, padx=5, pady=5)
        folder_search_frame.pack(fill="x")
        tk.Label(folder_search_frame, text="Find:", bg=PANEL_BG, fg=TEXT_MUTED, font=("Segoe UI", 8)).pack(side="left")
        folder_search_entry = tk.Entry(folder_search_frame, textvariable=self.folder_search_var, bg=ENTRY_BG, fg=TEXT_COLOR, font=("Segoe UI", 8))
        folder_search_entry.pack(side="left", fill="x", expand=True, padx=(5, 0))

        # Use Treeview for subfolders
        self.folder_tree = ttk.Treeview(self.sidebar, show="tree", selectmode="browse", style="Dark.Treeview")
        self.folder_tree.pack(fill="both", expand=True)
        self.folder_tree.bind("<<TreeviewSelect>>", self.on_folder_select)

        # Folder actions
        folder_btns = tk.Frame(self.sidebar, bg=PANEL_BG, pady=5)
        folder_btns.pack(fill="x")
        ModernButton(folder_btns, text="Delete Folder", command=self.delete_folder, bg="#5a2a2a", fg="#ffcccc", font=("Segoe UI", 8)).pack(side="right", padx=5)
        
        # Grid Area
        grid_container = tk.Frame(paned, bg=BG_COLOR)
        paned.add(grid_container)
        
        self.scroll_frame = ScrollableFrame(grid_container, bg=BG_COLOR)
        self.scroll_frame.pack(fill="both", expand=True)
        
        self.grid_frame = self.scroll_frame.inner_frame
        
        # Bottom Bar for selection info
        bottom_bar = tk.Frame(self, bg=PANEL_BG, pady=10, padx=10)
        bottom_bar.pack(fill="x")
        
        self.info_label = tk.Label(bottom_bar, text="Select an icon", bg=PANEL_BG, fg=TEXT_COLOR)
        self.info_label.pack(side="left")
        
        ModernButton(bottom_bar, text="Cancel", command=self.destroy).pack(side="right", padx=5)
        self.delete_file_button = ModernButton(bottom_bar, text="Delete Selected", command=self.delete_files, bg="#5a2a2a", fg="#ffcccc", state="disabled")
        self.delete_file_button.pack(side="right", padx=5)
        self.move_button = ModernButton(bottom_bar, text="Move to Selected Folder", command=self.move_to_selected_folder, state="disabled")
        self.move_button.pack(side="right", padx=5)
        self.select_button = ModernButton(bottom_bar, text="Select", command=self.confirm_selection, state="disabled")
        self.select_button.pack(side="right", padx=5)

    def refresh_data(self):
        # Make sure New folder exists
        (self.assets_root / "New").mkdir(parents=True, exist_ok=True)
        self.icon_usage = self._get_icon_usage()
        self._organize_archive()
        self.refresh_folders()
        self.refresh_grid()

    def _get_icon_usage(self) -> dict[str, list[str]]:
        """Usage keyed by relative path from assets_root"""
        usage = {}
        if not self.currencies_root.exists():
            return usage
            
        # Scan all .js files in currencies_root
        for file in self.currencies_root.glob("*.js"):
            if file.name == "index.js":
                continue
            content = file.read_text(encoding="utf-8")
            # Extract icon relative path from import
            match = re.search(r'import\s+\w+\s+from\s+"\.\./\.\./assets/items/([^"]+)"', content)
            if match:
                rel_path = match.group(1).replace("/", os.sep)
                if rel_path not in usage:
                    usage[rel_path] = []
                usage[rel_path].append(file.stem)
        return usage

    def _organize_archive(self):
        # Scan all images in assets_root recursively
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
        all_images = []
        for ext in image_extensions:
            all_images.extend(list(self.assets_root.rglob(f"*{ext}")))
            
        for img_path in all_images:
            if not img_path.exists(): continue 
            rel_path = str(img_path.relative_to(self.assets_root))
            icon_name = img_path.name
            
            # Check if used by rel_path
            is_used = rel_path in self.icon_usage
            in_archive = "archive" in img_path.parts
            
            if is_used and in_archive:
                # Move out of archive to root of assets
                dest = self.assets_root / icon_name
                if not dest.exists():
                    try:
                        old_rel = rel_path
                        shutil.move(str(img_path), str(dest))
                        new_rel = icon_name
                        self.update_item_references(old_rel, new_rel)
                    except Exception as e:
                        print(f"Error moving {img_path} to root: {e}")
            elif not is_used and not in_archive:
                # Move to archive if not used and NOT in New folder
                if "New" not in img_path.parts:
                    dest = self.archive_root / icon_name
                    if not dest.exists():
                        try:
                            shutil.move(str(img_path), str(dest))
                        except Exception as e:
                            print(f"Error archiving {img_path}: {e}")

    def refresh_folders(self):
        search_query = self.folder_search_var.get().lower()
        
        # Save selection
        selection = self.folder_tree.selection()
        selected_id = selection[0] if selection else "all"

        # Clear existing items
        for item in self.folder_tree.get_children():
            self.folder_tree.delete(item)
            
        # Add special entries
        self.folder_tree.insert("", "end", iid="all", text="All")
        self.folder_tree.insert("", "end", iid="root", text="Root")
        
        def add_subfolders(parent_path: Path, parent_node: str) -> bool:
            """Returns True if any child (or self) matches search"""
            has_match = False
            try:
                # Get all subfolders first to check matches
                subdirs = [f for f in parent_path.iterdir() if f.is_dir()]
                for f in sorted(subdirs):
                    node_id = str(f.relative_to(self.assets_root))
                    name_matches = search_query in f.name.lower()
                    
                    # Temporarily insert to see if children match
                    child_has_match = add_subfolders(f, node_id)
                    
                    if name_matches or child_has_match:
                        self.folder_tree.insert(parent_node, "end", iid=node_id, text=f.name)
                        # We need to re-add children that matched
                        # This recursive logic is a bit tricky with Treeview. 
                        # Let's simplify: always add if search matches or child matches.
                        has_match = True
            except Exception:
                pass
            return has_match

        # Redefining add_subfolders for better search support
        def build_tree(parent_path: Path, parent_node: str):
            try:
                for f in sorted(parent_path.iterdir()):
                    if f.is_dir():
                        if f.name == "archive": continue # Archive is handled but maybe keep it?
                        node_id = str(f.relative_to(self.assets_root))
                        
                        # Search logic: should we show this folder?
                        # Show if name matches OR any descendant matches
                        should_show = not search_query or search_query in f.name.lower()
                        if not should_show and search_query:
                            # Check descendants
                            for descendant in f.rglob("*"):
                                if descendant.is_dir() and search_query in descendant.name.lower():
                                    should_show = True
                                    break
                        
                        if should_show:
                            self.folder_tree.insert(parent_node, "end", iid=node_id, text=f.name)
                            if search_query: # Auto expand if searching
                                self.folder_tree.item(node_id, open=True)
                            build_tree(f, node_id)
            except Exception:
                pass
        
        build_tree(self.assets_root, "")
        
        # Restore selection if exists
        if self.folder_tree.exists(selected_id):
            self.folder_tree.selection_set(selected_id)
        else:
            self.folder_tree.selection_set("all")

    def on_folder_select(self, event):
        selection = self.folder_tree.selection()
        if not selection:
            return
            
        node_id = selection[0]
        if node_id == "all":
            self.current_folder = None
        elif node_id == "root":
            self.current_folder = self.assets_root
        else:
            self.current_folder = self.assets_root / node_id
            
        self.refresh_grid()

    def refresh_grid(self):
        for widget in self.grid_frame.winfo_children():
            widget.destroy()
        self.photos = []
        
        search_query = self.search_var.get().lower()
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
        
        if self.current_folder is None:
            # All images
            images = []
            for ext in image_extensions:
                images.extend(list(self.assets_root.rglob(f"*{ext}")))
        else:
            # Specific folder (non-recursive)
            images = []
            for ext in image_extensions:
                images.extend(list(self.current_folder.glob(f"*{ext}")))
                
        # Filter by search
        if search_query:
            images = [img for img in images if search_query in img.name.lower()]
            
        # Display in grid
        columns = 5
        for i, img_path in enumerate(images):
            frame = tk.Frame(self.grid_frame, bg=BG_COLOR, padx=5, pady=5)
            frame.grid(row=i // columns, column=i % columns, sticky="nsew")
            
            try:
                img = Image.open(img_path)
                img.thumbnail((100, 100))
                photo = ImageTk.PhotoImage(img)
                self.photos.append(photo)
                
                rel_path = str(img_path.relative_to(self.assets_root))
                
                # Selection Color Check
                is_selected = img_path in self.selected_icons
                is_used = rel_path in self.icon_usage
                
                bg_color = PANEL_BG
                if is_selected:
                    # User: Green if okay (not used), Red if not (used)
                    bg_color = "#1f3b1f" if not is_used else "#3b1f1f" # Dark green or dark red
                    
                lbl = tk.Label(frame, image=photo, bg=bg_color, cursor="hand2", padx=2, pady=2)
                if is_selected:
                    # Border color
                    highlight = "#4caf50" if not is_used else "#f44336" # Bright green or bright red
                    lbl.config(highlightbackground=highlight, highlightthickness=2)
                    
                lbl.pack()
                lbl.img_path = img_path # Store path on widget
                lbl.bind("<Button-1>", lambda e, p=img_path: self.toggle_icon_selection(p, e))
                lbl.bind("<Double-Button-1>", lambda e, p=img_path: self.quick_select(p))
                
                # Add context menu
                lbl.bind("<Button-3>", lambda e, p=img_path: self.show_context_menu(e, p))

                name_lbl = tk.Label(frame, text=img_path.name, bg=BG_COLOR, fg=TEXT_COLOR, font=("Segoe UI", 8), wraplength=100)
                name_lbl.pack()
                
                if is_used:
                    items_used = self.icon_usage[rel_path]
                    usage_count = len(items_used)
                    usage_lbl = tk.Label(frame, text=f"Used in: {usage_count}", bg=BG_COLOR, fg=ACCENT_COLOR, font=("Segoe UI", 7))
                    usage_lbl.pack()
                else:
                    unused_lbl = tk.Label(frame, text="Not used", bg=BG_COLOR, fg="#4caf50", font=("Segoe UI", 7))
                    unused_lbl.pack()
                    
            except Exception as e:
                print(f"Error loading image {img_path}: {e}")

    def toggle_icon_selection(self, icon_path: Path, event=None):
        # Ctrl or Shift key for multi-select (or just toggle as it's convenient)
        # Let's use Ctrl or Shift for standard behavior
        multi = event and (event.state & 0x0004 or event.state & 0x0001) # Control or Shift
        
        if multi:
            if icon_path in self.selected_icons:
                self.selected_icons.remove(icon_path)
            else:
                self.selected_icons.append(icon_path)
        else:
            # Single selection (replace)
            if len(self.selected_icons) == 1 and self.selected_icons[0] == icon_path:
                 self.selected_icons = []
            else:
                 self.selected_icons = [icon_path]

        self.update_ui_state()
        self.refresh_grid()

    def update_ui_state(self):
        count = len(self.selected_icons)
        
        # Select button enabled if at least 1 icon is selected
        if count > 0:
            self.select_button.config(state="normal", bg="#2e7d32", fg="white")
        else:
            self.select_button.config(state="disabled", bg=BUTTON_BG, fg=TEXT_COLOR)
        
        self.delete_file_button.config(state="normal" if count > 0 else "disabled")
        self.move_button.config(state="normal" if count > 0 else "disabled")
        
        if count == 0:
            self.info_label.config(text="Select an icon", fg=TEXT_COLOR)
        elif count == 1:
            icon_path = self.selected_icons[0]
            rel_path = str(icon_path.relative_to(self.assets_root))
            is_used = rel_path in self.icon_usage
            usage_info = ""
            if is_used:
                items_used = self.icon_usage[rel_path]
                usage_info = f" | Used in ({len(items_used)}): {', '.join(items_used)}"
            
            self.info_label.config(text=f"Selected: {icon_path.name}{usage_info}", fg="#4caf50" if not is_used else "#f44336")
        else:
            self.info_label.config(text=f"Selected {count} icons", fg=TEXT_COLOR)

    def confirm_selection(self):
        if len(self.selected_icons) >= 1:
            self.selected_icon = self.selected_icons[0]
            self.destroy()

    def quick_select(self, icon_path: Path):
        self.selected_icons = [icon_path]
        self.confirm_selection()

    def create_folder(self):
        # Determine base path for the new folder
        selection = self.folder_tree.selection()
        base_path = self.assets_root
        if selection:
            node_id = selection[0]
            if node_id != "all" and node_id != "root":
                base_path = self.assets_root / node_id

        name = simpledialog.askstring("New Folder", f"Create folder in {base_path.name if base_path != self.assets_root else 'Root'}:", parent=self)
        if name:
            new_path = base_path / name
            try:
                new_path.mkdir(exist_ok=True)
                self.refresh_folders()
                # Expand parent and select new folder?
                rel_path = str(new_path.relative_to(self.assets_root))
                if self.folder_tree.exists(rel_path):
                    self.folder_tree.see(rel_path)
                    self.folder_tree.selection_set(rel_path)
            except Exception as e:
                messagebox.showerror("Error", f"Could not create folder: {e}")

    def delete_files(self):
        if not self.selected_icons: return
        
        # Filter used and unused
        used = []
        to_delete = []
        for icon_path in self.selected_icons:
            rel_path = str(icon_path.relative_to(self.assets_root))
            if rel_path in self.icon_usage:
                used.append(icon_path.name)
            else:
                to_delete.append(icon_path)
                
        if used:
            messagebox.showerror("Error", f"Cannot delete icons in use:\n{', '.join(used)}")
            return
            
        if not to_delete: return
        
        # Group by archive status
        in_archive = [p for p in to_delete if "archive" in p.parts]
        not_in_archive = [p for p in to_delete if "archive" not in p.parts]
        
        if not_in_archive:
            msg = f"Move {len(not_in_archive)} icons to archive?" if len(not_in_archive) > 1 else f"Move '{not_in_archive[0].name}' to archive?"
            if messagebox.askyesno("Confirm Archive", msg):
                for p in not_in_archive:
                    try:
                        dest = self.archive_root / p.name
                        if dest.exists():
                            dest = self.archive_root / f"{p.stem}_{os.urandom(2).hex()}{p.suffix}"
                        shutil.move(str(p), str(dest))
                    except Exception as e:
                        print(f"Error archiving {p}: {e}")
                        
        if in_archive:
            msg = f"Permanently delete {len(in_archive)} icons from archive?" if len(in_archive) > 1 else f"Permanently delete '{in_archive[0].name}' from archive?"
            if messagebox.askyesno("Confirm PERMANENT Deletion", msg):
                for p in in_archive:
                    try:
                        p.unlink()
                    except Exception as e:
                        print(f"Error deleting {p}: {e}")
                        
        self.selected_icons = []
        self.update_ui_state()
        self.refresh_grid()

    def delete_folder(self):
        selection = self.folder_tree.selection()
        if not selection: return
        node_id = selection[0]
        if node_id in ("all", "root"):
            messagebox.showwarning("Warning", "Cannot delete special folders.")
            return
            
        folder_path = self.assets_root / node_id
        if not folder_path.exists(): return
        
        # Check if any image inside is used
        used_files = []
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
        for ext in image_extensions:
            for img in folder_path.rglob(f"*{ext}"):
                rel = str(img.relative_to(self.assets_root))
                if rel in self.icon_usage:
                    used_files.append(img.name)
        
        if used_files:
            messagebox.showerror("Error", f"Cannot delete/archive folder. The following icons are in use:\n{', '.join(used_files)}")
            return
            
        in_archive = "archive" in folder_path.parts
        
        if not in_archive:
            if messagebox.askyesno("Confirm Archive", f"Move folder '{folder_path.name}' and its contents to archive?"):
                try:
                    dest = self.archive_root / folder_path.name
                    # Handle name collision for folder
                    if dest.exists():
                         dest = self.archive_root / f"{folder_path.name}_{os.urandom(2).hex()}"
                    
                    shutil.move(str(folder_path), str(dest))
                    self.refresh_folders()
                    self.refresh_grid()
                except Exception as e:
                    messagebox.showerror("Error", f"Could not move to archive: {e}")
        else:
            if messagebox.askyesno("Confirm PERMANENT Deletion", f"Folder '{folder_path.name}' is already in archive. Delete it and all contents PERMANENTLY?"):
                try:
                    shutil.rmtree(str(folder_path))
                    self.refresh_folders()
                    self.refresh_grid()
                except Exception as e:
                    messagebox.showerror("Error", f"Could not delete folder: {e}")

    def import_icons(self):
        files = filedialog.askopenfilenames(
            title="Select icons to import",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.gif *.webp"), ("All files", "*.*")]
        )
        if not files: return
        
        new_folder = self.assets_root / "New"
        new_folder.mkdir(parents=True, exist_ok=True)
        
        imported_count = 0
        for f in files:
            src = Path(f)
            dest = new_folder / src.name
            if dest.exists():
                dest = new_folder / f"{src.stem}_{os.urandom(2).hex()}{src.suffix}"
            try:
                shutil.copy2(src, dest)
                imported_count += 1
            except Exception as e:
                print(f"Error importing {src}: {e}")
        
        if imported_count > 0:
            self.refresh_data()
            self.folder_tree.selection_set("New")
            messagebox.showinfo("Import", f"Successfully imported {imported_count} icons to 'New' folder.")

    def move_to_selected_folder(self):
        if not self.selected_icons: return
        selection = self.folder_tree.selection()
        if not selection: return
        node_id = selection[0]
        
        if node_id == "all":
            dest_dir = self.assets_root
        elif node_id == "root":
            dest_dir = self.assets_root
        else:
            dest_dir = self.assets_root / node_id

        moved_count = 0
        for icon_path in list(self.selected_icons):
            if icon_path.parent == dest_dir:
                continue

            dest_path = dest_dir / icon_path.name
            if dest_path.exists():
                dest_path = dest_dir / f"{icon_path.stem}_{os.urandom(2).hex()}{icon_path.suffix}"

            try:
                old_rel = str(icon_path.relative_to(self.assets_root))
                shutil.move(str(icon_path), str(dest_path))
                new_rel = str(dest_path.relative_to(self.assets_root))
                
                self.update_item_references(old_rel, new_rel)
                moved_count += 1
            except Exception as e:
                print(f"Error moving {icon_path}: {e}")

        if moved_count > 0:
            self.selected_icons = []
            self.update_ui_state()
            self.refresh_grid()
            messagebox.showinfo("Move", f"Successfully moved {moved_count} icons to {dest_dir.name if dest_dir != self.assets_root else 'Root'}.")

    def show_context_menu(self, event, icon_path: Path):
        # If clicked on unselected icon, select only it.
        # If clicked on already selected icon, keep selection.
        if icon_path not in self.selected_icons:
             self.toggle_icon_selection(icon_path)
             
        menu = tk.Menu(self, tearoff=0, bg=PANEL_BG, fg=TEXT_COLOR, activebackground=ACCENT_COLOR)
        
        menu.add_command(label="Select", command=self.confirm_selection)
        menu.add_separator()
        
        move_menu = tk.Menu(menu, tearoff=0, bg=PANEL_BG, fg=TEXT_COLOR, activebackground=ACCENT_COLOR)
        menu.add_cascade(label="Move to...", menu=move_menu)
        
        # Add root
        move_menu.add_command(label="[Root]", command=lambda: self.move_to_path(icon_path, self.assets_root))
        
        # Add all folders
        folders = []
        for f in self.assets_root.rglob("*"):
            if f.is_dir() and "archive" not in f.parts:
                folders.append(f)
        
        for f in sorted(folders):
            rel = f.relative_to(self.assets_root)
            move_menu.add_command(label=str(rel), command=lambda path=f: self.move_to_path(icon_path, path))
            
        menu.add_separator()
        menu.add_command(label="Delete / Archive", command=self.delete_files)
        
        menu.post(event.x_root, event.y_root)

    def move_to_path(self, icon_path: Path, dest_dir: Path):
        # Batch move all selected icons to dest_dir
        if not self.selected_icons: return
        
        moved_count = 0
        for p in list(self.selected_icons):
            if p.parent == dest_dir: continue
            
            dest_path = dest_dir / p.name
            if dest_path.exists():
                dest_path = dest_dir / f"{p.stem}_{os.urandom(2).hex()}{p.suffix}"
            
            try:
                old_rel = str(p.relative_to(self.assets_root))
                shutil.move(str(p), str(dest_path))
                new_rel = str(dest_path.relative_to(self.assets_root))
                self.update_item_references(old_rel, new_rel)
                moved_count += 1
            except Exception as e:
                print(f"Error moving {p}: {e}")

        self.selected_icons = []
        self.update_ui_state()
        self.refresh_grid()

    def update_item_references(self, old_rel_path: str, new_rel_path: str):
        """Update .js files when an icon is moved. rel paths use os.sep."""
        old_js_path = old_rel_path.replace(os.sep, "/")
        new_js_path = new_rel_path.replace(os.sep, "/")
        
        for file in self.currencies_root.glob("*.js"):
            if file.name == "index.js": continue
            try:
                content = file.read_text(encoding="utf-8")
                old_import = f'../../assets/items/{old_js_path}'
                new_import = f'../../assets/items/{new_js_path}'
                if old_import in content:
                    new_content = content.replace(old_import, new_import)
                    file.write_text(new_content, encoding="utf-8")
            except Exception as e:
                print(f"Error updating reference in {file}: {e}")
