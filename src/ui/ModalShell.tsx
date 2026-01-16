import { useEffect, type CSSProperties, type ReactNode } from "react";

const BODY_MODAL_LOCK_COUNT_KEY = "modalLockCount";
const BODY_PREV_OVERFLOW_KEY = "modalPrevOverflow";

export default function ModalShell(props: {
  title: string;
  onClose: () => void;
  backdropClassName?: string;
  dialogClassName?: string;
  dialogStyle?: CSSProperties;
  children: ReactNode;
}) {
  useEffect(() => {
    const body = document.body;
    const prevCountRaw = body.dataset[BODY_MODAL_LOCK_COUNT_KEY];
    const prevCount = prevCountRaw ? Number.parseInt(prevCountRaw, 10) : 0;
    const nextCount = Number.isFinite(prevCount) ? prevCount + 1 : 1;
    body.dataset[BODY_MODAL_LOCK_COUNT_KEY] = String(nextCount);

    if (nextCount === 1) {
      body.dataset[BODY_PREV_OVERFLOW_KEY] = body.style.overflow || "";
      body.style.overflow = "hidden";
    }

    return () => {
      const currentCountRaw = body.dataset[BODY_MODAL_LOCK_COUNT_KEY];
      const currentCount = currentCountRaw ? Number.parseInt(currentCountRaw, 10) : 1;
      const updatedCount = Number.isFinite(currentCount) ? Math.max(0, currentCount - 1) : 0;

      if (updatedCount === 0) {
        const prevOverflow = body.dataset[BODY_PREV_OVERFLOW_KEY] ?? "";
        body.style.overflow = prevOverflow;
        delete body.dataset[BODY_PREV_OVERFLOW_KEY];
        delete body.dataset[BODY_MODAL_LOCK_COUNT_KEY];
      } else {
        body.dataset[BODY_MODAL_LOCK_COUNT_KEY] = String(updatedCount);
      }
    };
  }, []);

  const backdropClassName = ["dialog-backdrop", props.backdropClassName].filter(Boolean).join(" ");
  const dialogClassName = ["dialog", props.dialogClassName].filter(Boolean).join(" ");
  const dialogStyle: CSSProperties = {
    maxHeight: "min(80vh, 800px)",
    overflow: "auto",
    ...(props.dialogStyle ?? {})
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={backdropClassName}
      onClick={props.onClose}
    >
      <div
        className={dialogClassName}
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{props.title}</h3>
        {props.children}
      </div>
    </div>
  );
}
