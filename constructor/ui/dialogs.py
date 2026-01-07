import tkinter as tk
from tkinter import ttk

class ReassignDialog(tk.Toplevel):
    def __init__(self, parent, title, message, candidates):
        super().__init__(parent)
        self.title(title)
        self.result = None
        
        # Center on parent
        x = parent.winfo_rootx() + 50
        y = parent.winfo_rooty() + 50
        self.geometry(f"+{x}+{y}")
        
        # Added justify="left" for multi-line messages
        tk.Label(self, text=message, pady=10, padx=10, justify="left").pack()
        
        self.var = tk.StringVar()
        combo = ttk.Combobox(self, textvariable=self.var, values=candidates, state="readonly", width=30)
        combo.pack(pady=5, padx=10)
        if candidates:
            combo.current(0)
            
        btn_frame = tk.Frame(self)
        btn_frame.pack(pady=10)
        
        tk.Button(btn_frame, text="Confirm", command=self.on_ok, width=10).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Cancel", command=self.destroy, width=10).pack(side="left", padx=5)
        
        self.transient(parent)
        self.grab_set()
        self.wait_window(self)
        
    def on_ok(self):
        self.result = self.var.get()
        self.destroy()

class RenameDialog(tk.Toplevel):
    def __init__(self, parent, title, current_name, existing_names):
        super().__init__(parent)
        self.title(title)
        self.result = None
        
        # Center on parent
        x = parent.winfo_rootx() + 50
        y = parent.winfo_rooty() + 50
        self.geometry(f"+{x}+{y}")
        
        tk.Label(self, text="New Name (Rename) or Existing Stat (Merge):", pady=(10, 5)).pack()
        
        self.var = tk.StringVar(value=current_name)
        # Combobox allows typing a new name OR selecting an existing one
        self.combo = ttk.Combobox(self, textvariable=self.var, values=existing_names, width=30)
        self.combo.pack(pady=5, padx=10)
        
        tk.Label(self, text="• Enter a NEW name to rename this stat and update references.\n• Select an EXISTING stat to merge this stat into it.", 
                 justify="left", fg="#666", wraplength=300).pack(pady=10, padx=10)
        
        btn_frame = tk.Frame(self)
        btn_frame.pack(pady=10)
        
        tk.Button(btn_frame, text="Confirm", command=self.on_ok, width=10).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Cancel", command=self.destroy, width=10).pack(side="left", padx=5)
        
        self.transient(parent)
        self.grab_set()
        self.wait_window(self)
        
    def on_ok(self):
        val = self.var.get().strip()
        if val:
            self.result = val
            self.destroy()

class DeleteConflictDialog(tk.Toplevel):
    def __init__(self, parent, stat_name, dependents, candidates, outgoing=None):
        super().__init__(parent)
        self.title(f"Deleting {stat_name}")
        self.action = "cancel"
        self.target_label = None
        
        # Center on parent
        x = parent.winfo_rootx() + 50
        y = parent.winfo_rooty() + 50
        self.geometry(f"+{x}+{y}")
        
        msg = ""
        if dependents:
            msg += f"Incoming references to '{stat_name}':\n" + "\n".join([f"- {d}" for d in dependents])
        else:
            msg += f"No incoming references to '{stat_name}'."
            
        if outgoing:
            msg += f"\n\n'{stat_name}' modifies (Outgoing):\n" + "\n".join([f"- {o}" for o in outgoing])
        
        msg += "\n\nWhat would you like to do?"
        
        tk.Label(self, text=msg, pady=10, padx=10, justify="left").pack()
        
        # If there are NO incoming dependencies, allow simple delete (Purge acts as delete)
        if not dependents:
             # Use a normal frame and buttons like other dialogs for better visibility
             btn_frame = tk.Frame(self)
             btn_frame.pack(pady=10)
             tk.Button(btn_frame, text="Delete", command=self.on_purge, bg="#ffdddd", width=10).pack(side="left", padx=5)
             tk.Button(btn_frame, text="Cancel", command=self.destroy, width=10).pack(side="left", padx=5)
        else:
            # Option 1: Replace
            frame_replace = tk.LabelFrame(self, text="Option 1: Replace Incoming", padx=10, pady=10)
            frame_replace.pack(fill="x", padx=10, pady=5)
            
            tk.Label(frame_replace, text="Replace incoming references with:").pack(anchor="w")
            
            self.var = tk.StringVar()
            self.combo = ttk.Combobox(frame_replace, textvariable=self.var, values=candidates, state="readonly", width=25)
            self.combo.pack(side="left", pady=5)
            if candidates:
                self.combo.current(0)
                
            tk.Button(frame_replace, text="Replace & Delete", command=self.on_replace, bg="#d0d0d0").pack(side="right", padx=5)
            
            # Option 2: Purge
            frame_purge = tk.LabelFrame(self, text="Option 2: Purge Incoming", padx=10, pady=10)
            frame_purge.pack(fill="x", padx=10, pady=5)
            
            tk.Label(frame_purge, text="Remove references from dependent stats.").pack(anchor="w")
            tk.Button(frame_purge, text="Purge & Delete", command=self.on_purge, bg="#ffdddd").pack(side="right", padx=5)
            
            # Cancel
            tk.Button(self, text="Cancel", command=self.destroy, pady=5).pack(pady=10, fill="x", padx=20)
        
        self.transient(parent)
        self.grab_set()
        self.wait_window(self)

    def on_replace(self):
        self.action = "replace"
        self.target_label = self.var.get()
        self.destroy()
        
    def on_purge(self):
        self.action = "purge"
        self.destroy()
