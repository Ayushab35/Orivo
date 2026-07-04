"""
Report generators for the two dashboard modules the CXO taps into:
  1. Soul Purpose & Potential Profession
  2. Inner Profile — nature, goal orientation, personality, strengths, public image

Each generator:
  - accepts the user profile + optional D1 chart context
  - calls the modular LLM client
  - returns a strict JSON template
  - has a safe fallback so the app works even without API keys
"""
from typing import Optional
from llm_client import get_client


# ---------------- Templates ----------------

DAILY_BRIEF_TEMPLATE = {
    "description": "string — 2-3 sentence executive-tone reading of the day",
    "auspicious": "string — 1 sentence on what the day supports",
    "caution": "string — 1 sentence on what to hold back on",
}

SOUL_TEMPLATE = {
    "soulPurpose": "string — 2-3 sentence articulation of the person's dharmic direction, in business language",
    "purposeThemes": ["string", "string", "string"],
    "primaryProfession": "string — one canonical role/vocation (executive vocabulary)",
    "alternativeProfessions": ["string", "string", "string"],
    "avoidProfessions": ["string", "string"],
    "reasoning": "string — 2-4 sentence explanation, referencing chart houses/lords in *plain business* language (no jargon)",
    "signals": [
        {"label": "string", "value": "string", "note": "string"}
    ],
}

INNER_PROFILE_TEMPLATE = {
    "nature": {
        "axis": "int 0-100 (0=deeply introverted, 100=deeply extroverted)",
        "label": "string — one-liner label",
        "detail": "string — 2 sentence explanation"
    },
    "goalOrientation": {
        "score": "int 0-100 (0=short-term, 100=long-horizon)",
        "label": "string",
        "detail": "string — 2 sentence explanation"
    },
    "innerPersonality": "string — 3-4 sentences on how the person operates in private",
    "strengths": ["string", "string", "string", "string"],
    "weaknesses": ["string", "string", "string"],
    "publicImage": "string — 2-3 sentence read on how the world perceives them",
    "recalibration": "string — 1 sentence advisory nudge"
}


SYSTEM_PROMPT = (
    "You are an executive advisor writing for a C-suite founder. Tone: private-banking + McKinsey. "
    "Translate any underlying astrological or numerological signals into calm, objective business language. "
    "Forbidden vocabulary: horoscope, zodiac, planet names, dasha, nakshatra, yoga, transit, lucky, mystical, spiritual, destiny. "
    "Every output must be strict JSON, no markdown, no preamble."
)


# ---------------- Fallbacks ----------------

SOUL_FALLBACK = {
    "soulPurpose": (
        "You are built to translate long-horizon vision into institutions. Your dharmic pull is toward "
        "shaping systems and people that outlast a single cycle — not chasing a single win."
    ),
    "purposeThemes": ["Institution-building", "Long-cycle strategy", "Talent stewardship"],
    "primaryProfession": "Founder / CEO of a compounding, mission-led firm",
    "alternativeProfessions": ["Managing Partner of a private-capital firm", "Chairperson / Board Anchor", "Chief Strategy Officer at scale"],
    "avoidProfessions": ["Transactional, quarter-to-quarter sales roles", "High-volume trading desks"],
    "reasoning": (
        "Your operating signature is patience under uncertainty and clarity when stakes rise. You compound where "
        "others burn out. Roles that reward endurance and framing — rather than reaction speed — return more of you."
    ),
    "signals": [
        {"label": "Compounding orientation", "value": "High", "note": "Long feedback loops fit you."},
        {"label": "Ambiguity tolerance", "value": "High", "note": "Comfortable in undefined problems."},
        {"label": "Service instinct", "value": "Strong", "note": "You lead best when there is a mission behind the P&L."},
    ],
}

INNER_PROFILE_FALLBACK = {
    "nature": {"axis": 38, "label": "Reserved by default, expressive when it matters", "detail": "You do not fill silence for its own sake. You save your presence for high-stakes rooms."},
    "goalOrientation": {"score": 78, "label": "Long-horizon operator", "detail": "You optimise for outcomes 3+ years out; short-term wins register but do not drive you."},
    "innerPersonality": "In private you are precise, self-critical, and slow to commit. You test ideas against yourself before testing them against the room. Your best thinking happens when you're not being watched.",
    "strengths": ["Composure under pressure", "Strategic patience", "Reads the room quickly", "Talent judgement"],
    "weaknesses": ["Delegation reluctance", "Under-communicates progress", "Under-narrates conviction"],
    "publicImage": "You are read as steady and deliberate — sometimes distant. Stakeholders trust your judgement, but occasionally need more of it out loud.",
    "recalibration": "Narrate your thinking one beat earlier. Presence is more expensive than absence.",
}


