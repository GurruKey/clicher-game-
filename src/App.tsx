import { useEffect } from "react";
import { useAppSelector } from "./app/hooks";
import EntryScreen from "./ui/EntryScreen";
import GameScreen from "./ui/GameScreen";
import { selectUi } from "./state/uiSlice";
import { useRarityTheme } from "./hooks/ui/useRarityTheme";
import { useGameScale } from "./hooks/ui/useGameScale";
import { selectGraphics } from "./state/settingsSlice";

export default function App() {
  const ui = useAppSelector(selectUi);
  const graphics = useAppSelector(selectGraphics);
  useRarityTheme();
  useGameScale(graphics);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="app">
      <div className="game-shell">
        <div className="game-frame">
          <div className="game-frame__scale">
            {!ui.isInGame ? (
              <EntryScreen />
            ) : (
              <main className="main">
                <GameScreen />
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
