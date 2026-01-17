import AvatarCircle from "../AvatarCircle";
import ResourcesHud from "../ResourcesHud";
import settingsIcon from "../../assets/ui/settings.png";

export default function GameTopHud(props: {
  avatarMeta: any;
  isCharacterOpen: boolean;
  onToggleCharacter: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <>
      <button className="settings-button" type="button" aria-label="Settings" onClick={props.onOpenSettings}>
        <img src={settingsIcon} alt="" draggable={false} />
      </button>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          zIndex: 100,
          pointerEvents: "none"
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <AvatarCircle
            as="button"
            className="avatar-circle--hud"
            size={74}
            onClick={props.onToggleCharacter}
            icon={props.avatarMeta?.icon}
            bg={props.avatarMeta?.bg}
            name={props.avatarMeta?.name ?? "Avatar"}
            iconOffset={props.avatarMeta?.iconOffset}
            iconScale={props.avatarMeta?.iconScale ?? 1}
            bgOffset={props.avatarMeta?.bgOffset}
            bgScale={props.avatarMeta?.bgScale ?? 1}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            pointerEvents: "auto",
            paddingTop: 4
          }}
        >
          <ResourcesHud />
        </div>
      </div>
    </>
  );
}
