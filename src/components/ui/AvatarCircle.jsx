import { useEffect, useRef } from "react";
import { AVATAR_FOCUS_BASE } from "../../data/avatars/defaults.js";

const imageCache = new Map();

const loadImage = (src) => {
  if (!src) {
    return Promise.resolve(null);
  }
  const cached = imageCache.get(src);
  if (cached) {
    return cached instanceof Promise ? cached : Promise.resolve(cached);
  }
  const img = new Image();
  const promise = new Promise((resolve) => {
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      imageCache.delete(src);
      resolve(null);
    };
  });
  imageCache.set(src, promise);
  img.src = src;
  return promise;
};

export default function AvatarCircle({
  as: Component = "div",
  icon,
  bg,
  name,
  size = 74,
  iconOffset,
  iconScale = 1,
  bgOffset,
  bgScale = 1,
  className = "",
  title,
  style,
  ...rest
}) {
  const canvasRef = useRef(null);
  const componentProps =
    Component === "button" && !rest.type ? { type: "button" } : {};

  const baseSize = AVATAR_FOCUS_BASE || 160;
  const numericSize = Number(size) || baseSize;
  const scaleRatio = baseSize ? numericSize / baseSize : 1;
  const resolveOffset = (offset) => ({
    x: offset?.x ?? 0,
    y: offset?.y ?? 0
  });
  const iconMove = resolveOffset(iconOffset);
  const bgMove = resolveOffset(bgOffset);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    const drawLayer = (img, scale, offset, opacity = 1) => {
      if (!img) {
        return;
      }
      const safeScale = Number(scale) || 1;
      const offsetX = Number(offset?.x) || 0;
      const offsetY = Number(offset?.y) || 0;
      const coverScale = Math.max(
        baseSize / img.width,
        baseSize / img.height
      );
      const finalScale = coverScale * Math.max(safeScale, 0.01);
      const width = img.width * finalScale;
      const height = img.height * finalScale;
      const left = (baseSize - width) / 2 + offsetX;
      const top = (baseSize - height) / 2 + offsetY;
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, left, top, width, height);
    };

    canvas.width = baseSize;
    canvas.height = baseSize;
    ctx.clearRect(0, 0, baseSize, baseSize);
    ctx.imageSmoothingEnabled = true;

    Promise.all([loadImage(bg), loadImage(icon)]).then(([bgImg, iconImg]) => {
      if (cancelled) {
        return;
      }
      ctx.clearRect(0, 0, baseSize, baseSize);
      drawLayer(bgImg, bgScale, bgMove, 0.7);
      drawLayer(iconImg, iconScale, iconMove, 1);
    });

    return () => {
      cancelled = true;
    };
  }, [baseSize, bg, bgMove, bgScale, icon, iconMove, iconScale]);

  return (
    <Component
      className={`avatar-circle${className ? ` ${className}` : ""}`}
      style={{
        "--avatar-size": `${numericSize}px`,
        "--avatar-base": `${baseSize}px`,
        "--avatar-scale": scaleRatio,
        ...style
      }}
      title={title ?? name ?? "Avatar"}
      {...componentProps}
      {...rest}
    >
      <span className="avatar-circle__content" aria-hidden="true">
        <canvas className="avatar-circle__canvas" ref={canvasRef} />
      </span>
    </Component>
  );
}
