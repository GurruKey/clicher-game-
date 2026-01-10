export default function buildBagDisplayOrder({ slotCount, baseSlotCount }) {
  const bagSlotCount = Math.max(0, slotCount - baseSlotCount);
  return [
    ...Array.from({ length: bagSlotCount }, (_, index) => baseSlotCount + index),
    ...Array.from(
      { length: Math.min(baseSlotCount, slotCount) },
      (_, index) => index
    )
  ];
}
