# Sell-Ready Release Checklist

## Before every release

- Run `npm run smoke` from the repo root.
- Confirm the frontend build points to the correct production API URL.
- Confirm MongoDB backups completed successfully in the last 24 hours.
- Confirm `JWT_SECRET`, mail credentials, and Upstash credentials are set in production.
- Confirm `/health` and `/ready` return healthy responses in the target environment.
- Confirm staging passed the same build and smoke checks before promoting.

## Must-pass business checks

- Register a new Nepal-first workspace and verify the first branch is created.
- Sign in with mixed-case email and confirm the account still authenticates.
- Request a password reset twice and confirm the response never reveals whether the email exists.
- Open a shift, complete a sale, and confirm invoice numbering remains scoped and unique.
- Try POS checkout without an open shift and confirm it is rejected.
- Redeem more loyalty points than the customer owns and confirm the API rejects it.

## Must-pass support checks

- Confirm error tracking is receiving backend and frontend exceptions.
- Confirm structured request logs include `requestId`, `orgId`, and `userId` where applicable.
- Confirm audit logs are visible for org settings and role changes.
- Confirm support can export customer and invoice data for one tenant without touching others.

## Release gates

- Do not release if backups are failing.
- Do not release if smoke tests fail.
- Do not release if tenant isolation or payment totals changed without fresh regression coverage.
