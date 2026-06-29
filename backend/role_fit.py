"""
Executive Role-Fit computation. Maps deterministic seed (from DOB+time+place)
to one of 6 executive archetypes with alignment-vs-current-role scoring.
Vocabulary stays in business terms.
"""
from datetime import date as date_cls
import hashlib

ARCHETYPES = [
    {
        "key": "visionary_strategist",
        "label": "Visionary Strategist",
        "thesis": "You operate best when shaping multi-year direction — fund the bets, then hold the line. Day-to-day execution drains you; long-horizon framing energizes you.",
        "bestFor": "Founder / CEO of an ambition-led company; chairperson role; long-cycle product bets.",
        "watchOut": "You under-invest in operating cadence. Pair yourself with an Operations Architect.",
    },
    {
        "key": "operations_architect",
        "label": "Operations Architect",
        "thesis": "Your edge is converting ambition into systems — process, throughput, margin. You compound when you own the operating cadence and metric tree.",
        "bestFor": "COO / Chief of Staff; scaling-stage operator; carve-out integration lead.",
        "watchOut": "Avoid roles that demand constant narrative-building — that's a tax on your strengths.",
    },
    {
        "key": "capital_allocator",
        "label": "Capital Allocator",
        "thesis": "You read where money and time should move next better than peers. Your conviction holds through cycles, and you say no with discipline.",
        "bestFor": "CFO / Managing Partner; board investor seats; portfolio-shape decisions.",
        "watchOut": "You can over-index on numbers — protect time for stakeholder conviction-building.",
    },
    {
        "key": "brand_custodian",
        "label": "Brand Custodian",
        "thesis": "Public posture is your moat. You shape how the firm is perceived — by customers, talent, capital — in a way that compounds.",
        "bestFor": "President / Chief Brand Officer; founder-led narrative companies; investor-facing positions.",
        "watchOut": "Don't outsource operating decisions to chase visibility — depth still wins.",
    },
    {
        "key": "talent_magnet",
        "label": "Talent Magnet",
        "thesis": "Your highest-leverage activity is attracting and shaping talent. Rooms gravitate toward you; people stay longer when you lead them.",
        "bestFor": "CEO of a talent-driven firm; Chief People Officer; founding-team builder.",
        "watchOut": "You can confuse loyalty with output — install an honest performance lens.",
    },
    {
        "key": "market_maker",
        "label": "Market Maker",
        "thesis": "You sense where the market is forming before consensus does. You're best in roles where dealmaking, partnerships, and category-creation matter.",
        "bestFor": "CRO / Chief Business Officer; BD-led founder; private-deal sourcing.",
        "watchOut": "Resist the urge to chase optionality — lock down one bet before opening the next.",
    },
]


def _digest(s: str) -> int:
    return int(hashlib.sha256(s.encode()).hexdigest()[:12], 16)


def compute_role_fit(user: dict, target: date_cls) -> dict:
    birth = user.get("birth") or {}
    key = f"{birth.get('date','')}|{birth.get('time','')}|{birth.get('lat',0)}|{birth.get('lng',0)}|role"
    seed = _digest(key)
    idx = seed % len(ARCHETYPES)
    arch = ARCHETYPES[idx]

    # Alignment with current declared role
    role = (user.get("role") or "").lower()
    role_map = {
        "visionary_strategist": ["founder", "ceo", "president", "chairperson"],
        "operations_architect": ["coo", "operations", "chief of staff", "managing director"],
        "capital_allocator": ["cfo", "managing partner", "investor", "board member"],
        "brand_custodian": ["president", "cmo", "chief brand", "chief marketing"],
        "talent_magnet": ["chief people", "chro", "ceo", "founder"],
        "market_maker": ["cro", "chief business", "cbo", "co-founder", "bd"],
    }
    matches = role_map.get(arch["key"], [])
    alignment = 60 + ((seed >> 8) % 35)  # baseline 60..94
    for m in matches:
        if m in role:
            alignment = min(98, alignment + 8)
            break

    secondary = ARCHETYPES[(idx + 1 + (seed >> 4) % 3) % len(ARCHETYPES)]

    return {
        "archetype": arch["label"],
        "archetypeKey": arch["key"],
        "thesis": arch["thesis"],
        "bestFor": arch["bestFor"],
        "watchOut": arch["watchOut"],
        "alignment": alignment,
        "alignmentLabel": (
            "Strongly aligned with your current role" if alignment >= 85 else
            "Largely aligned with your current role" if alignment >= 72 else
            "Partial alignment — consider rebalancing your time"
        ),
        "secondary": {"archetype": secondary["label"], "key": secondary["key"]},
    }
