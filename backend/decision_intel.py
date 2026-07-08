"""
Legacy shim — Decision Intelligence layer (leadership phase + peak window + advisor reply).
Delegates LLM work to `llm_client.get_client(...)`. Kept for backwards compat with the
existing /advisor endpoint. Business-language enforced.
"""
from datetime import datetime, date as date_cls, timedelta, timezone
import hashlib
from typing import Optional

from astrology import _seed, compute_daily_outlook
from llm_client import get_client

# Retained for tests that import _seed indirectly.


PHASES = [
    {"key": "expansion", "label": "Expansion", "thesis": "Resources flow toward ambitious, outward-facing bets. Public moves compound.", "tone": "positive"},
    {"key": "consolidation", "label": "Consolidation", "thesis": "Tightening operations, refining systems and pricing produce outsized returns.", "tone": "neutral"},
    {"key": "recalibration", "label": "Recalibration", "thesis": "Lower-tempo period. Prune what's not compounding; protect cash and energy.", "tone": "caution"},
    {"key": "execution", "label": "Execution", "thesis": "Disciplined shipping beats new bets. The org wants follow-through, not pivots.", "tone": "neutral"},
]


def _digest(parts: str) -> int:
    return int(hashlib.sha256(parts.encode()).hexdigest()[:12], 16)


def leadership_phase(user_birth: dict | None, target: date_cls) -> dict:
    if user_birth and user_birth.get("date"):
        try:
            anchor = datetime.fromisoformat(user_birth["date"]).date()
        except Exception:
            anchor = target
    else:
        anchor = target
    days = (target - anchor).days
    cycle = ((days % 480) + 480) % 480
    phase_idx = cycle // 120
    phase = PHASES[phase_idx]
    days_in_phase = cycle - (phase_idx * 120)
    days_remaining = 120 - days_in_phase
    return {**phase, "daysIn": days_in_phase, "daysRemaining": days_remaining, "cycleLength": 120, "progressPct": int((days_in_phase / 120) * 100)}


def peak_decision_window(user_birth: dict | None, target: date_cls) -> dict:
    outlook = compute_daily_outlook(user_birth, target)
    fav = outlook.get("favorable") or []
    if not fav:
        return {"start": None, "end": None, "confidence": "Moderate"}
    first = fav[0]
    seed = _digest(f"{first['start']}|conf")
    conf_level = ["High", "High", "High", "Strong", "Moderate"][seed % 5]
    return {"start": first["start"], "end": first["end"], "confidence": conf_level, "rationale": first.get("reason", ""), "secondary": fav[1] if len(fav) > 1 else None}


def current_period(user_birth: dict | None, target: date_cls) -> dict:
    if user_birth and user_birth.get("date"):
        try:
            birth = datetime.fromisoformat(user_birth["date"]).date()
        except Exception:
            birth = target
    else:
        birth = target

    minor_length = 120
    days_since_birth = max(0, (target - birth).days)
    minor_index = days_since_birth // minor_length
    current_minor_start = birth + timedelta(days=minor_index * minor_length)
    current_minor_end = current_minor_start + timedelta(days=minor_length)
    covered = max(0, min(minor_length, (target - current_minor_start).days))
    remaining = max(0, (current_minor_end - target).days)

    phase_name = leadership_phase(user_birth, target)["label"]
    summary_map = {
        "Expansion": "This current period favors follow-through and moving the clearest growth opportunities ahead.",
        "Consolidation": "This current period is best used for refining execution and shoring up the plan.",
        "Recalibration": "This current period calls for review, pruning, and waiting for clearer momentum before shifting course.",
        "Execution": "This current period supports disciplined delivery and sharper decisions on what is already in motion.",
    }

    return {
        "start": current_minor_start.isoformat(),
        "end": current_minor_end.isoformat(),
        "coveredDays": covered,
        "remainingDays": remaining,
        "totalDays": minor_length,
        "summary": summary_map.get(phase_name, "Stay deliberate and keep the focus on what is ready to move."),
    }


BRIEF_SYSTEM = (
    "You are an executive decision intelligence assistant. Tone: McKinsey + Bloomberg — analytical, "
    "calm, objective, never mystical. Translate underlying patterns into business language. "
    "Forbidden words: astrology, horoscope, lucky, destiny, zodiac, nakshatra, dasha, yoga, transit, fortune, mystical, spiritual. "
    "Keep responses concise."
)


async def advisor_reply(user: dict, history: list, message: str) -> str:
    fallback = (
        "Here's how I'd think about this: weigh the decision against your current Expansion phase — "
        "leaning forward on commitments that compound, holding back on emotionally-charged ones. "
        "If this is reversible and low-stake, move now; if it's irreversible, sleep on it and re-ask in the morning."
    )
    client = get_client("advisor")
    if not client.available:
        return fallback

    ctx = (
        f"User profile — Name: {user.get('name','—')}; Role: {user.get('role','—')}; "
        f"Business: {user.get('businessName','—')} ({user.get('industry','—')}). "
    )
    sys = BRIEF_SYSTEM + " " + ctx + (
        " Reply in 2-5 short sentences. Avoid bullet points. Always end with a single concrete recommendation."
    )
    messages: list[dict] = []
    for msg in (history or [])[-6:]:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    resp = await client.generate(sys, messages, max_tokens=600)
    return (resp.text if resp else "").strip() or fallback
