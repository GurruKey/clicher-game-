from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path
import tkinter as tk


@dataclass
class LoadingOverlay:
    root: tk.Tk
    overlay: tk.Frame
    label: tk.Label
    loading_image_raw: tk.PhotoImage | None
    ready_image_raw: tk.PhotoImage | None

    @classmethod
    def create(cls, root: tk.Tk, images_root: Path) -> "LoadingOverlay":
        overlay = tk.Frame(root, bg="black")
        label = tk.Label(overlay, bg="black")
        label.pack(expand=True)

        loading_path = images_root / "loading.png"
        ready_path = images_root / "ready.png"

        loading_image_raw = (
            tk.PhotoImage(file=str(loading_path))
            if loading_path.exists()
            else None
        )
        ready_image_raw = (
            tk.PhotoImage(file=str(ready_path))
            if ready_path.exists()
            else None
        )

        return cls(
            root=root,
            overlay=overlay,
            label=label,
            loading_image_raw=loading_image_raw,
            ready_image_raw=ready_image_raw
        )

    def show_loading(self) -> None:
        self._show_image(self.loading_image_raw, fallback="Loading...")

    def show_ready(self, duration_ms: int = 2000) -> None:
        if self.ready_image_raw:
            self._show_image(self.ready_image_raw)
            self.root.after(duration_ms, self.hide)
        else:
            self.hide()

    def hide(self) -> None:
        self.overlay.place_forget()

    def _show_image(self, image: tk.PhotoImage | None, fallback: str = "") -> None:
        self.root.update_idletasks()
        if image:
            target_w = max(1, self.root.winfo_width())
            target_h = max(1, self.root.winfo_height())
            scaled = self._scale_photo_to_fit(image, target_w, target_h)
            self.label.config(image=scaled, text="")
            self.label.image = scaled
        else:
            self.label.config(image="", text=fallback, fg="white")
        self.overlay.place(relx=0, rely=0, relwidth=1, relheight=1)
        self.overlay.lift()

    def _scale_photo_to_fit(
        self,
        image: tk.PhotoImage,
        target_w: int,
        target_h: int
    ) -> tk.PhotoImage:
        img_w = image.width()
        img_h = image.height()
        ratio = min(target_w / img_w, target_h / img_h, 1)
        if ratio == 1:
            return image
        scale = Fraction(ratio).limit_denominator(20)
        scaled = image.zoom(scale.numerator, scale.numerator)
        if scale.denominator != 1:
            scaled = scaled.subsample(scale.denominator, scale.denominator)
        return scaled
