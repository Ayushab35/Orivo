"""
Deterministic, rule-based engine for daily favorable/caution windows and numerology.
Vedic-flavored but uses simple seeded heuristics so MVP is consistent and offline.
Outputs are content for self-reflection, not predictions.
"""
from datetime import datetime, timedelta, date as date_cls
import hashlib


def _seed(*parts: str) -> int:
    h = hashlib.sha256("|".join(parts).encode()).hexdigest()
    return int(h[:12], 16)


def _hours_for_seed(seed: int, count: int = 3, kind: str = "fav") -> list[tuple[int, int]]:
    """Pick `count` non-overlapping hour slots between 06:00 and 22:00."""
    offset = 0 if kind == "fav" else 7
    slots = []
    used = set()
    for i in range(count):
        h = 6 + ((seed >> (i * 4 + offset)) % 16)
        if h in used:
            h = 6 + ((h + 3) % 16)
        used.add(h)
        dur = 60 + ((seed >> (i * 3)) % 4) * 15  # 60, 75, 90, 105 min
        slots.append((h, dur))
    slots.sort()
    return slots


FAVORABLE_LABELS = [
    ("Decisive action", "Clarity for committing to a path you've been weighing."),
    ("Stakeholder dialogue", "Receptive window for honest conversations and alignment."),
    ("Strategic review", "Pattern recognition sharper than usual — audit, plan, decide."),
    ("Negotiation", "Composure favors you; counterparties read your steadiness."),
    ("Closing window", "Pen-to-paper energy — finalize, sign, ship."),
]

CAUTION_LABELS = [
    ("Avoid hard commitments", "Read twice, sign later — fine print risks being missed."),
    ("Defer confrontation", "Tone may land sharper than intended; postpone if possible."),
    ("Reactive risk", "Pause before responding to provocations or surprises."),
    ("Public statements", "Hold back on broad announcements; refine the message first."),
]


def compute_daily_outlook(user_birth: dict | None, target: date_cls) -> dict:
    birth_key = ""
    if user_birth:
        birth_key = f"{user_birth.get('date','')}|{user_birth.get('time','')}|{round(user_birth.get('lat',0.0),2)}|{round(user_birth.get('lng',0.0),2)}"
    seed = _seed(birth_key, target.isoformat())

    fav_slots = _hours_for_seed(seed, count=2, kind="fav")
    cau_slots = _hours_for_seed(seed ^ 0xA5A5, count=2, kind="caution")

    favorable = []
    for i, (h, dur) in enumerate(fav_slots):
        label, reason = FAVORABLE_LABELS[(seed + i) % len(FAVORABLE_LABELS)]
        start = datetime.combine(target, datetime.min.time()).replace(hour=h, minute=0)
        end = start + timedelta(minutes=dur)
        favorable.append(
            {"start": start.isoformat(), "end": end.isoformat(), "label": label, "reason": reason}
        )

    caution = []
    for i, (h, dur) in enumerate(cau_slots):
        label, reason = CAUTION_LABELS[(seed + i + 3) % len(CAUTION_LABELS)]
        start = datetime.combine(target, datetime.min.time()).replace(hour=h, minute=0)
        end = start + timedelta(minutes=min(dur, 75))
        caution.append(
            {"start": start.isoformat(), "end": end.isoformat(), "label": label, "reason": reason}
        )

    return {"favorable": favorable, "caution": caution, "date": target.isoformat()}


# --------------------------- Numerology ---------------------------

LUCKY_COLORS = {
    1: ("Burnt Gold", "#BD8B2E"),
    2: ("Pearl Cream", "#F1E9D2"),
    3: ("Saffron", "#D88A2A"),
    4: ("Slate Indigo", "#3B4A6B"),
    5: ("Sage Green", "#7E9B7E"),
    6: ("Rose Taupe", "#9E6F66"),
    7: ("Deep Teal", "#0F6E56"),
    8: ("Charcoal", "#2B2A28"),
    9: ("Terracotta", "#C17A52"),
}

PLANE_MEANINGS = {
    "mind": "Clarity of thought, decision-making instinct.",
    "emotion": "Empathy, sensitivity to stakeholders.",
    "action": "Drive to execute and ship.",
    "thought": "Analytical depth.",
    "will": "Resolve under pressure.",
    "feeling": "Intuition in negotiation.",
    "practical": "Operational discipline.",
    "memory": "Pattern recall, learning curves.",
    "intuition": "Reading the room.",
}


def _digit_sum(n: int) -> int:
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n


def numerology_profile(birth_date_iso: str) -> dict:
    try:
        d = datetime.fromisoformat(birth_date_iso).date()
    except Exception:
        d = date_cls.today()

    life_path = _digit_sum(d.day + d.month + d.year)
    birth_num = _digit_sum(d.day)

    color_name, color_hex = LUCKY_COLORS.get(life_path, LUCKY_COLORS[1])

    # Lucky dates: any date where _digit_sum(day) in {life_path, birth_num}
    today = date_cls.today()
    lucky_dates = []
    for i in range(0, 60):
        cand = today + timedelta(days=i)
        if _digit_sum(cand.day) in {life_path, birth_num}:
            lucky_dates.append(cand.isoformat())
        if len(lucky_dates) >= 6:
            break

    # Loshu grid: 3x3, mark digits present in DOB
    digits = [int(x) for x in d.isoformat().replace("-", "") if x.isdigit() and x != "0"]
    grid_map = {
        1: ("mind", "Clarity of thought, decision-making instinct."),
        2: ("emotion", "Empathy, sensitivity to stakeholders."),
        3: ("action", "Drive to execute and ship."),
        4: ("thought", "Analytical depth."),
        5: ("will", "Resolve under pressure."),
        6: ("feeling", "Intuition in negotiation."),
        7: ("practical", "Operational discipline."),
        8: ("memory", "Pattern recall, learning curves."),
        9: ("intuition", "Reading the room."),
    }
    grid = []
    for n in range(1, 10):
        plane, meaning = grid_map[n]
        count = digits.count(n)
        grid.append({"number": n, "plane": plane, "meaning": meaning, "present": count > 0, "count": count})

    return {
        "lifePath": life_path,
        "birthNumber": birth_num,
        "luckyColor": {"name": color_name, "hex": color_hex},
        "luckyDates": lucky_dates,
        "loshuGrid": grid,
    }
