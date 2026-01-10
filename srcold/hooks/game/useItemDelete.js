import { useMemo, useState } from "react";

export default function useItemDelete({
  baseSlotCount,
  baseSlots,
  bagSlotsById,
  equippedBagId,
  setBaseSlots,
  setBagSlotsById,
  setEquippedBagId,
  setEquippedItems
}) {
  const [deleteDialog, setDeleteDialog] = useState(null);

  const openDeleteDialog = (payload) => {
    if (!payload) {
      return;
    }

    if (payload.source === "character_bag") {
      setDeleteDialog({
        id: payload.id,
        value: "1",
        container: "character_bag"
      });
      return;
    }

    if (payload.source === "character") {
      setDeleteDialog({
        id: payload.id,
        value: "1",
        container: "character",
        slotId: payload.slotId
      });
      return;
    }

    if (payload.source !== "bag") {
      return;
    }

    const slotIndex = payload.index;
    if (!Number.isInteger(slotIndex) || slotIndex < 0) {
      return;
    }

    const isBase = slotIndex < baseSlotCount;
    const localIndex = isBase ? slotIndex : slotIndex - baseSlotCount;
    const bagId = isBase ? null : equippedBagId;
    const slot = isBase
      ? baseSlots[localIndex]
      : bagId
        ? bagSlotsById[bagId]?.[localIndex] ?? null
        : null;

    if (!slot) {
      return;
    }

    setDeleteDialog({
      id: slot.id,
      value: "",
      container: isBase ? "base" : "bag",
      slotIndex: localIndex,
      bagId
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog(null);
  };

  const updateDeleteValue = (value) => {
    setDeleteDialog((prev) =>
      prev
        ? {
            ...prev,
            value
          }
        : prev
    );
  };

  const deleteAvailableCount = useMemo(() => {
    if (!deleteDialog) {
      return 0;
    }
    if (deleteDialog.container === "character_bag") {
      return 1;
    }
    if (deleteDialog.container === "character") {
      return 1;
    }
    if (deleteDialog.container === "base") {
      return baseSlots[deleteDialog.slotIndex]?.count ?? 0;
    }
    return deleteDialog.bagId
      ? bagSlotsById[deleteDialog.bagId]?.[deleteDialog.slotIndex]?.count ?? 0
      : 0;
  }, [deleteDialog, baseSlots, bagSlotsById]);

  const fillDeleteAll = () => {
    setDeleteDialog((prev) =>
      prev
        ? {
            ...prev,
            value: String(deleteAvailableCount)
          }
        : prev
    );
  };

  const confirmDelete = (onDeleteEquipped, onDeleteBag) => {
    if (!deleteDialog) {
      return;
    }

    const max = deleteAvailableCount;
    const amount = Math.floor(Number(deleteDialog.value));

    if (!Number.isFinite(amount) || amount <= 0 || max <= 0) {
      return;
    }

    const nextAmount = Math.max(0, max - Math.min(amount, max));

    if (deleteDialog.container === "character_bag") {
      if (onDeleteBag) {
        onDeleteBag();
      } else if (setEquippedBagId) {
        setEquippedBagId(null);
      }
    } else if (deleteDialog.container === "character") {
      if (onDeleteEquipped) {
        onDeleteEquipped(deleteDialog.slotId);
      } else if (setEquippedItems) {
        setEquippedItems((prev) => {
          const next = { ...prev };
          delete next[deleteDialog.slotId];
          return next;
        });
      }
    } else if (deleteDialog.container === "base") {
      setBaseSlots((prev) => {
        const next = [...prev];
        const slot = next[deleteDialog.slotIndex];
        if (!slot) {
          return prev;
        }
        next[deleteDialog.slotIndex] =
          nextAmount > 0 ? { ...slot, count: nextAmount } : null;
        return next;
      });
    } else if (deleteDialog.bagId) {
      setBagSlotsById((prev) => {
        const bagSlots = prev[deleteDialog.bagId] ?? [];
        const nextBag = [...bagSlots];
        const slot = nextBag[deleteDialog.slotIndex];
        if (!slot) {
          return prev;
        }
        nextBag[deleteDialog.slotIndex] =
          nextAmount > 0 ? { ...slot, count: nextAmount } : null;
        return {
          ...prev,
          [deleteDialog.bagId]: nextBag
        };
      });
    }
    closeDeleteDialog();
  };

  return {
    deleteDialog,
    deleteAvailableCount,
    openDeleteDialog,
    closeDeleteDialog,
    updateDeleteValue,
    fillDeleteAll,
    confirmDelete
  };
}
