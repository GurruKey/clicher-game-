export const STATS = [
  {
    id: "strength",
    label: "Strength",
    sources: ["Race", "Origin", "Faction", "Perks"],
    effects: ["No direct effects yet."]
  },
  {
    id: "agility",
    label: "Agility",
    sources: ["Race", "Origin", "Faction", "Perks"],
    effects: ["Adds to Stamina (+1 per Agility).", "Stamina unlock required."]
  },
  {
    id: "stamina",
    label: "Stamina",
    sources: ["Race", "Origin", "Faction", "Perks"],
    effects: [
      "Adds to Stamina max (+1 per Stamina).",
      "Stamina unlock required."
    ]
  },
  {
    id: "intellect",
    label: "Intellect",
    sources: ["Race", "Origin", "Faction", "Perks"],
    effects: ["No direct effects yet."]
  }
];

export function buildStatDetails(statValues = null, fallbackValue = 0) {
  return STATS.map((stat) => {
    const value = statValues?.[stat.id] ?? fallbackValue;
    return { id: stat.id, label: stat.label, value: String(value) };
  });
}

export function getStatValue(statValues, id, fallbackValue = 0) {
  const raw = statValues?.[id];
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallbackValue;
}

export function getStatValueFromDetails(details, id, fallbackValue = 0) {
  if (!details) {
    return fallbackValue;
  }
  const match = details.find((detail) => detail.id === id);
  if (!match) {
    return fallbackValue;
  }
  const num = Number(match.value);
  return Number.isFinite(num) ? num : fallbackValue;
}
