import ModalShell from "./ModalShell";

export type DeleteDialogState =
  | { container: "character"; slotId: string; value: string }
  | { container: "base" | "bag"; slotIndex: number; value: string };

export default function DeleteDialog(props: {
  deleteDialog: DeleteDialogState | null;
  availableCount: number;
  onChange: (value: string) => void;
  onAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = props.deleteDialog;
  if (!dialog) return null;

  const valueNum = Number(dialog.value);
  const canConfirm = Number.isFinite(valueNum) && valueNum > 0;

  return (
    <ModalShell title="Delete" onClose={props.onCancel}>
      <p className="dialog__hint">Available: {String(props.availableCount)}</p>

      <div className="dialog__input">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={props.availableCount}
          value={dialog.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder="0"
        />
        <button type="button" onClick={props.onAll}>
          All
        </button>
      </div>

      <div className="dialog__actions">
        <button type="button" onClick={props.onCancel}>
          Cancel
        </button>
        <button type="button" onClick={props.onConfirm} disabled={!canConfirm}>
          Confirm
        </button>
      </div>
    </ModalShell>
  );
}
