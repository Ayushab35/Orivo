import crypto from "crypto";

const FAVORABLE_LABELS: Array<[string, string]> = [
  ["Decisive action", "Clarity for committing to a path you've been weighing."],
  [
    "Stakeholder dialogue",
    "Receptive window for honest conversations and alignment.",
  ],
  [
    "Strategic review",
    "Pattern recognition sharper than usual — audit, plan, decide.",
  ],
  ["Negotiation", "Composure favors you; counterparties read your steadiness."],
  ["Closing window", "Pen-to-paper energy — finalize, sign, ship."],
];

const CAUTION_LABELS: Array<[string, string]> = [
  [
    "Avoid hard commitments",
    "Read twice, sign later — fine print risks being missed.",
  ],
  [
    "Defer confrontation",
    "Tone may land sharper than intended; postpone if possible.",
  ],
  ["Reactive risk", "Pause before responding to provocations or surprises."],
  [
    "Public statements",
    "Hold back on broad announcements; refine the message first.",
  ],
];

function seedFromParts(...parts: string[]) {
  const hash = crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex");
  return parseInt(hash.slice(0, 12), 16);
}

function hoursForSeed(
  seed: number,
  count = 3,
  kind: "fav" | "caution" = "fav",
) {
  const offset = kind === "fav" ? 0 : 7;
  const slots: Array<[number, number]> = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i += 1) {
    let h = 6 + ((seed >> (i * 4 + offset)) % 16);
    if (used.has(h)) {
      h = 6 + ((h + 3) % 16);
    }
    used.add(h);
    const dur = 60 + ((seed >> (i * 3)) % 4) * 15;
    slots.push([h, dur]);
  }

  slots.sort((a, b) => a[0] - b[0]);
  return slots;
}

export function computeDailyOutlook(userBirth: any, target: Date) {
  const birthKey = userBirth
    ? `${userBirth.date ?? ""}|${userBirth.time ?? ""}|${Number(userBirth.lat ?? 0).toFixed(2)}|${Number(userBirth.lng ?? 0).toFixed(2)}`
    : "";
  const seed = seedFromParts(birthKey, target.toISOString().slice(0, 10));
  const favSlots = hoursForSeed(seed, 2, "fav");
  const cauSlots = hoursForSeed(seed ^ 0xa5a5, 2, "caution");

  const favorable = favSlots.map(([h, dur], index) => {
    const [label, reason] =
      FAVORABLE_LABELS[(seed + index) % FAVORABLE_LABELS.length];
    const start = new Date(target);
    start.setHours(h, 0, 0, 0);
    const end = new Date(start.getTime() + dur * 60000);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label,
      reason,
    };
  });

  const caution = cauSlots.map(([h, dur], index) => {
    const [label, reason] =
      CAUTION_LABELS[(seed + index + 3) % CAUTION_LABELS.length];
    const start = new Date(target);
    start.setHours(h, 0, 0, 0);
    const end = new Date(start.getTime() + Math.min(dur, 75) * 60000);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label,
      reason,
    };
  });

  return { favorable, caution, date: target.toISOString().slice(0, 10) };
}

function digitSum(value: number) {
  let n = value;
  while (n > 9) {
    n = String(n)
      .split("")
      .reduce((acc, digit) => acc + Number(digit), 0);
  }
  return n;
}

export function numerologyProfile(birthDateIso: string) {
  let dateObj = new Date(birthDateIso);
  if (Number.isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const lifePath = digitSum(
    dateObj.getDate() + dateObj.getMonth() + 1 + dateObj.getFullYear(),
  );
  const birthNum = digitSum(dateObj.getDate());

  const LUCKY_COLORS: Record<number, { name: string; hex: string }> = {
    1: { name: "Burnt Gold", hex: "#BD8B2E" },
    2: { name: "Pearl Cream", hex: "#F1E9D2" },
    3: { name: "Saffron", hex: "#D88A2A" },
    4: { name: "Slate Indigo", hex: "#3B4A6B" },
    5: { name: "Sage Green", hex: "#7E9B7E" },
    6: { name: "Rose Taupe", hex: "#9E6F66" },
    7: { name: "Deep Teal", hex: "#0F6E56" },
    8: { name: "Charcoal", hex: "#2B2A28" },
    9: { name: "Terracotta", hex: "#C17A52" },
  };

  const gridMap: Record<number, { plane: string; meaning: string }> = {
    1: {
      plane: "mind",
      meaning: "Clarity of thought, decision-making instinct.",
    },
    2: { plane: "emotion", meaning: "Empathy, sensitivity to stakeholders." },
    3: { plane: "action", meaning: "Drive to execute and ship." },
    4: { plane: "thought", meaning: "Analytical depth." },
    5: { plane: "will", meaning: "Resolve under pressure." },
    6: { plane: "feeling", meaning: "Intuition in negotiation." },
    7: { plane: "practical", meaning: "Operational discipline." },
    8: { plane: "memory", meaning: "Pattern recall, learning curves." },
    9: { plane: "intuition", meaning: "Reading the room." },
  };

  const color = LUCKY_COLORS[lifePath] ?? LUCKY_COLORS[1];

  const today = new Date();
  const luckyDates: string[] = [];
  for (let i = 0; luckyDates.length < 6 && i < 60; i += 1) {
    const cand = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    if (
      digitSum(cand.getDate()) === lifePath ||
      digitSum(cand.getDate()) === birthNum
    ) {
      luckyDates.push(cand.toISOString().slice(0, 10));
    }
  }

  const dobDigits = Array.from(birthDateIso.replace(/[^1-9]/g, ""), Number);
  const loshuGrid = Array.from({ length: 9 }, (_, index) => {
    const n = index + 1;
    return {
      number: n,
      plane: gridMap[n].plane,
      meaning: gridMap[n].meaning,
      present: dobDigits.includes(n),
      count: dobDigits.filter((x) => x === n).length,
    };
  });

  return {
    lifePath,
    birthNumber: birthNum,
    luckyColor: { name: color.name, hex: color.hex },
    luckyDates,
    loshuGrid,
  };
}
