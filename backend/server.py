import os
import uuid
import random
import string
import httpx
import stripe
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from db import db, ensure_indexes
from auth_utils import create_token, get_current_user_id
from astrology import compute_daily_outlook, numerology_profile
from llm_service import generate_report
from decision_intel import (
    leadership_phase,
    peak_decision_window,
    advisor_reply,
)
from role_fit import compute_role_fit
from choghadia import compute_choghadia, color_of_the_day
from reports import generate_daily_description, generate_soul_report, generate_inner_profile
from security import encrypt_dict, decrypt_dict, encryption_ready
from seed_data import PACKAGES, TASKS

load_dotenv()

DEV_OTP_BYPASS = os.environ.get("DEV_OTP_BYPASS", "true").lower() == "true"
DEV_OTP_CODE = os.environ.get("DEV_OTP_CODE", "123456")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    yield


app = FastAPI(title="Orivo API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")


# --------------------------- Schemas ---------------------------

class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    code: str


class BirthDetails(BaseModel):
    name: str
    role: str
    businessName: str
    industry: str
    birthDate: str  # YYYY-MM-DD
    birthTime: str  # HH:MM
    birthPlace: str
    birthLat: Optional[float] = None
    birthLng: Optional[float] = None


class CheckoutRequest(BaseModel):
    packageId: str
    originUrl: str


class BookingRequest(BaseModel):
    slotStart: str
    slotEnd: str
    paymentMode: Literal["credits", "stripe"]
    packageId: Optional[str] = None
    originUrl: Optional[str] = None


class PersonalityQuiz(BaseModel):
    answers: list[int]  # 5 questions, each 1..5


class TaskComplete(BaseModel):
    taskId: str


# --------------------------- Helpers ---------------------------

def _serialize_user(u: dict) -> dict:
    if not u:
        return {}
    u = {**u}
    u["id"] = u.pop("_id", None)
    return u


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _gen_referral() -> str:
    return "OR-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def _credit_balance(user_id: str) -> int:
    pipeline = [
        {"$match": {"userId": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$deltaSec"}}},
    ]
    cursor = db.credits_ledger.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    return int(docs[0]["total"]) if docs else 0


async def _add_credits(user_id: str, delta_sec: int, reason: str, expires_at: Optional[datetime] = None):
    await db.credits_ledger.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "deltaSec": delta_sec,
            "reason": reason,
            "expiresAt": expires_at,
            "createdAt": _now(),
        }
    )


# --------------------------- Health ---------------------------

@api.get("/")
async def root():
    return {"name": "Orivo API", "status": "ok"}


# --------------------------- Auth ---------------------------

@api.post("/auth/otp/send")
async def otp_send(body: OTPRequest):
    if not body.phone or len(body.phone) < 6:
        raise HTTPException(400, "Invalid phone")
    sid = str(uuid.uuid4())
    await db.otp_sessions.insert_one(
        {
            "_id": sid,
            "phone": body.phone,
            "code": DEV_OTP_CODE,
            "createdAt": _now(),
            "expiresAt": _now() + timedelta(minutes=10),
            "verified": False,
        }
    )
    return {"sid": sid, "devMode": DEV_OTP_BYPASS, "hint": "Use code 123456 in dev mode."}


@api.post("/auth/otp/verify")
async def otp_verify(body: OTPVerify):
    code_ok = body.code == DEV_OTP_CODE if DEV_OTP_BYPASS else False
    if not code_ok:
        raise HTTPException(401, "Invalid code")

    user = await db.users.find_one({"phone": body.phone})
    is_new = user is None
    if is_new:
        user_id = str(uuid.uuid4())
        user = {
            "_id": user_id,
            "phone": body.phone,
            "name": None,
            "role": None,
            "businessName": None,
            "industry": None,
            "birth": None,
            "tier": "executive",
            "referralCode": _gen_referral(),
            "onboarded": False,
            "createdAt": _now(),
            "updatedAt": _now(),
        }
        await db.users.insert_one(user)
        # Seed initial credits: 5 minutes welcome
        await _add_credits(user_id, 300, "welcome", expires_at=_now() + timedelta(days=90))
    token = create_token(user["_id"])
    return {"token": token, "user": _serialize_user(user), "isNew": is_new}


