"""
Wraps Anthropic's Claude SDK to generate Vedic-flavored, executive-tone
insight content for each report module. Falls back to static content if
ANTHROPIC_API_KEY is not configured or a call fails.
"""
import os
import json
import re
import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")

_client: anthropic.AsyncAnthropic | None = (
    anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
)

SYSTEM_PROMPT = (
    "You write premium, executive-register, Vedic-astrology-flavored insight content for "
    "C-suite founders. Tone: discreet private-banking advisor — never mystical, never generic, "
    "never numeric financial predictions. Always frame as patterns for self-reflection. "
    "Return STRICT JSON only — no markdown, no preamble."
)

MODULE_SCHEMAS = {
    "personality": {
        "prompt": (
            "Generate a personality insight for this leader. Output JSON with keys: "
            "summary (1-2 sentences), traits (array of 4 objects with key,label,score 0-100,note), "
            "axis (object with introvertExtrovert: 0-100 where 100=extrovert, goalOrientation: 0-100 where 100=long-term)."
        ),
        "fallback": {
            "summary": "A composed strategist who reads the room before speaking, with a long horizon for decisions.",
            "traits": [
                {"key": "composure", "label": "Composure under pressure", "score": 82, "note": "Steady in high-stakes rooms."},
                {"key": "analytical", "label": "Analytical depth", "score": 78, "note": "Pattern-spotter, slow to commit to half-data."},
                {"key": "delegation", "label": "Delegation instinct", "score": 64, "note": "Holds onto critical paths longer than ideal."},
                {"key": "candor", "label": "Strategic candor", "score": 71, "note": "Direct, but reads cost of bluntness."},
            ],
            "axis": {"introvertExtrovert": 38, "goalOrientation": 76},
        },
    },
    "strengths": {
        "prompt": (
            "Generate strengths & improvement areas. JSON keys: strengths (3 objects with title,detail), "
            "improvements (3 objects with title,detail,nextStep)."
        ),
        "fallback": {
            "strengths": [
                {"title": "Calm in turbulence", "detail": "You stabilize the room when stakes spike."},
                {"title": "Long-horizon clarity", "detail": "You see 3 moves ahead while peers see 1."},
                {"title": "Quiet conviction", "detail": "You persuade by composure, not volume."},
            ],
            "improvements": [
                {"title": "Delegation reluctance", "detail": "You hold critical paths longer than required.", "nextStep": "Identify one process you'll fully hand off this quarter."},
                {"title": "Decision latency on people", "detail": "Hardest calls — those involving senior people — slip.", "nextStep": "Set a 14-day decision window on any people issue."},
                {"title": "Under-communicating wins", "detail": "You under-narrate progress to the broader org.", "nextStep": "Send a 5-line weekly note to the leadership group."},
            ],
        },
    },
    "career": {
        "prompt": (
            "Generate the career-defining trait. JSON keys: trait (string, 2-4 words), thesis (2 sentences), "
            "leveragePoints (array of 3 strings), watchOuts (array of 2 strings)."
        ),
        "fallback": {
            "trait": "Composed Long-Horizon Operator",
            "thesis": "Your career compounds through patience and calibrated bets — not bursts of activity. You are at your best when others panic.",
            "leveragePoints": [
                "Anchor role in crises — be the one who slows the room down.",
                "Choose multi-year bets where time arbitrage is the moat.",
                "Build a kitchen cabinet of 3 sharp dissenters to pressure-test you.",
            ],
            "watchOuts": [
                "Resist the urge to over-explain — your conviction lands harder when terse.",
                "Don't outsource visibility; the org needs to see your hand on the wheel.",
            ],
        },
    },
    "publicImage": {
        "prompt": (
            "Generate the public image read. JSON keys: perceivedAs (array of 3 strings), "
            "misreadAs (array of 2 strings), recalibration (2 sentences)."
        ),
        "fallback": {
            "perceivedAs": ["Composed and unflappable", "Deliberate, never reactive", "A quiet authority in the room"],
            "misreadAs": ["Distant when in fact you're listening hard", "Slow when in fact you're calibrating"],
            "recalibration": "Narrate your thinking out loud one beat earlier. Your team will read presence, not absence.",
        },
    },
    "financialPatterns": {
        "prompt": (
            "Generate financial PATTERN tendencies — NEVER numbers, NEVER predictions. "
            "JSON keys: revenuePatterns (3 strings), expensePatterns (3 strings), watchPoints (3 strings)."
        ),
        "fallback": {
            "revenuePatterns": [
                "You build revenue through trust-based, long-cycle relationships rather than transactional bursts.",
                "Concentration risk shows up around 1-2 marquee accounts; diversification is a quiet stress.",
                "Pricing conviction is your edge — discounting under pressure dilutes the brand you've built.",
            ],
            "expensePatterns": [
                "Under-spending on personal infrastructure (assistants, tools) costs you leverage.",
                "Over-investing in talent before the system can absorb them is a recurring pattern.",
                "Travel & hospitality compound silently — worth a quarterly audit.",
            ],
            "watchPoints": [
                "Watch the gap between revenue commitment dates and cash arrival.",
                "Watch the urge to fund someone else's narrative with your conviction.",
                "Watch silent recurring spend — the quiet leaks beat the loud ones.",
            ],
        },
    },
}


def _extract_json(text: str) -> dict | None:
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


async def generate_report(module_key: str, user: dict) -> dict:
    spec = MODULE_SCHEMAS.get(module_key)
    if not spec:
        raise ValueError(f"Unknown module {module_key}")

    if _client is None:
        return spec["fallback"]

    birth = user.get("birth", {}) or {}
    profile_blurb = (
        f"Name: {user.get('name','—')}; Role: {user.get('role','—')}; "
        f"Industry: {user.get('industry','—')}; Business: {user.get('businessName','—')}; "
        f"Birth: {birth.get('date','—')} {birth.get('time','—')} at {birth.get('placeName','—')}."
    )

    user_msg = f"{profile_blurb}\n\n{spec['prompt']}"
    try:
        resp = await _client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1200,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        text = "".join(getattr(b, "text", "") for b in resp.content) if resp.content else ""
        parsed = _extract_json(text)
        if parsed:
            return parsed
    except Exception as e:
        print(f"[llm_service] generate_report fallback for {module_key}: {e}")

    return spec["fallback"]
