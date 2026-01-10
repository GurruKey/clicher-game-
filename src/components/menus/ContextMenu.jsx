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
      {contextMenu.source === "character" && (
        <button type="button" onClick={() => onDelete({ ...contextMenu, action: "unequip" })}>
          Unequip
        </button>
      )}
      {contextMenu.source === "bag" && contextMenu.equippable && (
        <button type="button" onClick={() => onDelete({ ...contextMenu, action: "equip" })}>
          Equip
        </button>
      )}
      {contextMenu.source === "bag" && contextMenu.usable && (
        <button type="button" onClick={() => onDelete({ ...contextMenu, action: "use" })}>
          Use
        </button>
      )}
      {contextMenu.source === "bag" || contextMenu.source === "character" || contextMenu.source === "character_bag" ? (
        <button type="button" onClick={() => onDelete(contextMenu)}>
          Delete
        </button>
      ) : null}
    </div>
  );
}
