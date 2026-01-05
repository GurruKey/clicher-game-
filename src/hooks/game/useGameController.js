import { useEffect, useMemo } from "react";
import { CURRENCIES } from "../../data/currencies/index.js";
import {
  DEFAULT_LOCATION_ID,
  LOCATIONS
} from "../../data/locations/index.js";
import {
  STAMINA_COST,
  STAMINA_MAX,
  STAMINA_REGEN_INTERVAL_MS
} from "../../config/stamina.js";
import { WORK_DURATION_MS } from "../../config/work.js";
import useGameInventorySetup from "./useGameInventorySetup.js";
import {
  useCharacterDialog,
  useKeybindsDialog,
  useLocationDialog,
  useMapDialog,
  usePerksDialog,
  useSettingsDialog,
  useStatsDialog,
  useBloodlineDialog
} from "../dialogs/useDialogs.js";
import useLootNotices from "../loot/useLootNotices.js";
import useLootEngine from "../loot/useLootEngine.js";
import useLootRewards from "../loot/useLootRewards.js";
import useStamina from "../resources/useStamina.js";
import useRarityTheme from "../ui/useRarityTheme.js";
import { loadGameSave, saveGameSave } from "../../utils/gameStorage.js";
import useKeybinds from "../input/useKeybinds.js";

function useCurrentLocation() {
  return LOCATIONS[DEFAULT_LOCATION_ID];
}

function useGameDialogsState() {
  const characterDialog = useCharacterDialog();
  const keybindsDialog = useKeybindsDialog();
  const locationDialog = useLocationDialog();
  const mapDialog = useMapDialog();
  const settingsDialog = useSettingsDialog();
  const statsDialog = useStatsDialog();
  const bloodlineDialog = useBloodlineDialog();
  const perksDialog = usePerksDialog();

  return {
    characterDialog,
    keybindsDialog,
    locationDialog,
    mapDialog,
    settingsDialog,
    statsDialog,
    bloodlineDialog,
    perksDialog
  };
}

function useGameDialogSetup({
  dialogs,
  location,
  locationItems,
  navigation,
  keybinds,
  onUpdateKeybind
}) {
  const locationDialogProps = {
    isOpen: dialogs.locationDialog.isOpen,
    locationName: location?.name ?? "Unknown",
    locationCoords: location?.coords ?? null,
    items: locationItems,
    currencies: CURRENCIES,
    onClose: dialogs.locationDialog.close
  };
  const mapDialogProps = {
    isOpen: dialogs.mapDialog.isOpen,
    locationName: location?.name ?? "Unknown",
    locationCoords: location?.coords ?? null,
    onClose: dialogs.mapDialog.close,
    onLocationInfo: navigation.handleOpenLocation
  };
  const settingsDialogProps = {
    isOpen: dialogs.settingsDialog.isOpen,
    onOpen: dialogs.settingsDialog.open,
    onClose: dialogs.settingsDialog.close,
    onOpenKeybinds: () => {
      dialogs.settingsDialog.close();
      dialogs.keybindsDialog.open();
    }
  };
  const keybindsDialogProps = {
    isOpen: dialogs.keybindsDialog.isOpen,
    onClose: dialogs.keybindsDialog.close,
    keybinds,
    onUpdateKeybind
  };
  const statsDialogProps = {
    isOpen: dialogs.statsDialog.isOpen,
    onClose: dialogs.statsDialog.close
  };
  const bloodlineDialogProps = {
    isOpen: dialogs.bloodlineDialog.isOpen,
    onClose: dialogs.bloodlineDialog.close
  };
  const perksDialogProps = {
    isOpen: dialogs.perksDialog.isOpen,
    onClose: dialogs.perksDialog.close
  };

  return {
    locationDialogProps,
    mapDialogProps,
    settingsDialogProps,
    keybindsDialogProps,
    statsDialogProps,
    bloodlineDialogProps,
    perksDialogProps
  };
}

function useGameNavigation({ dialogs, closeOverlays }) {
  const handleToggleCharacter = () => {
    if (dialogs.characterDialog.isOpen) {
      dialogs.characterDialog.close();
      return;
    }

    closeOverlays();
    dialogs.locationDialog.close();
    dialogs.characterDialog.open();
  };

  const handleOpenLocation = () => {
    closeOverlays();
    dialogs.locationDialog.open();
  };

  return {
    handleToggleCharacter,
    handleOpenLocation
  };
}

function useGameOverlaySetup({ inventoryFlow, lootNotices }) {
  return {
    tooltip: inventoryFlow.tooltip,
    lootNotices
  };
}

function useGameLootFlow({
  location,
  currencies,
  staminaMax,
  staminaRegenMs,
  staminaCost,
  durationMs,
  addNotice,
  placeItemInVisibleSlots,
  onLocationClick,
  squeezeLeft,
  squeezeRight,
  initialStamina,
  initialDrops
}) {
  const { stamina, consumeStamina } = useStamina({
    max: staminaMax,
    regenIntervalMs: staminaRegenMs,
    initialStamina
  });
  const { locationItems, handleLoot, locationDrops } = useLootRewards({
    currencies,
    addNotice,
    placeItemInVisibleSlots,
    initialDrops
  });
  const { isWorking, progress, remainingSeconds, handleClick } = useLootEngine({
    location,
    consumeStamina,
    staminaCost,
    durationMs,
    onLoot: handleLoot
  });

  const clickAreaProps = {
    label: "Stone",
    value: "+1",
    onClick: handleClick,
    isWorking,
    progress,
    timeLabel: `${remainingSeconds.toFixed(1)}s`,
    locationName: location?.name ?? "Unknown",
    onLocationClick,
    squeezeLeft,
    squeezeRight
  };

  return {
    staminaCurrent: stamina,
    clickAreaProps,
    locationItems,
    locationDrops
  };
}

