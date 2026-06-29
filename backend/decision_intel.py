"""
Decision Intelligence layer. Translates the underlying engine output into
business language (Decision Index, Leadership Phase, Peak Decision Window,
Daily Brief). Astrology vocabulary is never surfaced.
"""
from datetime import datetime, date as date_cls, timedelta, timezone
import hashlib
import os
import uuid
from typing import Optional

from astrology import _seed, compute_daily_outlook
from emergentintegrations.llm.chat import LlmChat, UserMessage

LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# ---- Leadership Phase (mapped from a 120-day rotating cycle) ----
PHASES = [
    {
        "key": "expansion",
        "label": "Expansion",
        "thesis": "Resources flow toward ambitious, outward-facing bets. Public moves compound.",
        "tone": "positive",
    },
    {
        "key": "consolidation",
        "label": "Consolidation",
        "thesis": "Tightening operations, refining systems and pricing produce outsized returns.",
        "tone": "neutral",
    },
    {
        "key": "recalibration",
        "label": "Recalibration",
        "thesis": "Lower-tempo period. Prune what's not compounding; protect cash and energy.",
        "tone": "caution",
    },
    {
        "key": "execution",
        "label": "Execution",
        "thesis": "Disciplined shipping beats new bets. The org wants follow-through, not pivots.",
        "tone": "neutral",
    },
]

ALLOWED_ACTIVITIES = [
    "Hiring", "Strategic planning", "Investor conversations", "Negotiations",
    "Closing deals", "Board updates", "Pricing decisions", "Long-term commitments",
    "Public statements", "Partnership talks",
]
AVOID_ACTIVITIES = [
    "Emotional decisions", "Long travel", "Hard confrontations", "Major hires (today)",
    "Public statements", "Discretionary spending", "Reactive replies", "Unproven bets",
]


def _digest(parts: str) -> int:
    return int(hashlib.sha256(parts.encode()).hexdigest()[:12], 16)


def leadership_phase(user_birth: dict | None, target: date_cls) -> dict:
    """Rotates phases on a 120-day cycle anchored to birth date if available."""
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
    return {
        **phase,
        "daysIn": days_in_phase,
        "daysRemaining": days_remaining,
        "cycleLength": 120,
        "progressPct": int((days_in_phase / 120) * 100),
    }


def decision_index(user_birth: dict | None, target: date_cls) -> dict:
    """
    Composite 0-100 score derived deterministically from a few seeded factors.
    Returned with sub-components so users see WHY.
    """
    seed = _digest(f"{user_birth or {}}|{target.isoformat()}|idx")
    base = 55 + (seed % 35)  # 55..89
    # tiny modulators
    momentum = 40 + ((seed >> 4) % 50)   # 40..89
    clarity = 45 + ((seed >> 8) % 50)    # 45..94
    energy = 40 + ((seed >> 12) % 55)    # 40..94
    risk = 100 - (30 + ((seed >> 16) % 50))  # invert: 20..69 -> 31..80
    score = round((base * 0.4 + momentum * 0.2 + clarity * 0.2 + energy * 0.1 + risk * 0.1))
    score = max(35, min(96, score))

    if score >= 80:
        label = "Excellent day"
        tone = "positive"
    elif score >= 65:
        label = "Strong day"
        tone = "positive"
    elif score >= 50:
        label = "Mixed signals"
        tone = "neutral"
    else:
        label = "Defensive day"
        tone = "caution"

    # Pick 3 allowed + 2 avoid based on seed
    allowed = []
    seen = set()
    for i in range(8):
        idx = (seed >> (i * 3)) % len(ALLOWED_ACTIVITIES)
        if idx not in seen:
            seen.add(idx)
            allowed.append(ALLOWED_ACTIVITIES[idx])
        if len(allowed) >= 3:
            break

    avoid = []
    seen = set()
    for i in range(8):
        idx = (seed >> (i * 4)) % len(AVOID_ACTIVITIES)
        if idx not in seen:
            seen.add(idx)
            avoid.append(AVOID_ACTIVITIES[idx])
        if len(avoid) >= 2:
            break

    return {
        "score": score,
        "label": label,
        "tone": tone,
        "components": {
            "momentum": momentum,
            "clarity": clarity,
            "energy": energy,
            "riskTolerance": risk,
        },
        "allowed": allowed,
        "avoid": avoid,
    }