# ---------------- User profile blurb ----------------

def _profile_blurb(user: dict, chart: Optional[dict]) -> str:
    birth = user.get("birth") or {}
    parts = [
        f"Name: {user.get('name','—')}",
        f"Role: {user.get('role','—')}",
        f"Business: {user.get('businessName','—')} ({user.get('industry','—')})",
        f"Birth: {birth.get('date','—')} {birth.get('time','—')} at {birth.get('placeName','—')}",
    ]
    if chart:
        parts.append(f"D1 chart summary: {chart}")
    return "; ".join(parts)


# ---------------- Generators ----------------

async def generate_daily_description(user: dict, day_color: dict, choghadia: dict, chart: Optional[dict] = None) -> dict:
    client = get_client("brief")
    fallback = {
        "description": (
            f"A day that favours composure over speed. Wear {day_color['name']} to anchor your presence — "
            f"{day_color['reason']} Use the strongest window to advance one decision that has been drifting."
        ),
        "auspicious": "Negotiations, hiring conversations, board-level clarity.",
        "caution": "Reactive replies, discretionary commitments, and hard confrontations.",
    }
    if not client.available:
        return fallback
    good = ", ".join(f"{s['name']} {s['start'][-5:]}-{s['end'][-5:]}" for s in (choghadia.get("good") or []))
    avoid = ", ".join(f"{s['name']} {s['start'][-5:]}-{s['end'][-5:]}" for s in (choghadia.get("avoid") or []))
    msg = (
        f"{_profile_blurb(user, chart)}\n\n"
        f"Wearable color of the day: {day_color['name']} ({day_color['reason']}). "
        f"Auspicious windows: {good}. Avoid windows: {avoid}. "
        "Write a 2-3 sentence executive-tone daily description in strict JSON with keys "
        "description, auspicious, caution."
    )
    out = await client.generate_json(SYSTEM_PROMPT, [{"role": "user", "content": msg}], max_tokens=400)
    if out and out.get("description"):
        return {
            "description": out.get("description") or fallback["description"],
            "auspicious": out.get("auspicious") or fallback["auspicious"],
            "caution": out.get("caution") or fallback["caution"],
        }
    return fallback


async def generate_soul_report(user: dict, chart: Optional[dict] = None, extra_rules: Optional[str] = None) -> dict:
    """extra_rules lets you inject deterministic calculations (D9 lord, Atmakaraka, etc.)
    that the LLM must respect. Later, you'll pass computed values from your D1 pipeline."""
    client = get_client("report")
    if not client.available:
        return SOUL_FALLBACK
    schema_json = str(SOUL_TEMPLATE).replace("'", '"')
    msg = (
        f"{_profile_blurb(user, chart)}\n\n"
        + (f"Interpretation rules to respect: {extra_rules}\n\n" if extra_rules else "")
        + "Generate the 'Soul Purpose & Potential Profession' report. Output must exactly match this JSON schema:\n"
        + schema_json
    )
    out = await client.generate_json(SYSTEM_PROMPT, [{"role": "user", "content": msg}], max_tokens=1500)
    if out and out.get("soulPurpose"):
        return out
    return SOUL_FALLBACK


async def generate_inner_profile(user: dict, chart: Optional[dict] = None) -> dict:
    client = get_client("report")
    if not client.available:
        return INNER_PROFILE_FALLBACK
    schema_json = str(INNER_PROFILE_TEMPLATE).replace("'", '"')
    msg = (
        f"{_profile_blurb(user, chart)}\n\n"
        "Generate the 'Inner Profile' report. Output must exactly match this JSON schema:\n"
        + schema_json
    )
    out = await client.generate_json(SYSTEM_PROMPT, [{"role": "user", "content": msg}], max_tokens=1500)
    if out and out.get("nature"):
        return out
    return INNER_PROFILE_FALLBACK