@api.post("/auth/birth-details")
async def save_birth_details(body: BirthDetails, user_id: str = Depends(get_current_user_id)):
    update = {
        "name": body.name,
        "role": body.role,
        "businessName": body.businessName,
        "industry": body.industry,
        "birth": {
            "date": body.birthDate,
            "time": body.birthTime,
            "placeName": body.birthPlace,
            "lat": body.birthLat,
            "lng": body.birthLng,
        },
        "onboarded": True,
        "updatedAt": _now(),
    }
    await db.users.update_one({"_id": user_id}, {"$set": update})
    user = await db.users.find_one({"_id": user_id})
    return {"user": _serialize_user(user)}


@api.get("/users/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    balance = await _credit_balance(user_id)
    return {"user": _serialize_user(user), "creditsBalanceSec": balance}


# --------------------------- City search (Nominatim) ---------------------------

@api.get("/cities/search")
async def search_cities(q: str):
    if not q or len(q) < 2:
        return {"results": []}
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": q, "format": "json", "addressdetails": 1, "limit": 8}
    headers = {"User-Agent": "Orivo/1.0 (contact@orivo.app)"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, params=params, headers=headers)
            data = r.json()
    except Exception:
        return {"results": []}
    out = []
    for d in data:
        addr = d.get("address", {})
        label = ", ".join(
            filter(
                None,
                [
                    addr.get("city") or addr.get("town") or addr.get("village") or addr.get("hamlet") or d.get("name"),
                    addr.get("state"),
                    addr.get("country"),
                ],
            )
        )
        out.append(
            {
                "label": label,
                "lat": float(d["lat"]),
                "lng": float(d["lon"]),
            }
        )
    return {"results": out}


# --------------------------- Daily outlook ---------------------------

@api.get("/outlook/today")
async def outlook_today(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    today = date.today()
    existing = await db.daily_outlooks.find_one({"userId": user_id, "date": today.isoformat()})
    if existing:
        existing["id"] = existing.pop("_id")
        return existing
    outlook = compute_daily_outlook(user.get("birth"), today)
    doc = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "date": today.isoformat(),
        **outlook,
        "createdAt": _now(),
    }
    await db.daily_outlooks.insert_one(doc)
    doc["id"] = doc.pop("_id")
    return doc


# --------------------------- Reports ---------------------------

REPORT_MODULES = ["personality", "strengths", "career", "publicImage", "financialPatterns"]


@api.get("/reports/{module_key}")
async def get_report(
    module_key: str,
    user_id: str = Depends(get_current_user_id),
):
    if module_key not in REPORT_MODULES:
        raise HTTPException(404, "Unknown module")
    existing = await db.reports.find_one({"userId": user_id, "moduleKey": module_key})
    if existing:
        existing["id"] = existing.pop("_id")
        return existing
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("onboarded"):
        raise HTTPException(400, "Complete birth details first")
    content = await generate_report(module_key, user)
    doc = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "moduleKey": module_key,
        "content": content,
        "version": 1,
        "createdAt": _now(),
    }
    await db.reports.insert_one(doc)
    doc["id"] = doc.pop("_id")
    return doc


@api.post("/reports/personality/quiz")
async def submit_quiz(body: PersonalityQuiz, user_id: str = Depends(get_current_user_id)):
    if len(body.answers) != 5 or any(a < 1 or a > 5 for a in body.answers):
        raise HTTPException(400, "Quiz expects 5 answers (1-5)")
    # Compute axis: Q1,Q2 = extroversion; Q3,Q4 = goal-orientation (long-term); Q5 = decisiveness
    extro = int(((body.answers[0] + body.answers[1]) / 10) * 100)
    goal = int(((body.answers[2] + body.answers[3]) / 10) * 100)
    decisive = int((body.answers[4] / 5) * 100)
    result = {
        "summary": (
            f"You lean {'extroverted' if extro >= 50 else 'introverted'} with a "
            f"{'long-horizon' if goal >= 50 else 'near-term'} orientation, "
            f"and a {'decisive' if decisive >= 60 else 'deliberative'} command style."
        ),
        "axis": {"introvertExtrovert": extro, "goalOrientation": goal, "decisiveness": decisive},
    }
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"personalityQuiz": {"answers": body.answers, "result": result, "at": _now()}}},
    )
    # Award task credit if not already
    await _maybe_complete_task(user_id, "complete_personality")
    return result


