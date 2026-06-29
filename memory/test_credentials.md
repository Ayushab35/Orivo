# Orivo Test Credentials

## Phone OTP (Dev mode)
- **Phone**: any phone number (e.g. `+15551234567`, `+19998887777`)
- **OTP code**: `123456` (works for every phone)
- Dev bypass enabled via `DEV_OTP_BYPASS=true` in `/app/backend/.env`. Twilio integration is stubbed; switch by setting `DEV_OTP_BYPASS=false` and providing TWILIO_* env vars later.

## Stripe
- Test mode key already in env: `STRIPE_API_KEY=sk_test_emergent` (managed via emergentintegrations).
- On checkout, use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

## Pre-seeded data for an onboarded test user
Calling `POST /api/auth/birth-details` with the verified token sets the user up. Example payload:
```json
{
  "name": "Test Founder",
  "role": "Founder / CEO",
  "businessName": "Acme Capital",
  "industry": "Technology",
  "birthDate": "1985-04-12",
  "birthTime": "07:42",
  "birthPlace": "Mumbai, Maharashtra, India",
  "birthLat": 19.07,
  "birthLng": 72.87
}
```
