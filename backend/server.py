import os
import uuid
import random
import string
import httpx
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from db import db, ensure_indexes
from auth_utils import create_token, get_current_user_id
from astrology import compute_daily_outlook, numerology_profile
from llm_service import generate_report
from seed_data import PACKAGES, TASKS

load_dotenv()

DEV_OTP_BYPASS = os.environ.get("DEV_OTP_BYPASS", "true").lower() == "true"
DEV_OTP_CODE = os.environ.get("DEV_OTP_CODE", "123456")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")


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
async def get_report(module_key: str, user_id: str = Depends(get_current_user_id)):
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

    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout,
        CheckoutSessionRequest,
    )

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin = body.originUrl.rstrip("/")
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/packages"

    req = CheckoutSessionRequest(
        amount=float(pkg["priceUsd"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"userId": user_id, "packageId": pkg["id"], "creditsSec": str(pkg["creditsSec"])},
    )
    session = await stripe_checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "session_id": session.session_id,
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

    return {"url": session.url, "sessionId": session.session_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request, user_id: str = Depends(get_current_user_id)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        raise HTTPException(404, "Transaction not found")

    status = await stripe_checkout.get_checkout_status(session_id)

    already_credited = txn.get("status") == "completed"
    if status.payment_status == "paid" and not already_credited:
        # Award credits
        credits_sec = int(txn.get("creditsSec") or status.metadata.get("creditsSec", 0))
        if credits_sec > 0:
            await _add_credits(
                txn["userId"], credits_sec, f"purchase:{txn['packageId']}",
                expires_at=_now() + timedelta(days=90),
            )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "payment_status": "paid", "updatedAt": _now()}},
        )
    elif status.status == "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "expired", "payment_status": status.payment_status, "updatedAt": _now()}},
        )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "creditsAwarded": already_credited or status.payment_status == "paid",
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        evt = await stripe_checkout.handle_webhook(body, sig)
    except Exception:
        return {"received": True}
    return {"received": True, "type": evt.event_type}


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


app.include_router(api)
