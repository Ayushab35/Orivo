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
