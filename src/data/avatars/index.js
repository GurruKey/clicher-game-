import { HUMAN_MAN_AVATAR } from "./human_man.js";
import { MYSTIC_AVATAR } from "./mystic.js";
import { ORC_MAN_AVATAR } from "./orc_man.js";

export const AVATARS = [MYSTIC_AVATAR, HUMAN_MAN_AVATAR, ORC_MAN_AVATAR];

export const DEFAULT_AVATAR_ID = AVATARS[0]?.id ?? "mystic";

export { HUMAN_MAN_AVATAR, MYSTIC_AVATAR, ORC_MAN_AVATAR };
