import AvatarCircle from "../AvatarCircle";
import ResourcesHud from "../ResourcesHud";
import BuffsBar from "../BuffsBar";
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

      <div className="game-top-hud">
        <div className="game-top-hud__row">
          <div className="game-top-hud__avatar">
            <AvatarCircle
              as="button"
              className="avatar-circle--hud"
              size={90}
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

          <div className="game-top-hud__resources">
            <ResourcesHud />
          </div>
        </div>

        <BuffsBar />
      </div>
    </>
  );
}