function useGameLootSetup({
  location,
  dialogs,
  addNotice,
  inventoryFlow,
  navigation,
  initialStamina,
  initialDrops,
  staminaMax
}) {
  const lootFlow = useGameLootFlow({
    location,
    currencies: CURRENCIES,
    staminaMax,
    staminaRegenMs: STAMINA_REGEN_INTERVAL_MS,
    staminaCost: STAMINA_COST,
    durationMs: WORK_DURATION_MS,
    addNotice,
    placeItemInVisibleSlots: inventoryFlow.placeItemInVisibleSlots,
    onLocationClick: navigation.handleOpenLocation,
    squeezeLeft: dialogs.characterDialog.isOpen,
    squeezeRight: inventoryFlow.isBagOpen,
    initialStamina,
    initialDrops
  });

  return {
    ...lootFlow,
    staminaMax
  };
}

function useGameFlows({ initialSave, staminaBonus, staminaEnabled }) {
  const location = useCurrentLocation();
  const { keybinds, updateKeybind } = useKeybinds();
  const staminaMax = staminaEnabled
    ? STAMINA_MAX + Math.max(0, staminaBonus ?? 0)
    : 0;

  useRarityTheme();

  const { lootNotices, addNotice } = useLootNotices();
  const dialogs = useGameDialogsState();
  const inventoryFlow = useGameInventorySetup({
    dialogs,
    addNotice,
    initialInventory: initialSave?.inventory ?? null,
    onOpenDetails: dialogs.statsDialog.open,
    onOpenBloodline: dialogs.bloodlineDialog.open
  });

  const navigation = useGameNavigation({
    dialogs,
    closeOverlays: inventoryFlow.closeOverlays
  });

  const lootFlow = useGameLootSetup({
    location,
    dialogs,
    addNotice,
    inventoryFlow,
    navigation,
    initialStamina: initialSave?.stamina?.current ?? initialSave?.energy?.current,
    initialDrops: initialSave?.loot ?? null,
    staminaMax
  });

  const dialogProps = useGameDialogSetup({
    dialogs,
    location,
    locationItems: lootFlow.locationItems,
    navigation,
    keybinds,
    onUpdateKeybind: updateKeybind
  });

  const overlayProps = useGameOverlaySetup({ inventoryFlow, lootNotices });

  return {
    navigation,
    inventoryFlow,
    lootFlow,
    dialogProps,
    overlayProps,
    staminaMax: lootFlow.staminaMax,
    dialogs,
    keybinds
  };
}

export default function useGameController({
  onResetProgress,
  staminaBonus = 0,
  staminaEnabled = true
} = {}) {
  const initialSave = useMemo(() => loadGameSave(), []);
  const {
    navigation,
    inventoryFlow,
    lootFlow,
    dialogProps,
    overlayProps,
    staminaMax,
    dialogs,
    keybinds
  } = useGameFlows({ initialSave, staminaBonus, staminaEnabled });
  const handleBagToggle = inventoryFlow.bagProps?.onBagToggle;
  const handleMapOpen = inventoryFlow.bagProps?.onMapOpen;

  useEffect(() => {
    const handleKey = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      if (dialogs.keybindsDialog.isOpen) {
        return;
      }
      if (event.code === keybinds.resetProgress && onResetProgress) {
        event.preventDefault();
        onResetProgress();
        return;
      }
      if (event.code === keybinds.openMap) {
        event.preventDefault();
        if (dialogs.mapDialog.isOpen) {
          dialogs.mapDialog.close();
        } else if (handleMapOpen) {
          handleMapOpen();
        } else {
          dialogs.mapDialog.open();
        }
        return;
      }
      if (event.code === keybinds.toggleBag && handleBagToggle) {
        event.preventDefault();
        handleBagToggle();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    dialogs.keybindsDialog.isOpen,
    dialogs.mapDialog,
    handleBagToggle,
    handleMapOpen,
    keybinds.openMap,
    keybinds.resetProgress,
    keybinds.toggleBag,
    onResetProgress
  ]);

  useEffect(() => {
    saveGameSave({
      inventory: inventoryFlow.inventorySnapshot,
      stamina: { current: lootFlow.staminaCurrent },
      loot: lootFlow.locationDrops
    });
  }, [inventoryFlow.inventorySnapshot, lootFlow.staminaCurrent, lootFlow.locationDrops]);

  return {
    staminaCurrent: lootFlow.staminaCurrent,
    staminaMax,
    onToggleCharacter: navigation.handleToggleCharacter,
    clickAreaProps: lootFlow.clickAreaProps,
    bagProps: inventoryFlow.bagProps,
    contextMenuProps: inventoryFlow.contextMenuProps,
    deleteDialogProps: inventoryFlow.deleteDialogProps,
    locationDialogProps: dialogProps.locationDialogProps,
    mapDialogProps: dialogProps.mapDialogProps,
    settingsDialogProps: dialogProps.settingsDialogProps,
    keybindsDialogProps: dialogProps.keybindsDialogProps,
    statsDialogProps: dialogProps.statsDialogProps,
    bloodlineDialogProps: dialogProps.bloodlineDialogProps,
    perksDialogProps: dialogProps.perksDialogProps,
    characterPanelProps: inventoryFlow.characterPanelProps,
    ...overlayProps
  };
}
