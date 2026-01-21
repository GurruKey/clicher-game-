import { useEffect, useState } from "react";

type GraphicsConfig = {
  mode: "fixed";
  width: number;
  height: number;
};

export function useGameScale(graphics: GraphicsConfig) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const targetWidth = Math.max(320, Number(graphics?.width ?? 1920));
      const targetHeight = Math.max(200, Number(graphics?.height ?? 1080));
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newScale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);

      if (!Number.isFinite(newScale) || newScale <= 0) {
        newScale = 1;
      }

      // Avoid becoming too tiny on small viewports.
      if (newScale < 0.5) newScale = 0.5;

      setScale(newScale);

      const root = document.documentElement;
      root.style.setProperty("--game-width", `${targetWidth}px`);
      root.style.setProperty("--game-height", `${targetHeight}px`);
      root.style.setProperty("--game-width-scaled", `${Math.round(targetWidth * newScale)}px`);
      root.style.setProperty("--game-height-scaled", `${Math.round(targetHeight * newScale)}px`);
      root.style.setProperty("--scene-width", `${targetWidth}px`);
      root.style.setProperty("--scene-height", `${targetHeight}px`);
      root.style.setProperty("--scene-scale", "1");
      root.style.setProperty("--game-vw", `${targetWidth / 100}px`);
      root.style.setProperty("--game-vh", `${targetHeight / 100}px`);
      root.style.setProperty("--frame-scale", newScale.toString());
      root.style.setProperty("--game-scale", "1");

      // Safari 100vh fix
      const vh = windowHeight * 0.01;
      root.style.setProperty("--vh", `${vh}px`);
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [graphics?.height, graphics?.mode, graphics?.width]);

  return scale;
}
