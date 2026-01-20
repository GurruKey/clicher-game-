import { useEffect } from "react";
import { useAppSelector } from "./app/hooks";
import EntryScreen from "./ui/EntryScreen";
import GameScreen from "./ui/GameScreen";
import { selectUi } from "./state/uiSlice";
import { useRarityTheme } from "./hooks/ui/useRarityTheme";
import { useGameScale } from "./hooks/ui/useGameScale";

export default function App() {
  const ui = useAppSelector(selectUi);
  useRarityTheme();
  useGameScale();

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="app">
      {!ui.isInGame ? (
        <EntryScreen />
      ) : (
        <main className="main">
          <GameScreen />
        </main>
      )}
    </div>
  );
}
