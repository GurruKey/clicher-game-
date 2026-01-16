import collectingIcon from "../../assets/abilities/collecting.png";
import searchRing from "../../assets/abilities/overlays/search_ring.png";

export const COLLECTING_ABILITY = {
  id: "collecting",
  name: "Collecting",
  icon: collectingIcon,
  kind: "collecting",
  useDelayMs: 500,
  cooldownMs: 200,
  workOverlay: searchRing
};
