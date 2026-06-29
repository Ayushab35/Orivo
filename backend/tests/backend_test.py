"""Orivo backend smoke + integration tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback from frontend/.env via direct read
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
PHONE = f"+1555{int(time.time()) % 10000000:07d}"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    # Send OTP
    r = session.post(f"{API}/auth/otp/send", json={"phone": PHONE})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "sid" in body and body.get("devMode") is True
    # Verify OTP
    r = session.post(f"{API}/auth/otp/verify", json={"phone": PHONE, "code": "123456"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("isNew") is True
    assert "token" in data and data["user"]["phone"] == PHONE
    token = data["token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    return {"token": token, "user": data["user"], "phone": PHONE}


# --- Health ---
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- Auth ---
def test_otp_invalid_code(session):
    r = session.post(f"{API}/auth/otp/send", json={"phone": "+15551112222"})
    assert r.status_code == 200
    r2 = requests.post(f"{API}/auth/otp/verify", json={"phone": "+15551112222", "code": "000000"})
    assert r2.status_code == 401


def test_welcome_credits_awarded(session, auth):
    r = session.get(f"{API}/users/me")
    assert r.status_code == 200
    assert r.json().get("creditsBalanceSec") >= 300


# --- Cities ---
def test_city_search(session, auth):
    r = session.get(f"{API}/cities/search", params={"q": "Mumbai"})
    assert r.status_code == 200
    results = r.json().get("results", [])
    if results:
        assert "label" in results[0] and "lat" in results[0] and "lng" in results[0]
    # Note: external dependency, may be empty - just structural check


# --- Birth details ---
def test_birth_details(session, auth):
    payload = {
        "name": "Test Founder",
        "role": "Founder / CEO",
        "businessName": "Acme Capital",
        "industry": "Technology",
        "birthDate": "1985-04-12",
        "birthTime": "07:42",
        "birthPlace": "Mumbai, Maharashtra, India",
        "birthLat": 19.07,
        "birthLng": 72.87,
    }
    r = session.post(f"{API}/auth/birth-details", json=payload)
    assert r.status_code == 200, r.text
    user = r.json()["user"]
    assert user["onboarded"] is True
    assert user["birth"]["date"] == "1985-04-12"


# --- Outlook ---
def test_outlook_today_idempotent(session, auth):
    r1 = session.get(f"{API}/outlook/today")
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert isinstance(d1.get("favorable"), list) and len(d1["favorable"]) >= 1
    assert isinstance(d1.get("caution"), list) and len(d1["caution"]) >= 1
    r2 = session.get(f"{API}/outlook/today")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d1.get("id") == d2.get("id")


# --- Reports ---
@pytest.mark.parametrize("module", ["personality", "strengths", "career", "publicImage", "financialPatterns"])
def test_report_modules(session, auth, module):
    r = session.get(f"{API}/reports/{module}", timeout=120)
    assert r.status_code == 200, f"{module}: {r.text}"
    body = r.json()
    assert body.get("moduleKey") == module
    assert isinstance(body.get("content"), dict)


def test_personality_quiz(session, auth):
    r = session.post(f"{API}/reports/personality/quiz", json={"answers": [4, 3, 5, 4, 5]})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "summary" in data
    axis = data["axis"]
    for k in ("introvertExtrovert", "goalOrientation", "decisiveness"):
        assert k in axis
    # Verify task completion
    tr = session.get(f"{API}/tasks")
    assert tr.status_code == 200
    items = tr.json()["items"]
    assert any(t["id"] == "complete_personality" and t["completed"] for t in items)


# --- Numerology ---
def test_numerology(session, auth):
    r = session.get(f"{API}/numerology")
    assert r.status_code == 200, r.text
    data = r.json()
    for k in ("lifePath", "birthNumber", "luckyColor", "luckyDates", "loshuGrid"):
        assert k in data
    assert "name" in data["luckyColor"] and "hex" in data["luckyColor"]
    assert len(data["loshuGrid"]) == 9


# --- Tasks & credits ---
def test_tasks_list(session, auth):
    r = session.get(f"{API}/tasks")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 5


def test_daily_checkin_double_credit(session, auth):
    bal_before = session.get(f"{API}/credits/balance").json()["balanceSec"]
    r = session.post(f"{API}/tasks/complete", json={"taskId": "daily_checkin"})
    assert r.status_code == 200, r.text
    bal_after = r.json()["balanceSec"]
    assert bal_after == bal_before + 60
    # Second call same day should fail
    r2 = session.post(f"{API}/tasks/complete", json={"taskId": "daily_checkin"})
    assert r2.status_code == 400


def test_credits_endpoints(session, auth):
    r = session.get(f"{API}/credits/balance")
    assert r.status_code == 200
    assert "balanceSec" in r.json()
    r2 = session.get(f"{API}/credits/ledger")
    assert r2.status_code == 200
    assert isinstance(r2.json()["items"], list)


# --- Packages & payments ---
def test_packages(session, auth):
    r = session.get(f"{API}/packages")
    assert r.status_code == 200
    items = r.json()["items"]
    ids = [p["id"] for p in items]
    assert set(ids) == {"executive_30", "private_60", "founder_90"}


def test_checkout(session, auth):
    r = session.post(
        f"{API}/payments/checkout",
        json={"packageId": "executive_30", "originUrl": BASE_URL},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("url", "").startswith("http")
    assert data.get("sessionId")
    # Status endpoint
    sid = data["sessionId"]
    rs = session.get(f"{API}/payments/status/{sid}")
    assert rs.status_code == 200, rs.text
    sbody = rs.json()
    assert "status" in sbody and "payment_status" in sbody


# --- Bookings ---
def test_booking_credits_and_stripe(session, auth):
    # Buy enough credits via direct ledger? Use small package via credits
    # First ensure enough credit. Welcome=300, daily=60, quiz=300, total ~660. Need 1800 for executive_30.
    # So credits path will fail with insufficient. Test that path explicitly.
    r = session.post(
        f"{API}/bookings",
        json={
            "slotStart": "2099-01-01T10:00:00Z",
            "slotEnd": "2099-01-01T10:30:00Z",
            "paymentMode": "credits",
            "packageId": "executive_30",
        },
    )
    assert r.status_code == 400  # insufficient credits

    # Stripe path
    r2 = session.post(
        f"{API}/bookings",
        json={
            "slotStart": "2099-01-01T11:00:00Z",
            "slotEnd": "2099-01-01T11:30:00Z",
            "paymentMode": "stripe",
            "packageId": "executive_30",
            "originUrl": BASE_URL,
        },
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert data.get("needsPayment") is True
    assert data["booking"]["status"] == "pending"


def test_booking_credits_sufficient(session, auth):
    """Add credits via tasks then book."""
    # Complete remaining tasks to get more credits (not enough for executive_30=1800).
    # We'll directly insert credits via repeated task completions is not possible (daily).
    # Instead test smaller scenario: simulate using a custom package via DB? Not allowed.
    # Just verify stripe path again ensures booking flow stable.
    pytest.skip("Insufficient credits to test full credits-booking path without DB seed.")


# --- Notifications ---
def test_notifications_seed(session, auth):
    r = session.get(f"{API}/notifications")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 2


# --- Decision Intelligence Dashboard ---
FORBIDDEN_VOCAB = [
    "astrology", "horoscope", "lucky", "destiny", "zodiac",
    "nakshatra", "dasha", "yoga", "transit", "fortune",
    "mystical", "spiritual",
]


def _has_forbidden(text: str) -> list:
    """Return list of any forbidden words found (case-insensitive)."""
    if not text:
        return []
    low = text.lower()
    return [w for w in FORBIDDEN_VOCAB if w in low]


def test_dashboard_today_structure_and_cache(session, auth):
    r = session.get(f"{API}/dashboard/today", timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    # Decision Index
    di = d["decisionIndex"]
    assert isinstance(di["score"], int) and 35 <= di["score"] <= 96
    assert di["label"] and di["tone"] in ("positive", "neutral", "caution")
    comp = di["components"]
    for k in ("momentum", "clarity", "energy", "riskTolerance"):
        assert k in comp and isinstance(comp[k], int)
    assert isinstance(di["allowed"], list) and len(di["allowed"]) == 3
    assert isinstance(di["avoid"], list) and len(di["avoid"]) == 2
    # Phase
    ph = d["phase"]
    assert ph["label"] in ("Expansion", "Consolidation", "Recalibration", "Execution")
    assert ph["cycleLength"] == 120
    assert isinstance(ph["thesis"], str) and len(ph["thesis"]) > 5
    assert 0 <= ph["daysIn"] < 120 and 0 < ph["daysRemaining"] <= 120
    assert 0 <= ph["progressPct"] <= 100
    # Peak window
    pw = d["peakWindow"]
    assert pw["start"] and pw["end"] and pw["confidence"]
    # Brief
    assert isinstance(d["brief"], str) and len(d["brief"]) > 20
    bad = _has_forbidden(d["brief"])
    assert not bad, f"Forbidden words in brief: {bad} | brief={d['brief']}"
    # Caching: second call returns same id
    r2 = session.get(f"{API}/dashboard/today", timeout=60)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2.get("id") == d.get("id")


def test_advisor_chat_first_message(session, auth):
    r = session.post(
        f"{API}/advisor/chat",
        json={"message": "Should I raise prices 12% this quarter?"},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("sessionId") and body.get("messageId")
    assert isinstance(body.get("reply"), str) and len(body["reply"]) > 10
    bad = _has_forbidden(body["reply"])
    assert not bad, f"Forbidden words in advisor reply: {bad}"
    # Persist for next test
    pytest._orivo_session = body["sessionId"]


def test_advisor_chat_continues_history(session, auth):
    sid = getattr(pytest, "_orivo_session", None)
    assert sid, "Previous advisor test did not set session id"
    r = session.post(
        f"{API}/advisor/chat",
        json={"message": "What about hiring a CFO instead?", "sessionId": sid},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    assert r.json()["sessionId"] == sid


def test_advisor_history(session, auth):
    sid = getattr(pytest, "_orivo_session", None)
    assert sid
    r = session.get(f"{API}/advisor/history", params={"sessionId": sid})
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    # At least 4 messages (2 user + 2 assistant)
    assert len(items) >= 4
    roles = [m["role"] for m in items]
    assert "user" in roles and "assistant" in roles


def test_advisor_chat_too_short(session, auth):
    r = session.post(f"{API}/advisor/chat", json={"message": "a"})
    assert r.status_code == 400


def test_decisions_log_and_list(session, auth):
    payload = {
        "title": "TEST_ Raise series A",
        "context": "Need 8M to extend runway 18 months.",
        "decision": "Approach top-3 funds.",
    }
    r = session.post(f"{API}/decisions", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["title"] == payload["title"]
    assert "id" in created
    # List
    r2 = session.get(f"{API}/decisions")
    assert r2.status_code == 200
    items = r2.json()["items"]
    assert any(it["id"] == created["id"] for it in items)


def test_dashboard_requires_auth(session):
    fresh = requests.Session()
    fresh.headers.update({"Content-Type": "application/json"})
    r = fresh.get(f"{API}/dashboard/today")
    assert r.status_code in (401, 403)


def test_advisor_requires_auth(session):
    fresh = requests.Session()
    fresh.headers.update({"Content-Type": "application/json"})
    r = fresh.post(f"{API}/advisor/chat", json={"message": "hello there"})
    assert r.status_code in (401, 403)
