import { useAppDispatch } from "../app/hooks";
import { resetProgress } from "../state/gameThunks";
import { closeSettings, openKeybinds } from "../state/uiSlice";
import ModalShell from "./ModalShell";

export default function SettingsDialog() {
  const dispatch = useAppDispatch();

  return (
    <ModalShell
      title="Settings"
      onClose={() => dispatch(closeSettings())}
      dialogClassName="settings-dialog"
      dialogStyle={{ maxHeight: "min(92vh, 1200px)" }}
    >
      <div className="settings-dialog__body">
        <button
          type="button"
          className="settings-dialog__keybinds"
          onClick={() => dispatch(openKeybinds())}
        >
          Keybinds
        </button>

        <button
          type="button"
          className="settings-dialog__reset"
          onClick={async () => {
            await dispatch(resetProgress());
          }}
        >
          Delete Progress
        </button>
      </div>
    </ModalShell>
  );
}
