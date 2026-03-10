# Backup And Restore Runbook

## Backup policy

- Keep automated MongoDB backups at least daily.
- Keep point-in-time recovery if your database provider supports it.
- Retain short-term daily backups and longer-term weekly backups.
- Store backups outside the main app host or workspace.

## Restore drill

1. Restore the latest backup into a staging database.
2. Point staging to the restored database.
3. Confirm sign-in works for at least one tenant.
4. Confirm invoices, customers, branches, and POS sales are present.
5. Record restore duration and any manual fixes needed.

## Production restore steps

1. Freeze writes by taking the app into maintenance mode.
2. Identify the restore point and document the expected data-loss window.
3. Restore into a fresh database target first.
4. Validate tenant counts, latest invoices, and current shifts.
5. Switch production to the restored database.
6. Re-run smoke checks and one manual sale or invoice flow.

## Minimum verification after restore

- Owner login works.
- Current org and branch load correctly.
- Invoice sequence generation still advances correctly.
- POS checkout still requires an open shift.
- Recent customers and loyalty balances are intact.
