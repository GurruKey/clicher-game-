import collectingIcon from "../../assets/abilities/collecting.png";

export const AUTO_COLLECTING_ABILITY = {
  id: "auto_collecting",
  name: "Auto Collecting",
  icon: collectingIcon,
  kind: "collecting",
  autoRepeat: true,
  frame: "bronze",
  useDelayMs: 500,
  cooldownMs: 200
};
