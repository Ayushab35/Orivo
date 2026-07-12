# Orivo Backend Migration Plan

## Goal

Migrate the current Python FastAPI backend to a Node.js + TypeScript backend using:

- Express
- Prisma with MongoDB
- Zod request validation
- JWT authentication
- Winston logging
- MVC-style controllers/services/repositories
- centralized error handling
- strict TypeScript settings

## Scope

1. Port all existing API endpoints under `/api`.
2. Preserve current business rules and cache semantics.
3. Use location-based choghadia caching by location key.
4. Maintain OTP auth, user onboarding, birth details, daily dashboard, reports, bookings, payments, notifications, advisor chat, decisions, and astro utilities.
5. Provide a modular service/repository layer for future maintainability.

## Architecture

- `src/index.ts` — server bootstrap
- `src/app.ts` — Express application setup
- `src/routes/*.ts` — route registration
- `src/controllers/*.ts` — request handler layer
- `src/services/*.ts` — business logic layer
- `src/repositories/*.ts` — database access layer using Prisma
- `src/prisma/client.ts` — Prisma client export
- `src/middleware/*.ts` — auth, validation, error handling
- `src/schemas/*.ts` — Zod schemas
- `src/utils/*.ts` — helpers, encryption, JWT, data normalization
- `src/config.ts` — environment configuration

## Migration Steps

1. Define Prisma schema based on existing Mongo collections.
2. Create base Express app with CORS, JSON parsing, and logging.
3. Implement global error handler and auth middleware.
4. Port helper modules from Python to TypeScript: astrology, choghadia, role fit, decision intelligence, report generation.
5. Implement API route handlers and service methods.
6. Add structured validation with Zod for incoming request payloads.
7. Add location-keyed `astro/choghadia` caching and fallback compute behavior.
8. Run existing backend tests against the new server to verify parity.

## Validation

- Preserve route signatures and responses.
- Ensure auth and `users/me` remain working.
- Validate dashboard caching and daily login bonus logic.
- Confirm `astro/choghadia` returns cached payload by location.
- Maintain or improve type safety.

## Notes

- This migration intentionally avoids mixing Python and Node logic.
- Prisma is used with MongoDB to mirror the current database structure.
- The migration is staged so the API surface remains stable while internal implementation upgrades.
