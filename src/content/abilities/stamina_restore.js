import staminaRestoreIcon from "../../assets/abilities/stamina_restore.png";

export const STAMINA_RESTORE_ABILITY = {
  id: "stamina_restore",
  name: "Stamina Restore",
  icon: staminaRestoreIcon,
  kind: "restore_stamina",
  manaCost: 5,
  staminaRestore: 20,
  castTimeMs: 2000,
  useDelayMs: 500,
  cooldownMs: 200
};
