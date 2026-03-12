# Launch Readiness Checklist

This checklist is intentionally simple so it stays usable for a solo launch.

## Production Configuration

- All required environment variables are documented.
- No production secrets are committed to git.
- Frontend uses the correct production API base URL.
- Backend startup fails fast if a required secret or URI is missing.

## Data Safety

- Nightly database backup is configured.
- Offsite backup copy is configured.
- Uploaded files are included in backup scope.
- One restore drill has been completed successfully.

## Trust and Operations

- Audit logging is enabled for edit, delete, cancel, refund, and stock adjustment flows.
- Role-based access is verified for owner, manager, cashier, waiter, kitchen staff, and accountant.
- Health endpoint is available for basic uptime checks.
- Readiness endpoint checks database connectivity before traffic is considered healthy.

## Billing and POS

- Checkout cannot be submitted twice from the UI.
- Refunds require permission and create audit entries.
- Shift close totals match real payment records.
- Billing screen error states are readable by staff.

## Reporting and Dashboard

- Dashboard loads summary data without needing full transaction history.
- Daily reports open reliably for recent date ranges.
- Low-stock report shows actionable names and quantities.

## Logging

- Request logs include route, status code, and duration.
- Error logs include stack traces in production logs.
- Sensitive fields are redacted from logs.
- Logs are easy to access during an incident.

## Deployment Safety

- There is a rollback path to the last known good build.
- The deployment process is written down step-by-step.
- Graceful shutdown is enabled so in-flight requests are not cut off abruptly.
- A maintainer knows how to restart backend and frontend services.

## Smoke Test Before Launch

1. Login with owner account.
2. Create one sale.
3. Take one payment.
4. Print or preview one bill.
5. Run one refund test if enabled in staging.
6. Adjust stock for one item.
7. Open dashboard.
8. Open reports.
9. Close cashier shift.
10. Confirm the latest backup exists.

## Next Code Steps

1. Add backend environment validation.
2. Add structured production logging.
3. Add `healthz` and `readyz` endpoints.
4. Fix the known billing-screen reliability issue before release.
