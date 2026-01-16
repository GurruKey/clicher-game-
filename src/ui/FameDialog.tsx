import { useAppDispatch } from "../app/hooks";
import { closeFame } from "../state/uiSlice";
import ModalShell from "./ModalShell";

export default function FameDialog() {
  const dispatch = useAppDispatch();

  return (
    <ModalShell title="Fame" onClose={() => dispatch(closeFame())}>
      <div className="dialog__hint">Not implemented yet.</div>
    </ModalShell>
  );
}

