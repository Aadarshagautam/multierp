# Backup and Restore

This project should launch with a simple backup plan that a solo developer can actually maintain.

## Goals

- Keep business data safe with low monthly cost.
- Make restore steps clear enough to follow under pressure.
- Prefer boring, repeatable tools over complex automation.

## What Must Be Backed Up

- Primary database
- Uploaded files or receipts if stored on disk
- Environment secrets stored outside the repository

## Backup Strategy

### Database

- Run one full backup every night during low-traffic hours.
- Keep the backup compressed.
- Store one local copy and one offsite copy.
- Retention target:
  - 7 daily backups
  - 4 weekly backups
  - 3 monthly backups

### Uploaded Files

- If invoices, KOT slips, or other generated files are stored on disk, copy the upload directory once per day.
- Keep uploads and database backups timestamped together so a restore can be matched.

### Secret Storage

- Do not rely on `.env` files on the server as the only copy of secrets.
- Keep production secrets in an encrypted password manager or secret vault.
- Record the date each secret was last rotated.

## Low-Cost Implementation

- Database: native dump tool from your database provider or `mongodump` on a small schedule
- Offsite storage: low-cost object storage or encrypted cloud drive
- Scheduling: Windows Task Scheduler, cron, or the hosting platform scheduler

## Daily Backup Check

- Confirm the scheduled job ran.
- Confirm the newest backup file exists and is non-empty.
- Confirm the offsite copy finished.
- Confirm available disk space is still healthy.

## Weekly Verification

- Restore the latest backup into a temporary database.
- Verify that the following counts look correct:
  - users
  - customers
  - products
  - sales
  - payments
  - stock movements
- Open the app against the temporary restore and confirm login works.

## Restore Checklist

1. Pause incoming writes if possible.
2. Record the current incident time and symptoms.
3. Pick the most recent known-good backup.
4. Restore into a temporary database first.
5. Validate basic counts and recent records.
6. Restore uploaded files that match the backup timestamp.
7. Repoint the app only after validation passes.
8. Smoke test:
   - login
   - billing
   - shift close
   - reports
   - stock updates
9. Resume traffic.
10. Write a short post-incident note with the cause and next fix.

## Recovery Priorities

1. Get read access back for owners and managers.
2. Restore billing and payment capture.
3. Verify stock consistency.
4. Re-enable reports after transactional flows are stable.

## Recommended First Automation

- Nightly database dump
- Offsite copy of the latest dump
- Weekly restore test reminder
- Monthly secret review reminder