def peak_decision_window(user_birth: dict | None, target: date_cls) -> dict:
    """First favorable window, relabeled as 'Peak Decision Window'."""
    outlook = compute_daily_outlook(user_birth, target)
    fav = outlook.get("favorable") or []
    if not fav:
        return {"start": None, "end": None, "confidence": "Moderate"}
    first = fav[0]
    seed = _digest(f"{first['start']}|conf")
    conf_level = ["High", "High", "High", "Strong", "Moderate"][seed % 5]
    return {
        "start": first["start"],
        "end": first["end"],
        "confidence": conf_level,
        "rationale": first.get("reason", ""),
        "secondary": fav[1] if len(fav) > 1 else None,
    }


# ---------- Daily Brief & Advisor (LLM) ----------

BRIEF_SYSTEM = (
    "You are an executive decision intelligence assistant. Tone: McKinsey + Bloomberg — analytical, "
    "calm, objective, never mystical. Translate underlying patterns into business language: "
    "leadership posture, decision quality, communication, negotiation, risk, capital allocation. "
    "Forbidden words: astrology, horoscope, lucky, destiny, zodiac, planet names, nakshatra, dasha, "
    "yoga, transit, fortune, mystical, spiritual. Keep responses concise."
)


async def generate_daily_brief(user: dict, idx: dict, phase: dict, window: dict) -> str:
    """Two- to three-sentence executive brief."""
    fallback = (
        f"Today's decision index is {idx['score']}/100 — {idx['label'].lower()}. "
        f"You are in a {phase['label']} phase: {phase['thesis']} "
        f"Use the {window.get('confidence','High').lower()}-confidence window beginning at "
        f"{(window.get('start') or '').split('T')[-1][:5]} for negotiations, hiring, or closing decisions."
    )
    if not LLM_KEY:
        return fallback
    try:
        name = (user.get("name") or "the executive").split(" ")[0]
        business = user.get("businessName") or "your firm"
        prompt = (
            f"Generate a 2-3 sentence executive daily brief for {name} at {business}. "
            f"Decision Index: {idx['score']}/100 ({idx['label']}). "
            f"Phase: {phase['label']} — {phase['thesis']} "
            f"Peak window: {window.get('confidence','High')} confidence around {window.get('start','')}. "
            f"Allowed today: {', '.join(idx['allowed'])}. Avoid: {', '.join(idx['avoid'])}. "
            "Output PLAIN TEXT only — no JSON, no markdown."
        )
        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=f"orivo-brief-{uuid.uuid4()}",
            system_message=BRIEF_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        out = await chat.send_message(UserMessage(text=prompt))
        text = (out or "").strip().strip('"')
        if 40 < len(text) < 800:
            return text
    except Exception as e:
        print(f"[decision_intel] brief fallback: {e}")
    return fallback


async def advisor_reply(user: dict, history: list, message: str) -> str:
    """AI Advisor chat reply, business-translated."""
    fallback = (
        "Here's how I'd think about this: weigh the decision against your current Expansion phase — "
        "leaning forward on commitments that compound, holding back on emotionally-charged ones. "
        "If this is reversible and low-stake, move now; if it's irreversible, sleep on it and re-ask in the morning."
    )
    if not LLM_KEY:
        return fallback
    try:
        ctx = (
            f"User profile — Name: {user.get('name','—')}; Role: {user.get('role','—')}; "
            f"Business: {user.get('businessName','—')} ({user.get('industry','—')}). "
        )
        sys = BRIEF_SYSTEM + " " + ctx + (
            " Reply in 2-5 short sentences. Avoid bullet points. Always end with a single "
            "concrete recommendation, framed as a next step."
        )
        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=f"orivo-advisor-{user.get('_id','anon')}",
            system_message=sys,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        # Replay limited history into the same session
        for msg in (history or [])[-6:]:
            if msg.get("role") == "user":
                await chat.send_message(UserMessage(text=msg.get("content", "")))
        out = await chat.send_message(UserMessage(text=message))
        text = (out or "").strip()
        if text:
            return text
    except Exception as e:
        print(f"[decision_intel] advisor fallback: {e}")
    return fallback
