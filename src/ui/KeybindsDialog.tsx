import { useEffect, useMemo, useState } from "react";
import { KEYBIND_ACTIONS, formatKeybind, normalizeKeybind } from "../content/keybinds";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { resetKeybinds, selectKeybinds, updateKeybind } from "../state/settingsSlice";
import { closeKeybinds, openSettings } from "../state/uiSlice";
import ModalShell from "./ModalShell";

export default function KeybindsDialog() {
  const dispatch = useAppDispatch();
  const keybinds = useAppSelector(selectKeybinds);
  const [listeningId, setListeningId] = useState<string | null>(null);
  const [isSkills1Open, setIsSkills1Open] = useState(false);
  const [isSkills2Open, setIsSkills2Open] = useState(false);

  const { generalActions, skill1Actions, skill2Actions } = useMemo(() => {
    const general: typeof KEYBIND_ACTIONS = [];
    const s1: typeof KEYBIND_ACTIONS = [];
    const s2: typeof KEYBIND_ACTIONS = [];
    for (const action of KEYBIND_ACTIONS) {
      if (action.id.startsWith("useSkill2_")) s2.push(action);
      else if (action.id.startsWith("useSkill")) s1.push(action);
      else general.push(action);
    }
    return { generalActions: general, skill1Actions: s1, skill2Actions: s2 };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!listeningId) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        (event as any).stopImmediatePropagation?.();
        setListeningId(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      (event as any).stopImmediatePropagation?.();
      const normalized = normalizeKeybind(event.code || event.key);
      if (!normalized) return;
      dispatch(updateKeybind({ actionId: listeningId, key: normalized }));
      setListeningId(null);
    };

    if (listeningId) {
      window.addEventListener("keydown", handler, { capture: true });
      return () => window.removeEventListener("keydown", handler, { capture: true } as any);
    }
  }, [dispatch, listeningId]);

  const renderActions = (actions: typeof KEYBIND_ACTIONS) => (
    <div className="keybinds-dialog__list">
      {actions.map((action) => {
        const currentKey = formatKeybind(keybinds?.[action.id]);
        const isListening = listeningId === action.id;
        return (
          <div key={action.id} className="keybinds-dialog__row">
            <span className="keybinds-dialog__label">{action.label}</span>
            <button
              type="button"
              onClick={() => setListeningId(action.id)}
              className={`keybinds-dialog__key${isListening ? " keybinds-dialog__key--listening" : ""}`}
            >
              {isListening ? "Press a key" : currentKey}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <ModalShell
      title="Keybinds"
      onClose={() => dispatch(closeKeybinds())}
      dialogClassName="keybinds-dialog"
      dialogStyle={{ maxHeight: "min(92vh, 1200px)" }}
    >
      {renderActions(generalActions)}

      <button
        type="button"
        className="keybinds-dialog__section"
        onClick={() => setIsSkills1Open((p) => !p)}
      >
        Skills Bar 1
      </button>
      {isSkills1Open ? renderActions(skill1Actions) : null}

      <button
        type="button"
        className="keybinds-dialog__section"
        onClick={() => setIsSkills2Open((p) => !p)}
      >
        Skills Bar 2
      </button>
      {isSkills2Open ? renderActions(skill2Actions) : null}

      <div className="dialog__actions">
        <button
          type="button"
          onClick={() => {
            dispatch(openSettings());
          }}
        >
          Back
        </button>
        <button type="button" onClick={() => dispatch(resetKeybinds())}>
          Reset Keybinds
        </button>
      </div>
    </ModalShell>
  );
}
