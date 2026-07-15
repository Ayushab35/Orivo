const PHASES = [
  {
    key: "expansion",
    label: "Expansion",
    thesis:
      "Resources flow toward ambitious, outward-facing bets. Public moves compound.",
    tone: "positive",
  },
  {
    key: "consolidation",
    label: "Consolidation",
    thesis:
      "Tightening operations, refining systems and pricing produce outsized returns.",
    tone: "neutral",
  },
  {
    key: "recalibration",
    label: "Recalibration",
    thesis:
      "Lower-tempo period. Prune what's not compounding; protect cash and energy.",
    tone: "caution",
  },
  {
    key: "execution",
    label: "Execution",
    thesis:
      "Disciplined shipping beats new bets. The org wants follow-through, not pivots.",
    tone: "neutral",
  },
];

export function leadershipPhase(userBirth: any, target: Date) {
  let anchor = target;
  if (userBirth?.date) {
    const parsed = new Date(userBirth.date);
    if (!Number.isNaN(parsed.getTime())) {
      anchor = parsed;
    }
  }
  const days = Math.floor(
    (target.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24),
  );
  const cycle = ((days % 480) + 480) % 480;
  const phaseIdx = Math.floor(cycle / 120);
  const phase = PHASES[phaseIdx];
  const daysIn = cycle - phaseIdx * 120;
  const daysRemaining = 120 - daysIn;
  return {
    ...phase,
    daysIn,
    daysRemaining,
    cycleLength: 120,
    progressPct: Math.round((daysIn / 120) * 100),
  };
}

export function currentPeriod(userBirth: any, target: Date) {
  let birth = target;
  if (userBirth?.date) {
    const parsed = new Date(userBirth.date);
    if (!Number.isNaN(parsed.getTime())) {
      birth = parsed;
    }
  }
  const minorLength = 120;
  const daysSinceBirth = Math.max(
    0,
    Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const minorIndex = Math.floor(daysSinceBirth / minorLength);
  const currentMinorStart = new Date(
    birth.getTime() + minorIndex * minorLength * 24 * 60 * 60 * 1000,
  );
  const currentMinorEnd = new Date(
    currentMinorStart.getTime() + minorLength * 24 * 60 * 60 * 1000,
  );
  const covered = Math.max(
    0,
    Math.min(
      minorLength,
      Math.floor(
        (target.getTime() - currentMinorStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    ),
  );
  const remaining = Math.max(
    0,
    Math.floor(
      (currentMinorEnd.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const phaseName = leadershipPhase(userBirth, target).label;
  const summaryMap: Record<string, string> = {
    Expansion:
      "This current period favors follow-through and moving the clearest growth opportunities ahead.",
    Consolidation:
      "This current period is best used for refining execution and shoring up the plan.",
    Recalibration:
      "This current period calls for review, pruning, and waiting for clearer momentum before shifting course.",
    Execution:
      "This current period supports disciplined delivery and sharper decisions on what is already in motion.",
  };
  return {
    start: currentMinorStart.toISOString().slice(0, 10),
    end: currentMinorEnd.toISOString().slice(0, 10),
    coveredDays: covered,
    remainingDays: remaining,
    totalDays: minorLength,
    summary:
      summaryMap[phaseName] ??
      "Stay deliberate and keep the focus on what is ready to move.",
  };
}

export function decisionIndex(choghadia: any, currentPeriod: any) {
  const momentum =
    50 + Math.min(50, Math.max(0, (choghadia.good?.length ?? 0) * 10));
  const clarity =
    40 + Math.min(50, Math.max(0, (choghadia.avoid?.length ?? 0) * 5));
  const energy =
    50 + Math.min(40, Math.max(0, 10 - (choghadia.avoid?.length ?? 0) * 2));
  const riskTolerance =
    45 + Math.min(40, Math.max(0, (currentPeriod?.progressPct ?? 0) / 2));
  const score = Math.min(
    96,
    Math.max(35, Math.round((momentum + clarity + energy + riskTolerance) / 4)),
  );
  const allowed = [
    "Review the highest-priority decision you can complete today.",
    "Use the strongest window for stakeholder alignment.",
    "Prepare a follow-up ask before making a commitment.",
  ];
  const avoid = [
    "Avoid hard yes/no choices in the weaker slots.",
    "Delay announcements until your message is sharper.",
  ];
  const tone = score >= 70 ? "positive" : score >= 50 ? "neutral" : "caution";
  return {
    score,
    label: `${score}% decision readiness`,
    tone,
    components: { momentum, clarity, energy, riskTolerance },
    allowed,
    avoid,
  };
}
