import React, { useEffect, useState } from "react";
import { KEYBIND_ACTIONS, formatKeybind } from "../../data/keybinds.js";

export function DeleteDialog({
  deleteDialog,
  availableCount,
  onChange,
  onAll,
  onCancel,
  onConfirm
}) {
  if (!deleteDialog) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className="dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3>Delete</h3>
        <p className="dialog__hint">Available: {availableCount}</p>
        <div className="dialog__input">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max={availableCount}
            value={deleteDialog.value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="0"
          />
          <button type="button" onClick={onAll}>
            All
          </button>
        </div>
        <div className="dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              !Number.isFinite(Number(deleteDialog.value)) ||
              Number(deleteDialog.value) <= 0
            }
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsDialog({
  isOpen,
  onClose,
  onResetProgress,
  onOpenKeybinds
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog settings-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <h3>Settings</h3>
        <div className="settings-dialog__body">
          <button
            className="settings-dialog__keybinds"
            type="button"
            onClick={onOpenKeybinds}
          >
            Keybindings
          </button>
          <button
            className="settings-dialog__reset"
            type="button"
            onClick={onResetProgress}
          >
            Delete Progress
          </button>
        </div>
      </div>
    </div>
  );
}

export function KeybindsDialog({
  isOpen,
  onClose,
  keybinds,
  onUpdateKeybind
}) {
  const [listeningId, setListeningId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setListeningId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listeningId) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setListeningId(null);
        return;
      }
      event.preventDefault();
      onUpdateKeybind(listeningId, event.code || event.key);
      setListeningId(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, listeningId, onUpdateKeybind]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog keybinds-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keybindings"
      >
        <h3>Keybindings</h3>
        <div className="keybinds-dialog__list">
          {KEYBIND_ACTIONS.map((action) => {
            const currentKey = formatKeybind(keybinds?.[action.id]);
            const isListening = listeningId === action.id;

            return (
              <div className="keybinds-dialog__row" key={action.id}>
                <span className="keybinds-dialog__label">
                  {action.label}
                </span>
                <button
                  type="button"
                  className={`keybinds-dialog__key${
                    isListening ? " keybinds-dialog__key--listening" : ""
                  }`}
                  onClick={() => setListeningId(action.id)}
                >
                  {isListening ? "Press a key" : currentKey}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
