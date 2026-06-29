import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def ensure_indexes():
    await db.users.create_index("phone", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.reports.create_index([("userId", 1), ("moduleKey", 1)], unique=True)
    await db.daily_outlooks.create_index([("userId", 1), ("date", 1)], unique=True)
    await db.credits_ledger.create_index([("userId", 1), ("createdAt", -1)])
    await db.bookings.create_index([("userId", 1), ("slotStart", 1)])
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.notifications.create_index([("userId", 1), ("createdAt", -1)])
