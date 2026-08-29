# Erosae.com — Backup and Disaster Recovery Runbook
## Plain-Language Store Owner Guide

### 1. What Happens If the Website Goes Down?
If the website stops responding:
1. Log into your **Hostinger Control Panel (hPanel)**.
2. Go to **Websites** &rarr; **erosae.com** &rarr; **Node.js** or **Process Manager**.
3. Click **Restart Application**.
4. The system will reboot in approximately 5–10 seconds and resume serving customers.

---

### 2. How Are Database Backups Taken?
- **Automatic Daily Backups**: Hostinger automatically takes full server snapshots daily.
- **Local Database Snapshots**: Run `bash scripts/backup-db.sh` or download the `prisma/dev.db` file from the Hostinger File Manager to your local computer once a week.
- **Retention**: Backups are kept for 30 days.

---

### 3. How to Restore the Store from a Backup?
If data is accidentally deleted or corrupted:
1. In Hostinger File Manager, open the `backups/` folder.
2. Find the latest backup file (e.g. `erosae_db_backup_20260829_120000.db`).
3. Copy and rename it to `prisma/dev.db`.
4. Click **Restart Application** in your Hostinger panel.
5. All your products, orders, and customer accounts will be restored immediately.
