"""
Field-level encryption for PII (birth data, D1 chart payloads, etc.).
Uses Fernet (AES-128-CBC + HMAC) with a key from FIELD_ENCRYPTION_KEY.

Design:
  - `encrypt_dict(d)` -> a single opaque string safe to store in Mongo.
  - `decrypt_dict(s)` -> back to the original dict.
  - Keys are never derived per-user (rotate the master key to invalidate all).
  - Access is still gated by JWT + userId scope at the API layer.

Rotation:
  Add a NEW key value to FIELD_ENCRYPTION_KEY (comma-separated list). First key
  is used to encrypt; every key is tried for decryption. Rotate + re-save.
"""
import json
import os
from cryptography.fernet import Fernet, MultiFernet, InvalidToken

_raw = (os.environ.get("FIELD_ENCRYPTION_KEY") or "").strip()

def _load() -> MultiFernet | None:
    if not _raw:
        return None
    keys = [k.strip() for k in _raw.split(",") if k.strip()]
    if not keys:
        return None
    return MultiFernet([Fernet(k.encode()) for k in keys])


_fernet: MultiFernet | None = _load()


def encryption_ready() -> bool:
    return _fernet is not None


def encrypt_dict(d: dict | None) -> str | None:
    if d is None:
        return None
    payload = json.dumps(d, separators=(",", ":"), sort_keys=True, default=str).encode()
    if _fernet is None:
        # If no key configured we still return the payload (base64-ish) so the app runs in dev;
        # NOT recommended for production. Prefix with 'plain:' so callers can detect.
        import base64
        return "plain:" + base64.b64encode(payload).decode()
    return _fernet.encrypt(payload).decode()


def decrypt_dict(s: str | None) -> dict | None:
    if not s:
        return None
    if s.startswith("plain:"):
        import base64
        try:
            return json.loads(base64.b64decode(s[len("plain:"):]).decode())
        except Exception:
            return None
    if _fernet is None:
        return None
    try:
        return json.loads(_fernet.decrypt(s.encode()).decode())
    except (InvalidToken, ValueError):
        return None


def generate_key() -> str:
    return Fernet.generate_key().decode()
