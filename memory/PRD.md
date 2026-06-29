# Orivo — Product Requirements & Build Log

## Vision
Premium, private, decision-support mobile app (iOS / Android / Web preview) giving CXOs and business founders Vedic-astrology-based insight into leadership style, timing, and business decisions — positioned as a discreet executive tool, not a consumer horoscope app.

## Stack (as built — MVP iter 1, Jun 29 2026)
- **Mobile/Web**: Expo (React Native) + Expo Router + Expo Web (port 3000)
- **Backend**: FastAPI (Python) on port 8001 — switched from Node because Stripe + Emergent LLM key flow through Python-only `emergentintegrations`
- **DB**: MongoDB (motor)
- **Auth**: Phone OTP, JWT. Dev-mode OTP bypass (`123456`); Twilio Verify stubbed for later
- **Payments**: Stripe Checkout via `emergentintegrations`
- **LLM**: Claude Sonnet 4.5 via Emergent Universal Key for personalized report content
- **Geocoding**: OpenStreetMap Nominatim (free)
- **Astrology engine**: deterministic rule-engine seeded by DOB + time + place (offline)

## User personas
1. **The Founder** — late 30s–50s, time-poor, privacy-first, skeptical of "mystical" branding.
2. **The C-suite executive** — sees this as a private decision-support tool, not entertainment.

## Core data models (MongoDB)
- `users` — phone, name, role, businessName, industry, birth {date,time,placeName,lat,lng}, tier, referralCode, onboarded
- `reports` — userId × moduleKey unique. content JSON, version.
- `daily_outlooks` — userId × date unique. favorable[], caution[]
- `credits_ledger` — userId, deltaSec, reason, expiresAt, createdAt (balance is in seconds; 1800s = 30 min; expiry 90 days)
- `task_completions` — scopeKey idempotency for daily/weekly/once tasks
- `bookings` — packageId, slotStart, slotEnd, paymentMode, status
- `payment_transactions` — Stripe session ledger (mandatory)
- `notifications` — userId feed
- `otp_sessions`

## Build phases (status)
**Phase A — Foundation & Auth** ✅
- Splash, Onboarding carousel (3 cards), Phone OTP login, OTP verify, Birth & Business details (2-step) with Nominatim city autocomplete.

**Phase B — Core Hub** ✅
- Home dashboard (greeting, credit pill, tier badge, favorable banner, notification bell, 8 shortcuts)
- Today's Outlook (favorable + caution windows, "Add to calendar" ICS export)

**Phase C — Insight Reports** ✅ (shared `<ReportCard/>` template)
- Personality (+ 5-question quiz with axis score)
- Strengths & Improvement
- Career-defining trait
- Public Image
- Financial Patterns (revenue + expense tendencies — no numbers)
- Numerology hub (life path, birth number, lucky color, lucky dates, Loshu grid)

**Phase D — Gamification & Booking** ✅
- Credits & Tasks (daily/weekly tasks, progress bar, ledger history)
- Choose-a-package (toggle: pay vs credits — both always available)
- Booking calendar (7-day picker, favorable hours highlighted)
- Payment screen (Stripe Checkout) + polling success screen

**Phase E — Account** ✅
- Profile & Settings (dark mode toggle, referral code share)
- Notifications center

## What's been implemented (Jun 29, 2026 — MVP iter 1)
- 18 screens, shared report template, theme (light + dark) using exact spec palette
- All 9 collections, ~25 API endpoints under `/api/*`
- Dev-mode OTP bypass; JWT sessions
- LLM-generated personalized reports with fallback content
- Stripe Checkout (test key) with secure server-side pricing + polling status + transactions ledger
- Disclaimer line ("For self-reflection and decision support — not a guarantee of outcomes.") on every report and prediction screen
- ICS calendar export for slots on web

## Backlog / Next
- **P1** Twilio Verify in place of dev OTP bypass (needs TWILIO_ACCOUNT_SID, AUTH_TOKEN, VERIFY_SERVICE_SID)
- **P1** Emergent Google login as optional second auth method
- **P2** Persist personality-quiz result onto the personality report card automatically
- **P2** Booking confirmation emails (SendGrid) + reminder cron
- **P2** Real Vedic ephemeris via swisseph-wasm (richer accuracy beyond MVP heuristics)
- **P2** Razorpay alternative payment rail for INR markets
- **P3** Native push notifications via Expo Push
- **P3** Referral ledger redemption flow
