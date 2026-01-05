import React from "react";

export default function ContextMenu({
  contextMenu,
  menuRef,
  onDelete
}) {
  if (!contextMenu) {
    return null;
  }

  return (
    <div
      className="context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {contextMenu.source === "bag" ? (
        <button type="button" onClick={() => onDelete(contextMenu)}>
          Delete
        </button>
      ) : null}
    </div>
  );
}
