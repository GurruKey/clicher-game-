from __future__ import annotations

from time import monotonic
import tkinter as tk


class AvatarDragController:
    def __init__(
        self,
        parent: tk.Misc,
        icon_offset_x: tk.DoubleVar,
        icon_offset_y: tk.DoubleVar,
        bg_offset_x: tk.DoubleVar,
        bg_offset_y: tk.DoubleVar,
        on_fast_update,
        on_final_update,
        offset_min: int = -200,
        offset_max: int = 200
    ) -> None:
        self._parent = parent
        self._icon_offset_x = icon_offset_x
        self._icon_offset_y = icon_offset_y
        self._bg_offset_x = bg_offset_x
        self._bg_offset_y = bg_offset_y
        self._on_fast_update = on_fast_update
        self._on_final_update = on_final_update
        self._offset_min = offset_min
        self._offset_max = offset_max
        self._active = False
        self._x = 0
        self._y = 0
        self._layer = "icon"
        self._last_update = 0.0
        self._throttle_s = 0.03

    @property
    def active(self) -> bool:
        return self._active

    def clamp_offset(self, value: float) -> float:
        return max(self._offset_min, min(self._offset_max, value))

    def nudge_offset(
        self,
        offset_x: tk.DoubleVar,
        offset_y: tk.DoubleVar,
        dx: int,
        dy: int,
        step_var: tk.DoubleVar
    ) -> None:
        step = float(step_var.get())
        offset_x.set(self.clamp_offset(offset_x.get() + dx * step))
        offset_y.set(self.clamp_offset(offset_y.get() + dy * step))

    def start_drag(self, event: tk.Event, layer: str) -> None:
        self._active = True
        self._x = event.x_root
        self._y = event.y_root
        self._layer = layer
        self._last_update = monotonic()

    def update_drag(self, event: tk.Event) -> None:
        if not self._active:
            return
        dx = event.x_root - self._x
        dy = event.y_root - self._y
        self._x = event.x_root
        self._y = event.y_root
        if self._layer == "icon":
            self._icon_offset_x.set(
                self.clamp_offset(self._icon_offset_x.get() + dx)
            )
            self._icon_offset_y.set(
                self.clamp_offset(self._icon_offset_y.get() + dy)
            )
        else:
            self._bg_offset_x.set(
                self.clamp_offset(self._bg_offset_x.get() + dx)
            )
            self._bg_offset_y.set(
                self.clamp_offset(self._bg_offset_y.get() + dy)
            )
        now = monotonic()
        if now - self._last_update >= self._throttle_s:
            self._last_update = now
            self._on_fast_update()

    def end_drag(self, _event: tk.Event | None = None) -> None:
        if not self._active:
            return
        self._active = False
        self._on_final_update()
