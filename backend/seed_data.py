"""Seed initial catalog data: packages and task templates."""
PACKAGES = [
    {
        "id": "executive_30",
        "name": "Executive Session",
        "description": "30-minute private consultation.",
        "creditsSec": 1800,
        "priceUsd": 149.0,
        "popular": False,
        "tier": "executive",
    },
    {
        "id": "private_60",
        "name": "Private Counsel",
        "description": "60-minute private consultation with senior advisor.",
        "creditsSec": 3600,
        "priceUsd": 279.0,
        "popular": True,
        "tier": "private",
    },
    {
        "id": "founder_90",
        "name": "Founder Strategy",
        "description": "90-minute deep-dive on a single decision or quarter.",
        "creditsSec": 5400,
        "priceUsd": 399.0,
        "popular": False,
        "tier": "founder",
    },
]

TASKS = [
    {"id": "daily_checkin", "title": "Daily check-in", "description": "Open Orivo and review today's outlook.", "creditsSec": 60, "cadence": "daily"},
    {"id": "complete_personality", "title": "Complete personality assessment", "description": "Answer the personality quiz.", "creditsSec": 300, "cadence": "once"},
    {"id": "open_numerology", "title": "Review numerology hub", "description": "Open Numerology hub once today.", "creditsSec": 90, "cadence": "daily"},
    {"id": "log_decision", "title": "Log one decision", "description": "Record one decision you've taken this week.", "creditsSec": 180, "cadence": "weekly"},
    {"id": "share_referral", "title": "Refer one peer", "description": "Share your referral code with a peer founder.", "creditsSec": 600, "cadence": "weekly"},
]
