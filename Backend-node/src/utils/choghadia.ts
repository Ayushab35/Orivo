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

export function buildDecisionWindows(choghadia: any) {
  const goodNotes = [
    "Best for negotiations, important meetings, or strategic alignment.",
    "Strong window for approvals, briefing the team, or moving a stalled decision forward.",
  ];
  const avoidNotes = [
    "Avoid high-stakes commitments; use this time to review, prep, and lower risk.",
    "Not ideal for major decisions; keep this slot for follow-up or quiet execution.",
  ];

  return {
    good: (choghadia.good || [])
      .slice(0, 2)
      .map((slot: any, index: number) => ({
        start: slot.start,
        end: slot.end,
        note: goodNotes[index] ?? goodNotes[goodNotes.length - 1],
      })),
    avoid: (choghadia.avoid || [])
      .slice(0, 2)
      .map((slot: any, index: number) => ({
        start: slot.start,
        end: slot.end,
        note: avoidNotes[index] ?? avoidNotes[avoidNotes.length - 1],
      })),
  };
}

export function colorOfTheDay(target: Date) {
  const DAY_COLOR = [
    {
      name: "Pearl White",
      hex: "#F4EEDF",
      reason: "composed, receptive, negotiation-friendly.",
    },
    {
      name: "Deep Crimson",
      hex: "#8B1E2E",
      reason: "decisive posture, assertive rooms.",
    },
    {
      name: "Emerald",
      hex: "#1E6E52",
      reason: "sharpen communication and analysis.",
    },
    {
      name: "Saffron Gold",
      hex: "#B8862A",
      reason: "advisory posture, strategic depth.",
    },
    {
      name: "Ivory Cream",
      hex: "#EDE2CC",
      reason: "trust-building, hospitality, brand work.",
    },
    {
      name: "Charcoal Indigo",
      hex: "#1E2436",
      reason: "discipline, systems, quiet execution.",
    },
    {
      name: "Warm Amber",
      hex: "#C88F3A",
      reason: "command tones, boardroom energy.",
    },
  ];

  return DAY_COLOR[target.getDay()];
}
