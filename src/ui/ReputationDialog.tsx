import { useAppDispatch } from "../app/hooks";
import { closeReputation } from "../state/uiSlice";
import ModalShell from "./ModalShell";

export default function ReputationDialog() {
  const dispatch = useAppDispatch();

  return (
    <ModalShell title="Reputation" onClose={() => dispatch(closeReputation())}>
      <div className="dialog__hint">Not implemented yet.</div>
    </ModalShell>
  );
}

