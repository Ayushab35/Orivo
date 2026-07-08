"""
Choghadia (auspicious/inauspicious 8-part day segmentation) computation.
Fallback deterministic engine used when no external astro API has fed
choghadia data into astro_cache for the user + date.

Rules (traditional, simplified):
  - Day is split into 8 muhurta from local sunrise (~06:00) to sunset (~18:00).
  - Weekday determines the order. Each slot has a name/nature.
  - Nature: 'good' | 'best' | 'neutral' | 'avoid'.
"""
from datetime import date, datetime, time, timedelta

# Names & natures, standard mapping
NAMES = {
    "Amrit": "best",
    "Shubh": "good",
    "Labh": "good",
    "Char": "neutral",
    "Rog": "avoid",
    "Kaal": "avoid",
    "Udveg": "avoid",
}

# Order of choghadia during the day, keyed by weekday (Mon=0 ... Sun=6)
DAY_ORDER = {
    6: ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],   # Sun
    0: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"],   # Mon
    1: ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],     # Tue
    2: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],    # Wed
    3: ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"],   # Thu
    4: ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"],    # Fri
    5: ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"],    # Sat
}

# Wearable color of the day (Vedic tradition, translated for a modern CXO tone)
DAY_COLOR = {
    6: {"name": "Warm Amber", "hex": "#C88F3A", "reason": "Solar day — command tones, court-of-boardroom energy."},
    0: {"name": "Pearl White", "hex": "#F4EEDF", "reason": "Lunar day — composed, receptive, negotiation-friendly."},
    1: {"name": "Deep Crimson", "hex": "#8B1E2E", "reason": "Mars day — decisive posture, assertive rooms."},
    2: {"name": "Emerald", "hex": "#1E6E52", "reason": "Mercury day — sharpen communication and analysis."},
    3: {"name": "Saffron Gold", "hex": "#B8862A", "reason": "Jupiter day — advisory posture, strategic depth."},
    4: {"name": "Ivory Cream", "hex": "#EDE2CC", "reason": "Venus day — trust-building, hospitality, brand work."},
    5: {"name": "Charcoal Indigo", "hex": "#1E2436", "reason": "Saturn day — discipline, systems, quiet execution."},
}


def _sunrise_sunset(target: date) -> tuple[time, time]:
    """Placeholder: real values should come from your astro API. Reasonable defaults."""
    return time(6, 0), time(18, 0)


def compute_choghadia(target: date) -> dict:
    """Returns { good: [{name,nature,start,end}], avoid: [...], all: [...] }"""
    weekday = target.weekday()  # Mon=0..Sun=6
    order = DAY_ORDER[weekday]

    sunrise, sunset = _sunrise_sunset(target)
    start_dt = datetime.combine(target, sunrise)
    end_dt = datetime.combine(target, sunset)
    total_minutes = int((end_dt - start_dt).total_seconds() // 60)
    slot_minutes = total_minutes / 8

    all_slots = []
    for i, name in enumerate(order):
        s = start_dt + timedelta(minutes=slot_minutes * i)
        e = start_dt + timedelta(minutes=slot_minutes * (i + 1))
        all_slots.append(
            {
                "name": name,
                "nature": NAMES.get(name, "neutral"),
                "start": s.isoformat(timespec="minutes"),
                "end": e.isoformat(timespec="minutes"),
            }
        )

    # Pick 2 best + 2 avoid, preserving chronological order
    good = [s for s in all_slots if s["nature"] in ("best", "good")]
    avoid = [s for s in all_slots if s["nature"] == "avoid"]
    return {
        "good": good[:2] if good else [],
        "avoid": avoid[:2] if avoid else [],
        "all": all_slots,
        "sunrise": sunrise.isoformat(),
        "sunset": sunset.isoformat(),
    }


def build_decision_windows(choghadia: dict) -> dict:
    good_notes = [
        "Best for negotiations, important meetings, or strategic alignment.",
        "Strong window for approvals, briefing the team, or moving a stalled decision forward.",
    ]
    avoid_notes = [
        "Avoid high-stakes commitments; use this time to review, prep, and lower risk.",
        "Not ideal for major decisions; keep this slot for follow-up or quiet execution.",
    ]

    good = []
    for i, slot in enumerate(choghadia.get("good", [])[:2]):
        good.append({
            "start": slot["start"],
            "end": slot["end"],
            "note": good_notes[i] if i < len(good_notes) else good_notes[-1],
        })

    avoid = []
    for i, slot in enumerate(choghadia.get("avoid", [])[:2]):
        avoid.append({
            "start": slot["start"],
            "end": slot["end"],
            "note": avoid_notes[i] if i < len(avoid_notes) else avoid_notes[-1],
        })

    return {"good": good, "avoid": avoid}


def color_of_the_day(target: date) -> dict:
    return DAY_COLOR[target.weekday()]
