import { useEffect, useMemo, useState } from "react";
import { CURRENCIES } from "../../data/currencies/index.js";
import {
  DEFAULT_LOCATION_ID,
  LOCATIONS
} from "../../data/locations/index.js";
import * as ALL_RESOURCES_DATA from "../../data/resources/index.js";
import { calculateFinalResources } from "../../data/resources/engine.js";
import { getPerkById } from "../../data/perks/index.js";
import { WORK_DURATION_MS } from "../../config/work.js";
import { aggregateBaseValues, calculateFinalValues } from "../../utils/calcEngine.js";
import { STATS } from "../../data/stats/index.js";
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
import useResources from "../resources/useResources.js";
import useRarityTheme from "../ui/useRarityTheme.js";
import { loadGameSave, saveGameSave } from "../../utils/gameStorage.js";
import useKeybinds from "../input/useKeybinds.js";

function useCurrentLocation() {
  return LOCATIONS[DEFAULT_LOCATION_ID] || Object.values(LOCATIONS)[0];
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
  onUpdateKeybind,
  playerPerksResolved
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
    onClose: dialogs.perksDialog.close,
    perks: playerPerksResolved
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
  durationMs,
  addNotice,
  placeItemInVisibleSlots,
  onLocationClick,
  squeezeLeft,
  squeezeRight,
  initialResources,
  initialDrops,
  playerPerks,
  calculatedMaxResources
}) {
  const { resources, consumeResource, addResource } = useResources(
    ALL_RESOURCES_DATA.RESOURCES || [], 
    playerPerks,
    initialResources,
    calculatedMaxResources
  );

  const { locationItems, handleLoot, locationDrops } = useLootRewards({
    currencies,
    addNotice,
    placeItemInVisibleSlots,
    initialDrops
  });

  const { isWorking, progress, remainingSeconds, handleClick } = useLootEngine({
    location,
    consumeResource,
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
    resources,
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
  initialResources,
  initialDrops,
  playerPerks,
  calculatedMaxResources
}) {
  const lootFlow = useGameLootFlow({
    location,
    currencies: CURRENCIES,
    durationMs: WORK_DURATION_MS,
    addNotice,
    placeItemInVisibleSlots: inventoryFlow.placeItemInVisibleSlots,
    onLocationClick: navigation.handleOpenLocation,
    squeezeLeft: dialogs.characterDialog.isOpen,
    squeezeRight: inventoryFlow.isBagOpen,
    initialResources,
    initialDrops,
    playerPerks,
    calculatedMaxResources
  });

  return {
    ...lootFlow
  };
}

function useGameFlows({ initialSave, staminaBonus, staminaEnabled, avatarPerks = [] }) {
  const location = useCurrentLocation();
  const { keybinds, updateKeybind } = useKeybinds();
  
  const [playerPerks, setPlayerPerks] = useState(() => {
      if (initialSave?.perks && initialSave.perks.length > 0) {
          return initialSave.perks;
      }
      return avatarPerks.map(p => p.id);
  });

  const playerPerksResolved = useMemo(() => {
    return playerPerks.map(id => getPerkById(id)).filter(Boolean);
  }, [playerPerks]);

  // 1. Calculate Final Stats
  const calculatedStats = useMemo(() => {
    const baseValues = aggregateBaseValues(playerPerksResolved.map(p => p.stats));
    return calculateFinalValues(STATS, baseValues);
  }, [playerPerksResolved]);

  // 2. Calculate Final Resources (based on stats)
  const calculatedMaxResources = useMemo(() => {
    const overrideBases = {};
    if (staminaBonus) overrideBases["max_stamina"] = staminaBonus;
    return calculateFinalResources(calculatedStats, overrideBases);
  }, [calculatedStats, staminaBonus]);

  const staminaMax = calculatedMaxResources["max_stamina"] || 0;

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
    initialResources: initialSave?.resources ?? null,
    initialDrops: initialSave?.loot ?? null,
    playerPerks,
    calculatedMaxResources
  });

  const dialogProps = useGameDialogSetup({
    dialogs,
    location,
    locationItems: lootFlow.locationItems,
    navigation,
    keybinds,
    onUpdateKeybind: updateKeybind,
    playerPerksResolved
  });

  const overlayProps = useGameOverlaySetup({ inventoryFlow, lootNotices });

  return {
    navigation,
    inventoryFlow,
    lootFlow,
    dialogProps,
    overlayProps,
    staminaMax,
    dialogs,
    keybinds,
    playerPerks,
    setPlayerPerks,
    calculatedStats,
    calculatedMaxResources
  };
}

export default function useGameController({
  onResetProgress,
  staminaBonus = 0,
  staminaEnabled = true,
  avatarPerks = []
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
    keybinds,
    playerPerks,
    calculatedStats,
    calculatedMaxResources
  } = useGameFlows({ initialSave, staminaBonus, staminaEnabled, avatarPerks });
  
  const handleBagToggle = inventoryFlow.bagProps?.onBagToggle;
  const handleMapOpen = inventoryFlow.bagProps?.onMapOpen;

  useEffect(() => {
    const handleKey = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (dialogs.keybindsDialog.isOpen) return;
      if (event.code === keybinds.resetProgress && onResetProgress) {
        event.preventDefault();
        onResetProgress();
        return;
      }
      if (event.code === keybinds.openMap) {
        event.preventDefault();
        if (dialogs.mapDialog.isOpen) dialogs.mapDialog.close();
        else if (handleMapOpen) handleMapOpen();
        else dialogs.mapDialog.open();
        return;
      }
      if (event.code === keybinds.toggleBag && handleBagToggle) {
        event.preventDefault();
        handleBagToggle();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dialogs, handleBagToggle, handleMapOpen, keybinds, onResetProgress]);

  useEffect(() => {
    saveGameSave({
      inventory: inventoryFlow.inventorySnapshot,
      resources: lootFlow.resources,
      loot: lootFlow.locationDrops,
      perks: playerPerks
    });
  }, [inventoryFlow.inventorySnapshot, lootFlow.resources, lootFlow.locationDrops, playerPerks]);

  return {
    resources: lootFlow.resources || {},
    calculatedStats,
    calculatedMaxResources,
    staminaCurrent: lootFlow.resources?.["max_stamina"] || 0,
    staminaMax: staminaMax || 0,
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
    tooltip: overlayProps.tooltip,
    lootNotices: overlayProps.lootNotices
  };
}
