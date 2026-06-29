# Orivo Test Credentials

## Phone OTP (Dev mode)
- **Phone**: any phone number (e.g. `+15551234567`, `+19998887777`)
- **OTP code**: `123456` (works for every phone)
- Dev bypass enabled via `DEV_OTP_BYPASS=true` in `/app/backend/.env`.

## Stripe
- Test key in env: `STRIPE_API_KEY=sk_test_emergent` (managed via emergentintegrations).

## Sample onboarded payload (for `POST /api/auth/birth-details`)
```json
{
  "name": "Ayush Sharma",
  "role": "Founder / CEO",
  "businessName": "Lumen Capital",
  "industry": "Technology",
  "birthDate": "1985-04-12",
  "birthTime": "07:42",
  "birthPlace": "Mumbai, Maharashtra, India",
  "birthLat": 19.07,
  "birthLng": 72.87
}
```

## Pre-seeded test user (already onboarded after earlier sessions)
- Phone: `+19998887777`, code `123456`
- Name: Test Founder
- Onboarded with sample birth details.
