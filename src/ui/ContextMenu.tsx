import type { ReactNode } from "react";

export type InventoryContextMenuPayload =
  | ({ x: number; y: number } & InventoryContextMenuData);

export type InventoryContextMenuData =
  | {
      source: "bag";
      index: number;
      id: string;
      instanceId?: string;
      equippableSlotId: string | null;
      usable: boolean;
      deletable?: boolean;
    }
  | {
      source: "character";
      slotId: string;
      id: string;
      instanceId?: string;
    };

function MenuShell(props: {
  x: number;
  y: number;
  menuRef: React.RefObject<HTMLDivElement>;
  children: ReactNode;
}) {
  const stopEvent = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <div
      role="menu"
      ref={props.menuRef}
      className="context-menu"
      onClick={stopEvent}
      onPointerDown={stopEvent}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{
        left: props.x,
        top: props.y
      }}
    >
      {props.children}
    </div>
  );
}

function MenuButton(props: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export default function ContextMenu(props: {
  contextMenu: InventoryContextMenuPayload | null;
  menuRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onAction: (payload: InventoryContextMenuPayload & { action: "equip" | "use" | "delete" | "unequip" }) => void;
}) {
  if (!props.contextMenu) return null;
  const menu = props.contextMenu;

  return (
    <MenuShell x={menu.x} y={menu.y} menuRef={props.menuRef}>
      {menu.source === "character" ? (
        <MenuButton
          onClick={() => {
            props.onAction({ ...(menu as any), action: "unequip" });
            props.onClose();
          }}
        >
          Unequip
        </MenuButton>
      ) : null}

      {menu.source === "bag" && menu.equippableSlotId ? (
        <MenuButton
          onClick={() => {
            props.onAction({ ...(menu as any), action: "equip" });
            props.onClose();
          }}
        >
          Equip
        </MenuButton>
      ) : null}

      {menu.source === "bag" && menu.usable ? (
        <MenuButton
          onClick={() => {
            props.onAction({ ...(menu as any), action: "use" });
            props.onClose();
          }}
        >
          Use
        </MenuButton>
      ) : null}

      {menu.source === "character" || (menu.source === "bag" && menu.deletable !== false) ? (
        <MenuButton
          onClick={() => {
            props.onAction({ ...(menu as any), action: "delete" });
            props.onClose();
          }}
        >
          Delete
        </MenuButton>
      ) : null}
    </MenuShell>
  );
}
