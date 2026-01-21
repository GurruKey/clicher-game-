import type { ElementType, ReactNode } from "react";
import { AVATAR_FOCUS_BASE } from "../content/avatars/defaults.js";

type Offset = { x: number; y: number };

export default function AvatarCircle(props: {
  as?: ElementType;
  className?: string;
  onClick?: () => void;
  "aria-pressed"?: boolean;
  name: string;
  icon: string;
  bg: string;
  iconOffset?: Offset;
  iconScale?: number;
  bgOffset?: Offset;
  bgScale?: number;
  size?: number;
  children?: ReactNode;
}) {
  const {
    as: Component = "div",
    className,
    onClick,
    name,
    icon,
    bg,
    iconOffset,
    iconScale = 1,
    bgOffset,
    bgScale = 1,
    size = 78,
    children,
    ...rest
  } = props;

  const baseSize = AVATAR_FOCUS_BASE || 160;
  const numericSize = Number(size) || baseSize;
  const scaleRatio = baseSize ? numericSize / baseSize : 1;

  const iconMove = { x: iconOffset?.x ?? 0, y: iconOffset?.y ?? 0 };
  const bgMove = { x: bgOffset?.x ?? 0, y: bgOffset?.y ?? 0 };

  const componentProps =
    Component === "button" && !(rest as any).type ? { type: "button" } : {};

  return (
    <Component
      className={`avatar-circle${className ? ` ${className}` : ""}`}
      onClick={onClick}
      style={{
        "--avatar-size": `${numericSize}px`,
        "--avatar-base": `${baseSize}px`,
        "--avatar-scale": scaleRatio
      }}
      aria-label={name}
      title={name}
      {...componentProps}
      {...rest}
    >
      <span className="avatar-circle__content" aria-hidden="true">
        <img
          src={bg}
          alt=""
          draggable="false"
          className="avatar-circle__canvas avatar-circle__layer avatar-circle__bg"
          style={{
            transform: `translate(calc(${bgMove.x}px), calc(${bgMove.y}px)) scale(${bgScale})`,
          }}
        />
        <img
          src={icon}
          alt=""
          draggable="false"
          className="avatar-circle__canvas avatar-circle__layer avatar-circle__icon"
          style={{
            transform: `translate(calc(${iconMove.x}px), calc(${iconMove.y}px)) scale(${iconScale})`
          }}
        />
      </span>
      {children}
    </Component>
  );
}
