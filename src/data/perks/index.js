export const PERKS = [
  { id: "stamina", name: "Stamina", stats: { stamina: 1 } }
];

const PERK_BY_ID = Object.fromEntries(
  PERKS.map((perk) => [perk.id, perk])
);

export function getPerkById(id) {
  if (!id) {
    return null;
  }
  return PERK_BY_ID[id] ?? null;
}
