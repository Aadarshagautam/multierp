# Operations Runbook

## Environment model

- `local`: developer machine
- `staging`: pre-release validation with production-like config
- `production`: paying customers only

Never test risky migrations or seed scripts directly in production.

## Monitoring baseline

- Track API error rate and latency.
- Track frontend crashes and failed page loads.
- Alert on backup failures, auth spikes, and repeated 5xx responses.
- Alert on sustained 429 spikes for login and password reset routes.
- Check `/health` for liveness and `/ready` for database readiness in every environment.
- Preserve `X-Request-Id` in logs and support tickets so backend and browser events can be correlated.

## Incident priorities

- `P1`: login outage, invoice corruption, tenant data leak, failed checkout
- `P2`: email delivery issues, reports broken, branch setup failure
- `P3`: cosmetic bugs, slow admin pages, stale dashboards

## First response

1. Confirm scope: one tenant, one branch, or all tenants.
2. Check deploy history and recent environment changes.
3. Review logs for auth, invoice, or org context failures.
4. Roll back only if the latest release caused the issue and data integrity is at risk.
5. Document the incident timeline and affected tenants.

## Nepal-first support checks

- Confirm NPR formatting is still correct.
- Confirm PAN or VAT fields still appear in the right flows.
- Confirm eSewa and Khalti labels still match the customer-facing UI.
- Confirm branch addresses and phone defaults still fit Nepal usage.
- Confirm browser runtime errors are reaching the backend monitoring endpoint.