# --------------------------- Numerology ---------------------------

@api.get("/numerology")
async def get_numerology(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("birth", {}).get("date"):
        raise HTTPException(400, "Birth date required")
    return numerology_profile(user["birth"]["date"])


# --------------------------- Credits & tasks ---------------------------

@api.get("/credits/balance")
async def credits_balance(user_id: str = Depends(get_current_user_id)):
    return {"balanceSec": await _credit_balance(user_id)}


@api.get("/credits/ledger")
async def credits_ledger(user_id: str = Depends(get_current_user_id)):
    cur = db.credits_ledger.find({"userId": user_id}).sort("createdAt", -1).limit(50)
    items = await cur.to_list(length=50)
    for it in items:
        it["id"] = it.pop("_id")
        if it.get("createdAt"):
            it["createdAt"] = it["createdAt"].isoformat()
        if it.get("expiresAt"):
            it["expiresAt"] = it["expiresAt"].isoformat()
    return {"items": items}


async def _maybe_complete_task(user_id: str, task_id: str):
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        return False
    today_key = date.today().isoformat()
    week_key = f"W{date.today().isocalendar().week}-{date.today().year}"
    if task["cadence"] == "daily":
        scope_key = f"{task_id}:{today_key}"
    elif task["cadence"] == "weekly":
        scope_key = f"{task_id}:{week_key}"
    else:
        scope_key = f"{task_id}:once"

    existing = await db.task_completions.find_one({"userId": user_id, "scopeKey": scope_key})
    if existing:
        return False
    await db.task_completions.insert_one(
        {"_id": str(uuid.uuid4()), "userId": user_id, "taskId": task_id, "scopeKey": scope_key, "completedAt": _now()}
    )
    await _add_credits(user_id, task["creditsSec"], f"task:{task_id}", expires_at=_now() + timedelta(days=90))
    return True


@api.get("/tasks")
async def list_tasks(user_id: str = Depends(get_current_user_id)):
    today_key = date.today().isoformat()
    week_key = f"W{date.today().isocalendar().week}-{date.today().year}"
    out = []
    for t in TASKS:
        if t["cadence"] == "daily":
            sk = f"{t['id']}:{today_key}"
        elif t["cadence"] == "weekly":
            sk = f"{t['id']}:{week_key}"
        else:
            sk = f"{t['id']}:once"
        done = await db.task_completions.find_one({"userId": user_id, "scopeKey": sk}) is not None
        out.append({**t, "completed": done})
    return {"items": out}


@api.post("/tasks/complete")
async def complete_task(body: TaskComplete, user_id: str = Depends(get_current_user_id)):
    ok = await _maybe_complete_task(user_id, body.taskId)
    if not ok:
        raise HTTPException(400, "Task not available or already completed for this period")
    return {"ok": True, "balanceSec": await _credit_balance(user_id)}


# --------------------------- Packages & Payments ---------------------------

@api.get("/packages")
async def list_packages():
    return {"items": PACKAGES}


@api.post("/payments/checkout")
async def create_checkout(body: CheckoutRequest, request: Request, user_id: str = Depends(get_current_user_id)):
    pkg = next((p for p in PACKAGES if p["id"] == body.packageId), None)
    if not pkg:
        raise HTTPException(400, "Invalid package")
    if not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Stripe is not configured on this server")

    origin = body.originUrl.rstrip("/")
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/packages"

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": int(round(pkg["priceUsd"] * 100)),
                        "product_data": {
                            "name": pkg["name"],
                            "description": pkg["description"],
                        },
                    },
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "userId": user_id,
                "packageId": pkg["id"],
                "creditsSec": str(pkg["creditsSec"]),
            },
        )
    except stripe.error.StripeError as e:
        raise HTTPException(502, f"Stripe error: {e.user_message or str(e)}")

    await db.payment_transactions.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "session_id": session.id,
            "userId": user_id,
            "packageId": pkg["id"],
            "amount": pkg["priceUsd"],
            "currency": "usd",
            "creditsSec": pkg["creditsSec"],
            "status": "initiated",
            "payment_status": "unpaid",
            "createdAt": _now(),
        }
    )

    return {"url": session.url, "sessionId": session.id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request, user_id: str = Depends(get_current_user_id)):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Stripe is not configured on this server")

    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        raise HTTPException(404, "Transaction not found")

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as e:
        raise HTTPException(502, f"Stripe error: {e.user_message or str(e)}")

    payment_status_val = session.get("payment_status", "unpaid")
    status_val = session.get("status", "open")

    already_credited = txn.get("status") == "completed"
    if payment_status_val == "paid" and not already_credited:
        credits_sec = int(txn.get("creditsSec") or (session.get("metadata") or {}).get("creditsSec", 0))
        if credits_sec > 0:
            await _add_credits(
                txn["userId"],
                credits_sec,
                f"purchase:{txn['packageId']}",
                expires_at=_now() + timedelta(days=90),
            )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "payment_status": "paid", "updatedAt": _now()}},
        )
    elif status_val == "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "expired", "payment_status": payment_status_val, "updatedAt": _now()}},
        )

    return {
        "status": status_val,
        "payment_status": payment_status_val,
        "amount_total": session.get("amount_total"),
        "currency": session.get("currency"),
        "creditsAwarded": already_credited or payment_status_val == "paid",
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")
    if not STRIPE_WEBHOOK_SECRET:
        # Webhook signing not configured; accept but do nothing.
        return {"received": True, "verified": False}
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(400, "Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        sid = session.get("id")
        meta = session.get("metadata") or {}
        credits_sec = int(meta.get("creditsSec", 0))
        user_id = meta.get("userId")
        txn = await db.payment_transactions.find_one({"session_id": sid})
        if txn and txn.get("status") != "completed" and user_id and credits_sec > 0:
            await _add_credits(user_id, credits_sec, f"purchase:{meta.get('packageId')}", expires_at=_now() + timedelta(days=90))
            await db.payment_transactions.update_one(
                {"session_id": sid},
                {"$set": {"status": "completed", "payment_status": "paid", "updatedAt": _now()}},
            )

    return {"received": True, "type": event["type"]}


# --------------------------- Bookings ---------------------------

@api.get("/bookings")
async def list_bookings(user_id: str = Depends(get_current_user_id)):
    cur = db.bookings.find({"userId": user_id}).sort("slotStart", -1).limit(50)
    items = await cur.to_list(length=50)
    for it in items:
        it["id"] = it.pop("_id")
        if it.get("createdAt"):
            it["createdAt"] = it["createdAt"].isoformat()
    return {"items": items}


@api.post("/bookings")
async def create_booking(body: BookingRequest, user_id: str = Depends(get_current_user_id)):
    pkg = next((p for p in PACKAGES if p["id"] == body.packageId), None) if body.packageId else None
    if not pkg:
        raise HTTPException(400, "Package required")

    booking = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "packageId": pkg["id"],
        "slotStart": body.slotStart,
        "slotEnd": body.slotEnd,
        "paymentMode": body.paymentMode,
        "status": "pending",
        "createdAt": _now(),
    }

    if body.paymentMode == "credits":
        balance = await _credit_balance(user_id)
        if balance < pkg["creditsSec"]:
            raise HTTPException(400, "Insufficient credits")
        await _add_credits(user_id, -pkg["creditsSec"], f"booking:{booking['_id']}")
        booking["status"] = "confirmed"
        await db.bookings.insert_one(booking)
        booking["id"] = booking.pop("_id")
        if booking.get("createdAt"):
            booking["createdAt"] = booking["createdAt"].isoformat()
        return {"booking": booking}

    await db.bookings.insert_one(booking)
    booking["id"] = booking.pop("_id")
    if booking.get("createdAt"):
        booking["createdAt"] = booking["createdAt"].isoformat()
    return {"booking": booking, "needsPayment": True}


# --------------------------- Notifications ---------------------------

@api.get("/notifications")
async def list_notifications(user_id: str = Depends(get_current_user_id)):
    cur = db.notifications.find({"userId": user_id}).sort("createdAt", -1).limit(30)
    items = await cur.to_list(length=30)
    if not items:
        # Seed a couple of welcome notifications on first read
        seeds = [
            {"_id": str(uuid.uuid4()), "userId": user_id, "title": "Welcome to Orivo", "body": "Your private decision-support workspace is ready.", "createdAt": _now(), "read": False},
            {"_id": str(uuid.uuid4()), "userId": user_id, "title": "Today's outlook is live", "body": "Review your favorable windows for the day.", "createdAt": _now(), "read": False},
        ]
        await db.notifications.insert_many(seeds)
        items = seeds
    for it in items:
        it["id"] = it.pop("_id")
        if it.get("createdAt"):
            it["createdAt"] = it["createdAt"].isoformat()
    return {"items": items}


# --------------------------- Dashboard (Decision Intelligence) ---------------------------

class AdvisorChatBody(BaseModel):
    message: str
    sessionId: Optional[str] = None


class DecisionLogBody(BaseModel):
    title: str
    context: Optional[str] = None
    decision: Optional[str] = None


@api.get("/dashboard/today")
async def dashboard_today(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    today = date.today()

    # Daily login bonus — once per user per day (+10 seconds)
    login_scope = f"daily_login:{today.isoformat()}"
    existing_login = await db.task_completions.find_one({"userId": user_id, "scopeKey": login_scope})
    awarded = False
    if not existing_login:
        await db.task_completions.insert_one(
            {"_id": str(uuid.uuid4()), "userId": user_id, "taskId": "daily_login", "scopeKey": login_scope, "completedAt": _now()}
        )
        await _add_credits(user_id, 10, "task:daily_login", expires_at=_now() + timedelta(days=90))
        awarded = True

    cache_key = f"{user_id}:{today.isoformat()}"
    existing = await db.daily_reports.find_one({"_id": cache_key})
    if existing:
        existing["id"] = existing.pop("_id")
        if awarded:
            existing["dailyLoginBonusGranted"] = True
        return existing

    # Prefer choghadia payload provided by external astro API (astro_cache), else compute.
    astro_choghadia_doc = await db.astro_cache.find_one(
        {"userId": user_id, "kind": "choghadia", "date": today.isoformat()}
    )
    choghadia = (astro_choghadia_doc or {}).get("payload") or compute_choghadia(today)

    color = color_of_the_day(today)

    # Decrypt chart context (if any) to pass into the LLM
    chart_doc = await db.d1_charts.find_one({"_id": user_id})
    chart = decrypt_dict(chart_doc.get("chartEnc")) if chart_doc else None

    daily = await generate_daily_description(user, color, choghadia, chart)

    doc = {
        "_id": cache_key,
        "userId": user_id,
        "date": today.isoformat(),
        "dayName": today.strftime("%A"),
        "dayDescription": daily,
        "color": color,
        "choghadia": choghadia,
        "generatedAt": _now().isoformat(),
    }
    try:
        await db.daily_reports.insert_one(doc)
    except Exception:
        pass
    doc["id"] = doc.pop("_id")
    if awarded:
        doc["dailyLoginBonusGranted"] = True
    return doc


# --------------------------- New detailed reports ---------------------------

@api.get("/self/soul-purpose")
async def get_soul_purpose(user_id: str = Depends(get_current_user_id)):
    existing = await db.soul_reports.find_one({"_id": user_id})
    if existing:
        existing["id"] = existing.pop("_id")
        return existing
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    chart_doc = await db.d1_charts.find_one({"_id": user_id})
    chart = decrypt_dict(chart_doc.get("chartEnc")) if chart_doc else None
    content = await generate_soul_report(user, chart)
    doc = {
        "_id": user_id,
        "userId": user_id,
        "content": content,
        "generatedAt": _now().isoformat(),
        "version": 1,
    }
    try:
        await db.soul_reports.insert_one(doc)
    except Exception:
        pass
    doc["id"] = doc.pop("_id")
    return doc


@api.post("/self/soul-purpose/refresh")
async def refresh_soul_purpose(user_id: str = Depends(get_current_user_id)):
    await db.soul_reports.delete_one({"_id": user_id})
    return await get_soul_purpose(user_id)


@api.get("/self/inner-profile")
async def get_inner_profile(user_id: str = Depends(get_current_user_id)):
    existing = await db.personality_reports.find_one({"_id": user_id})
    if existing:
        existing["id"] = existing.pop("_id")
        return existing
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    chart_doc = await db.d1_charts.find_one({"_id": user_id})
    chart = decrypt_dict(chart_doc.get("chartEnc")) if chart_doc else None
    content = await generate_inner_profile(user, chart)
    doc = {
        "_id": user_id,
        "userId": user_id,
        "content": content,
        "generatedAt": _now().isoformat(),
        "version": 1,
    }
    try:
        await db.personality_reports.insert_one(doc)
    except Exception:
        pass
    doc["id"] = doc.pop("_id")
    return doc


@api.post("/self/inner-profile/refresh")
async def refresh_inner_profile(user_id: str = Depends(get_current_user_id)):
    await db.personality_reports.delete_one({"_id": user_id})
    return await get_inner_profile(user_id)


# --------------------------- D1 chart ingest (external astro API) ---------------------------

class D1ChartBody(BaseModel):
    provider: str
    chart: dict          # your calculated / provider-returned chart payload
    calculations: Optional[dict] = None  # any derived values (Atmakaraka, 10th lord, etc.)


@api.post("/astro/d1-chart")
async def upsert_d1_chart(body: D1ChartBody, user_id: str = Depends(get_current_user_id)):
    payload_enc = encrypt_dict({"chart": body.chart, "calculations": body.calculations or {}})
    await db.d1_charts.update_one(
        {"_id": user_id},
        {
            "$set": {
                "userId": user_id,
                "provider": body.provider,
                "chartEnc": payload_enc,
                "encrypted": encryption_ready(),
                "updatedAt": _now(),
            },
            "$setOnInsert": {"createdAt": _now()},
        },
        upsert=True,
    )
    # Invalidate downstream reports so they regenerate against the new chart.
    await db.daily_reports.delete_many({"userId": user_id})
    await db.soul_reports.delete_one({"_id": user_id})
    await db.personality_reports.delete_one({"_id": user_id})
    return {"ok": True, "encrypted": encryption_ready()}


@api.get("/astro/d1-chart")
async def get_d1_chart(user_id: str = Depends(get_current_user_id)):
    doc = await db.d1_charts.find_one({"_id": user_id})
    if not doc:
        return {"cached": False, "chart": None}
    payload = decrypt_dict(doc.get("chartEnc")) or {}
    return {
        "cached": True,
        "provider": doc.get("provider"),
        "chart": payload.get("chart"),
        "calculations": payload.get("calculations"),
        "encrypted": bool(doc.get("encrypted")),
        "updatedAt": doc["updatedAt"].isoformat() if doc.get("updatedAt") else None,
    }


@api.post("/advisor/chat")
async def advisor_chat(body: AdvisorChatBody, user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    if not body.message or len(body.message.strip()) < 2:
        raise HTTPException(400, "Message too short")

    session_id = body.sessionId or str(uuid.uuid4())
    history_cur = db.advisor_messages.find({"sessionId": session_id}).sort("createdAt", 1).limit(20)
    history = await history_cur.to_list(length=20)
    formatted = [{"role": h["role"], "content": h["content"]} for h in history]
    is_first = len(history) == 0

    user_msg = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "sessionId": session_id,
        "role": "user",
        "content": body.message.strip(),
        "createdAt": _now(),
    }
    await db.advisor_messages.insert_one(user_msg)

    reply = await advisor_reply({**user, "_id": user_id}, formatted, body.message.strip())
    asst_msg = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "sessionId": session_id,
        "role": "assistant",
        "content": reply,
        "createdAt": _now(),
    }
    await db.advisor_messages.insert_one(asst_msg)

    if is_first:
        title = body.message.strip()
        if len(title) > 70:
            title = title[:67].rstrip() + "…"
        await db.advisor_sessions.update_one(
            {"_id": session_id},
            {
                "$set": {
                    "userId": user_id,
                    "title": title,
                    "lastMessage": reply[:160],
                    "updatedAt": _now(),
                },
                "$setOnInsert": {"createdAt": _now()},
            },
            upsert=True,
        )
    else:
        await db.advisor_sessions.update_one(
            {"_id": session_id},
            {"$set": {"lastMessage": reply[:160], "updatedAt": _now()}},
        )

    return {
        "sessionId": session_id,
        "reply": reply,
        "messageId": asst_msg["_id"],
    }


@api.get("/advisor/sessions")
async def advisor_sessions(user_id: str = Depends(get_current_user_id)):
    cur = db.advisor_sessions.find({"userId": user_id}).sort("updatedAt", -1).limit(50)
    items = await cur.to_list(length=50)
    for it in items:
        it["id"] = it.pop("_id")
        for k in ("createdAt", "updatedAt"):
            if it.get(k):
                it[k] = it[k].isoformat() if hasattr(it[k], "isoformat") else it[k]
    return {"items": items}


@api.get("/advisor/history")
async def advisor_history(sessionId: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    query = {"userId": user_id}
    if sessionId:
        query["sessionId"] = sessionId
    cur = db.advisor_messages.find(query).sort("createdAt", 1).limit(100)
    items = await cur.to_list(length=100)
    for it in items:
        it["id"] = it.pop("_id")
        if it.get("createdAt"):
            it["createdAt"] = it["createdAt"].isoformat()
    return {"items": items, "sessionId": sessionId}


@api.get("/decisions")
async def list_decisions(user_id: str = Depends(get_current_user_id)):
    cur = db.decisions.find({"userId": user_id}).sort("createdAt", -1).limit(20)
    items = await cur.to_list(length=20)
    for it in items:
        it["id"] = it.pop("_id")
        if it.get("createdAt"):
            it["createdAt"] = it["createdAt"].isoformat()
    return {"items": items}


# --------------------------- Astrology cache (Choghadiya / Charts) ---------------------------
# These endpoints are scaffolded for a future 3rd-party astrology API integration.
# Today they return any payload the user/admin previously cached for their account.

class AstroCachePut(BaseModel):
    kind: str  # e.g. "choghadiya", "rasi_chart", "navamsa_chart", "transits"
    date: Optional[str] = None  # YYYY-MM-DD, optional
    payload: dict


@api.get("/astro/cache/{kind}")
async def astro_cache_get(kind: str, date: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    q = {"userId": user_id, "kind": kind}
    if date:
        q["date"] = date
    doc = await db.astro_cache.find_one(q, sort=[("updatedAt", -1)])
    if not doc:
        return {"cached": False, "payload": None}
    return {
        "cached": True,
        "kind": doc.get("kind"),
        "date": doc.get("date"),
        "payload": doc.get("payload"),
        "updatedAt": doc["updatedAt"].isoformat() if doc.get("updatedAt") else None,
    }


@api.post("/astro/cache")
async def astro_cache_put(body: AstroCachePut, user_id: str = Depends(get_current_user_id)):
    key = f"{user_id}:{body.kind}:{body.date or 'na'}"
    await db.astro_cache.update_one(
        {"_id": key},
        {
            "$set": {
                "userId": user_id,
                "kind": body.kind,
                "date": body.date,
                "payload": body.payload,
                "updatedAt": _now(),
            },
            "$setOnInsert": {"createdAt": _now()},
        },
        upsert=True,
    )
    return {"ok": True, "id": key}


@api.post("/decisions")
async def log_decision(body: DecisionLogBody, user_id: str = Depends(get_current_user_id)):
    doc = {
        "_id": str(uuid.uuid4()),
        "userId": user_id,
        "title": body.title.strip(),
        "context": (body.context or "").strip(),
        "decision": (body.decision or "").strip(),
        "createdAt": _now(),
    }
    await db.decisions.insert_one(doc)
    doc["id"] = doc.pop("_id")
    if doc.get("createdAt"):
        doc["createdAt"] = doc["createdAt"].isoformat()
    return doc


app.include_router(api)
