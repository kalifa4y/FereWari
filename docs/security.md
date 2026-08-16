# 🛡️ Security Review Report — FereWari

## 1. Threat Model & Trust Boundaries

### 1.1 Protected Assets
- **Business IP**: Proprietary artisan recipe formulas, ingredient ratios, and manufacturing unit costs (CRU).
- **Customer Privacy**: Customer names, telephone numbers (WhatsApp), and transaction histories.
- **Data Integrity**: Financial totals, stock quantities, and subscription status state.

### 1.2 Trust Boundaries
- **Origin Sandbox**: Browser IndexedDB storage isolated under the application origin.
- **External Integration Sandbox**: Google Identity Services OAuth2 token boundary (limited to `drive.file` scope).
- **Backup File Ingestion**: Untrusted user-provided JSON files during restore operations.

---

## 2. Attack Surface & Threat Analysis

| Threat / Vector | Risk Level | Mitigation & Implementation |
| :--- | :--- | :--- |
| **Malicious JSON Injection on Restore** | Medium | `restoreBackupFromFile` validates the schema header (`app === 'FereWari'`), parses data arrays explicitly, sanitizes dates, and runs inside an atomic Dexie transaction. |
| **XSS (Cross-Site Scripting)** | Low | React JSX default HTML escaping is used throughout. Zero instances of `dangerouslySetInnerHTML` or `eval()`. |
| **OAuth Scope Overreach** | Low | Google Drive OAuth2 integration requests strictly `drive.file`, preventing any access to user files created outside FereWari. |
| **Payment Credential Interception** | Low | Zero credit card numbers or PINs are stored locally. Mobile money transactions rely on phone number prompt verification. |
| **Data Eviction / Accidental Loss** | Medium | User is actively guided with persistent backup reminders (> 7 days) and 1-click JSON export. |

---

## 3. Dependency Audit
- Ran `npm audit`: **0 vulnerabilities found**.

---

## 4. Security Gate Status
- **Status**: **PASS**
- **Next Phase**: `14 — deployment`
- **Blockers**: None
