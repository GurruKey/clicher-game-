from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image, ImageTk

from constants import AVATAR_FOCUS_BASE


class AvatarRenderer:
    def __init__(self) -> None:
        self._source_cache: dict[str, Image.Image] = {}
        self._scaled_cache: dict[tuple, Image.Image] = {}
        self._mask_cache: dict[int, Image.Image] = {}

    def invalidate(self, path: Path | None) -> None:
        if not path:
            return
        key = str(path)
        self._source_cache.pop(key, None)
        for cache_key in list(self._scaled_cache.keys()):
            if cache_key[0] == key:
                self._scaled_cache.pop(cache_key, None)

    def render(
        self,
        bg_path: Path | None,
        icon_path: Path | None,
        target: int,
        bg_scale: float,
        bg_offset: dict | None,
        icon_scale: float,
        icon_offset: dict | None,
        fast: bool = False
    ) -> ImageTk.PhotoImage:
        render_size = target
        resample = Image.Resampling.NEAREST if fast else Image.Resampling.LANCZOS

        bg_layer = self._build_layer(
            bg_path,
            render_size,
            bg_scale,
            bg_offset,
            resample
        )
        icon_layer = self._build_layer(
            icon_path,
            render_size,
            icon_scale,
            icon_offset,
            resample
        )

        composed = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
        if bg_layer is not None:
            composed.alpha_composite(bg_layer)
        if icon_layer is not None:
            composed.alpha_composite(icon_layer)

        mask = self._get_circle_mask(render_size)
        output = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
        output.paste(composed, (0, 0), mask)

        if render_size != target:
            output = output.resize((target, target), resample=Image.Resampling.NEAREST)

        return ImageTk.PhotoImage(output)

    def _get_circle_mask(self, size: int) -> Image.Image:
        cached = self._mask_cache.get(size)
        if cached is not None:
            return cached
        mask = Image.new("L", (size, size), 0)
        center = size / 2
        radius = size / 2
        pixels = mask.load()
        for x in range(size):
            dx = x - center + 0.5
            for y in range(size):
                dy = y - center + 0.5
                if dx * dx + dy * dy <= radius * radius:
                    pixels[x, y] = 255
        self._mask_cache[size] = mask
        return mask

    def _build_layer(
        self,
        path: Path | None,
        target: int,
        scale: float,
        offset: dict | None,
        resample: Any
    ) -> Image.Image | None:
        if not path:
            return None
        source = self._load_source(path)
        if source is None:
            return None
        cover_scale = max(target / source.width, target / source.height)
        final_scale = cover_scale * max(scale, 0.01)
        scaled = self._get_scaled(path, final_scale, resample)
        width, height = scaled.size
        raw_x = float(offset.get("x", 0)) if offset else 0
        raw_y = float(offset.get("y", 0)) if offset else 0
        ratio = target / AVATAR_FOCUS_BASE if AVATAR_FOCUS_BASE else 1
        offset_x = int(round(raw_x * ratio))
        offset_y = int(round(raw_y * ratio))
        left = int(round((target - width) / 2 + offset_x))
        top = int(round((target - height) / 2 + offset_y))
        layer = Image.new("RGBA", (target, target), (0, 0, 0, 0))
        layer.paste(scaled, (left, top), scaled)
        return layer

    def _load_source(self, path: Path) -> Image.Image | None:
        key = str(path)
        cached = self._source_cache.get(key)
        if cached is not None:
            return cached
        if not path.exists():
            return None
        image = Image.open(path).convert("RGBA")
        self._source_cache[key] = image
        return image

    def _get_scaled(
        self,
        path: Path,
        scale: float,
        resample: Any
    ) -> Image.Image:
        key = (str(path), round(scale, 4), resample)
        cached = self._scaled_cache.get(key)
        if cached is not None:
            return cached
        source = self._source_cache[str(path)]
        width = max(1, int(round(source.width * scale)))
        height = max(1, int(round(source.height * scale)))
        scaled = source.resize((width, height), resample=resample)
        self._scaled_cache[key] = scaled
        return scaled
