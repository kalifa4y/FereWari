# 📊 Monitoring & Maintenance Guide — FereWari

## 1. Operational Architecture & Observability
FereWari operates as a decentralized, client-side PWA:
- **Client Observability**:
  - Unhandled promise and runtime error tracking (can be integrated with Sentry or Firebase Crashlytics if desired in V2).
  - Storage Quota monitoring via `navigator.storage.estimate()` to prevent device storage overflow.
- **Service Worker Lifecycle**:
  - Periodic update check using `workbox-window` / `vite-plugin-pwa` `registerType: 'autoUpdate'`.
  - Stale cache eviction for old script hashes upon new releases.

---

## 2. Backup & Disaster Recovery Runbook
1. **Routine Backup Cadence**:
   - The application automatically flags a warning banner if no backup has occurred in the past 7 days.
   - Recommended procedure: 1-click JSON export at the end of each business week, saved to local storage or shared via WhatsApp/email.
2. **Disaster Recovery Steps**:
   - In the event of device damage, loss, or browser cache clearing:
     1. Open FereWari on the new device/browser.
     2. Navigate to **Réglages** $\rightarrow$ **Restaurer un fichier JSON**.
     3. Select the latest `ferewari-backup-YYYY-MM-DD.json`.
     4. Confirm the restore. All recipes, materials, customers, and sales are restored atomically into IndexedDB.

---

## 3. Maintenance & Dependency Update Cycles
- Run security audits monthly:
  ```bash
  npm audit
  ```
- Dependency updates:
  ```bash
  npm update
  ```
- Regression verification:
  ```bash
  npx tsx src/tests/runner.ts
  npm run build
  ```

---

## 4. Monitoring & Maintenance Gate Status
- **Status**: **PASS (OPERATIONS READY)**
