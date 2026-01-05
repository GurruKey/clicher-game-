from __future__ import annotations

from fractions import Fraction
import tkinter as tk

from constants import AVATAR_FOCUS_BASE


_MASK_CACHE: dict[tuple[int, int], list[tuple[int, int]]] = {}


def _get_circle_mask(width: int, height: int) -> list[tuple[int, int]]:
    key = (width, height)
    cached = _MASK_CACHE.get(key)
    if cached is not None:
        return cached
    radius = min(width, height) / 2
    cx = width / 2
    cy = height / 2
    radius_sq = radius * radius
    coords: list[tuple[int, int]] = []
    for x in range(width):
        dx = x - cx + 0.5
        dx_sq = dx * dx
        for y in range(height):
            dy = y - cy + 0.5
            if dx_sq + dy * dy > radius_sq:
                coords.append((x, y))
    _MASK_CACHE[key] = coords
    return coords


def mask_circle(image: tk.PhotoImage) -> tk.PhotoImage:
    width = image.width()
    height = image.height()
    coords = _get_circle_mask(width, height)
    for x, y in coords:
        try:
            image.transparency_set(x, y, True)
        except Exception:
            image.tk.call(image, "transparency", "set", x, y, 1)
    return image


def scale_photo(image: tk.PhotoImage, scale: float) -> tk.PhotoImage:
    if scale == 1:
        return image
    ratio = Fraction(scale).limit_denominator(20)
    scaled = image.zoom(ratio.numerator, ratio.numerator)
    if ratio.denominator != 1:
        scaled = scaled.subsample(ratio.denominator, ratio.denominator)
    return scaled


def build_layer(
    path: object,
    target: int,
    scale: float,
    offset: dict | None,
    cache: dict[tuple, tk.PhotoImage] | None,
    source_cache: dict[str, tk.PhotoImage] | None = None,
    scaled_cache: dict[tuple, tk.PhotoImage] | None = None
) -> tk.PhotoImage | None:
    if not path or not hasattr(path, "exists") or not path.exists():
        return None
    raw_x = float(offset.get("x", 0)) if offset else 0
    raw_y = float(offset.get("y", 0)) if offset else 0
    ratio = target / AVATAR_FOCUS_BASE if AVATAR_FOCUS_BASE else 1
    offset_x = int(round(raw_x * ratio))
    offset_y = int(round(raw_y * ratio))
    key = (
        str(path),
        target,
        round(float(scale), 3),
        offset_x,
        offset_y
    )
    if cache is not None:
        cached = cache.get(key)
        if cached:
            return cached
    path_key = str(path)
    if source_cache is not None:
        source_image = source_cache.get(path_key)
        if not source_image:
            source_image = tk.PhotoImage(file=path_key)
            source_cache[path_key] = source_image
    else:
        source_image = tk.PhotoImage(file=path_key)

    scale_key = (path_key, target, round(float(scale), 3))
    if scaled_cache is not None:
        scaled_image = scaled_cache.get(scale_key)
        if not scaled_image:
            cover_scale = max(
                target / source_image.width(),
                target / source_image.height()
            )
            scaled_image = scale_photo(
                source_image,
                cover_scale * max(scale, 0.01)
            )
            scaled_cache[scale_key] = scaled_image
    else:
        cover_scale = max(
            target / source_image.width(),
            target / source_image.height()
        )
        scaled_image = scale_photo(
            source_image,
            cover_scale * max(scale, 0.01)
        )

    width = scaled_image.width()
    height = scaled_image.height()
    center_x = width / 2 + offset_x
    center_y = height / 2 + offset_y
    left = int(round(center_x - target / 2))
    top = int(round(center_y - target / 2))
    left = max(0, min(left, width - target))
    top = max(0, min(top, height - target))
    right = left + target
    bottom = top + target
    cropped = tk.PhotoImage(width=target, height=target)
    cropped.tk.call(
        cropped,
        "copy",
        scaled_image,
        "-from",
        left,
        top,
        right,
        bottom,
        "-to",
        0,
        0
    )
    masked = mask_circle(cropped)
    if cache is not None:
        cache[key] = masked
    return masked
