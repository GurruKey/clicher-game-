import tkinter as tk
from ...theme import ModernButton
from time import monotonic

class AvatarDragControls:
    def __init__(
        self,
        parent: tk.Frame,
        preview_panel,
        get_avatar_cb,
        on_dirty=None
    ) -> None:
        self.parent = parent
        self.preview_panel = preview_panel
        self.get_avatar = get_avatar_cb
        self.on_dirty = on_dirty
        
        # UI Variables
        self.icon_scale = tk.DoubleVar(value=1.0)
        self.bg_scale = tk.DoubleVar(value=1.0)
        
        self.icon_x = tk.DoubleVar(value=0)
        self.icon_y = tk.DoubleVar(value=0)
        self.bg_x = tk.DoubleVar(value=0)
        self.bg_y = tk.DoubleVar(value=0)
        
        # Drag state
        self._drag_active = False
        self._drag_start_x = 0
        self._drag_start_y = 0
        self._drag_layer = "icon"
        self._last_update = 0.0
        self._throttle_s = 0.03
        
        self._build_ui()
        self._bind_traces()

    def _build_ui(self):
        # Icon Controls
        icon_group = tk.LabelFrame(self.parent, text="Avatar Transform")
        icon_group.pack(fill="x", pady=(0, 10))
        
        self._build_control_row(icon_group, "Scale", self.icon_scale, 0.1, 3.0, 0.1)
        self._build_control_row(icon_group, "X", self.icon_x, -200, 200, 1)
        self._build_control_row(icon_group, "Y", self.icon_y, -200, 200, 1)

        # Background Controls
        bg_group = tk.LabelFrame(self.parent, text="Background Transform")
        bg_group.pack(fill="x")
        
        self._build_control_row(bg_group, "Scale", self.bg_scale, 0.1, 3.0, 0.1)
        self._build_control_row(bg_group, "X", self.bg_x, -200, 200, 1)
        self._build_control_row(bg_group, "Y", self.bg_y, -200, 200, 1)

    def _build_control_row(self, parent, label, variable, min_val, max_val, step):
        row = tk.Frame(parent)
        row.pack(fill="x", padx=5, pady=2)
        
        tk.Label(row, text=label, width=5, anchor="w").pack(side="left")
        
        # Entry for direct input
        entry = tk.Entry(row, textvariable=variable, width=6)
        entry.pack(side="right", padx=(5, 0))
        
        # Slider
        scale = tk.Scale(
            row, 
            variable=variable, 
            from_=min_val, 
            to=max_val, 
            orient="horizontal", 
            resolution=step,
            showvalue=0
        )
        scale.pack(side="left", fill="x", expand=True)

    def _bind_traces(self):
        for var in [self.icon_scale, self.icon_x, self.icon_y, self.bg_scale, self.bg_x, self.bg_y]:
            var.trace_add("write", self._on_change)

    def _on_change(self, *args):
        # Prevent update loop during drag if needed, but here simple is fine
        avatar = self.get_avatar()
        if not avatar:
            return
            
        try:
            # Update avatar data from UI
            avatar["iconScale"] = float(self.icon_scale.get())
            avatar["iconOffset"] = {"x": int(self.icon_x.get()), "y": int(self.icon_y.get())}
            
            avatar["bgScale"] = float(self.bg_scale.get())
            avatar["bgOffset"] = {"x": int(self.bg_x.get()), "y": int(self.bg_y.get())}
            
            # If NOT dragging, do a full update? Or maybe fast update if dragging?
            # For now, always update preview
            is_dragging = self._drag_active
            self.preview_panel.show_avatar(avatar, fast=is_dragging)
            
            if self.on_dirty and not is_dragging:
                self.on_dirty()
        except ValueError:
            pass

    def update_controls(self):
        """Update UI from Avatar Data"""
        avatar = self.get_avatar()
        if not avatar:
            return

        # Temporarily disable traces to avoid loops if needed, but tkinter handles self-set usually fine or we just re-render
        self.icon_scale.set(avatar.get("iconScale", 1.0))
        icon_off = avatar.get("iconOffset", {"x": 0, "y": 0})
        self.icon_x.set(icon_off.get("x", 0))
        self.icon_y.set(icon_off.get("y", 0))

        self.bg_scale.set(avatar.get("bgScale", 1.0))
        bg_off = avatar.get("bgOffset", {"x": 0, "y": 0})
        self.bg_x.set(bg_off.get("x", 0))
        self.bg_y.set(bg_off.get("y", 0))

    # --- Drag Logic ---

    def start_drag(self, event: tk.Event, layer: str) -> None:
        self._drag_active = True
        self._drag_start_x = event.x_root
        self._drag_start_y = event.y_root
        self._drag_layer = layer
        self._last_update = monotonic()

    def update_drag(self, event: tk.Event) -> None:
        if not self._drag_active:
            return
        
        dx = event.x_root - self._drag_start_x
        dy = event.y_root - self._drag_start_y
        
        self._drag_start_x = event.x_root
        self._drag_start_y = event.y_root
        
        if self._drag_layer == "icon":
            self.icon_x.set(self.icon_x.get() + dx)
            self.icon_y.set(self.icon_y.get() + dy)
        else:
            self.bg_x.set(self.bg_x.get() + dx)
            self.bg_y.set(self.bg_y.get() + dy)
            
        now = monotonic()
        if now - self._last_update >= self._throttle_s:
            self._last_update = now
            # _on_change will handle preview update

    def end_drag(self, event: tk.Event | None = None) -> None:
        if not self._drag_active:
            return
        self._drag_active = False
        # Final update to ensure quality and dirty flag
        self._on_change()
        if self.on_dirty:
            self.on_dirty()
