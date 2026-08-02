import { formatISO } from "date-fns";

const NAMES: Record<string, "best" | "good" | "neutral" | "avoid"> = {
  Amrit: "best",
  Shubh: "good",
  Labh: "good",
  Char: "neutral",
  Rog: "avoid",
  Kaal: "avoid",
  Udveg: "avoid",
};

const DAY_ORDER: Record<number, string[]> = {
  6: ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],
  0: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"],
  1: ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],
  2: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],
  3: ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"],
  4: ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"],
  5: ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"],
};

function sunriseSunset(date: Date) {
  return {
    sunrise: new Date(date.setHours(6, 0, 0, 0)),
    sunset: new Date(date.setHours(18, 0, 0, 0)),
  };
}

export function computeChoghadia(target: Date) {
  const weekday = target.getDay();
  const order = DAY_ORDER[weekday];
  const { sunrise, sunset } = sunriseSunset(new Date(target));
  const minutes = (sunset.getTime() - sunrise.getTime()) / 60000;
  const slotMinutes = minutes / 8;

  const all = order.map((name, index) => {
    const start = new Date(sunrise.getTime() + slotMinutes * index * 60000);
    const end = new Date(sunrise.getTime() + slotMinutes * (index + 1) * 60000);
    return {
      name,
      nature: NAMES[name],
      start: formatISO(start, { representation: "complete" }).slice(0, 16),
      end: formatISO(end, { representation: "complete" }).slice(0, 16),
    };
  });

  return {
    good: all
      .filter((slot) => slot.nature === "best" || slot.nature === "good")
      .slice(0, 2),
    avoid: all.filter((slot) => slot.nature === "avoid").slice(0, 2),
    all,
    sunrise: formatISO(sunrise, { representation: "complete" }).slice(0, 16),
    sunset: formatISO(sunset, { representation: "complete" }).slice(0, 16),
  };
}

export function colorOfTheDay(target: Date) {
  const DAY_COLOR = [
    {
      name: "Saffron",
      hex: "#F4A300",
      reason: "Represents confidence, leadership, vitality, and success.",
    },
    {
      name: "White",
      hex: "#F8F8F8",
      reason: "Brings calmness, emotional balance, peace, and clarity.",
    },
    {
      name: "Red",
      hex: "#D32F2F",
      reason: "Encourages courage, determination, strength, and action.",
    },
    {
      name: "Green",
      hex: "#2E7D32",
      reason: "Supports communication, learning, intelligence, and growth.",
    },
    {
      name: "Yellow",
      hex: "#FBC02D",
      reason: "Symbolizes wisdom, optimism, prosperity, and knowledge.",
    },
    {
      name: "Cream",
      hex: "#FFF3E0",
      reason: "Enhances love, harmony, creativity, beauty, and comfort.",
    },
    {
      name: "Dark Blue",
      hex: "#1E3A5F",
      reason:
        "Represents discipline, patience, responsibility, and perseverance.",
    },
  ];
  return DAY_COLOR[target.getDay()];
}
