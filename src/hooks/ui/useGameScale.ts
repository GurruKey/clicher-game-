import { useEffect, useState } from "react";

export function useGameScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // Подбираем эталон так, чтобы на 1440р экранах масштаб был около 0.8-0.9
      const REFERENCE_WIDTH = 1600;
      const REFERENCE_HEIGHT = 1000;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newScale = Math.min(windowWidth / REFERENCE_WIDTH, windowHeight / REFERENCE_HEIGHT);

      // Ограничиваем сверху, чтобы не было гигантизма
      if (newScale > 1) {
        newScale = 1;
      }
      
      // Минимальный порог, чтобы не превратилось в точку
      if (newScale < 0.5) {
        newScale = 0.5;
      }

      // Ограничиваем масштаб, чтобы не было слишком мелко или слишком крупно (опционально)
      // newScale = Math.max(0.5, Math.min(1.2, newScale));

      setScale(newScale);
      document.documentElement.style.setProperty("--game-scale", newScale.toString());
      
      // Также фиксим 100vh для Safari
      const vh = windowHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  return scale;
}
