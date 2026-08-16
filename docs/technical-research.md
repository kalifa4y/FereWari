# 🔬 Technical Research Report — FereWari

## 1. Technical Landscape & Architecture Evaluation

### 1.1 Frontend Framework & Build Tooling
- **Selection**: `Vite` + `React 18+` + `TypeScript`.
- **Rationale**:
  - Blazing fast HMR and sub-second builds.
  - Native ESM support and minimal overhead for PWA packaging.
  - Zero requirement for server-side runtimes (Next.js/Django strictly excluded per specification).
- **PWA Architecture**:
  - `vite-plugin-pwa` utilizing Workbox.
  - Service Worker configuration: `registerType: 'autoUpdate'`, with `CacheFirst` strategy for static assets, Google fonts, and icons.
  - Web App Manifest configured with `theme_color: "#03045E"`, `background_color: "#F8FCFE"`, `display: "standalone"`, and mobile orientation adaptability.

---

### 1.2 UI & Component Hierarchy
- **Mobile Foundation**: `@ionic/react` + `@ionic/react-router` + `react-router-dom` (v5/v6 standard for Ionic compatibility) for native mobile transitions, page transitions, gestures, and bottom tabs.
- **Styling Engine**: `Tailwind CSS` with customized color tokens and typography configured in `tailwind.config.js`:
  - Font families: `Darker Grotesque` (Display / Titles) and `Google Sans Flex` (Body / UI with fallback to `Product Sans`, `Inter`, `sans-serif`).
  - Colors: Full brand ocean palette (`#03045E`, `#023E8A`, `#0077B6`, `#0096C7`, `#00B4D8`, `#48CAE4`, `#90E0EF`, `#ADE8F4`, `#CAF0F8`, `#F8FCFE`, `#E63946`, `#D90429`).
- **Interaction & Animation Layer**: `framer-motion` for micro-interactions, smooth recipe builders, animated stat counters, and modal transitions.
- **Icons**: `lucide-react` and `ionicons` for crisp vector iconography.

---

### 1.3 Offline-First Storage: Dexie.js (IndexedDB)
- **Selection**: `dexie` (v4) & `dexie-react-hooks`.
- **Rationale**:
  - Wrapper around standard IndexedDB with zero performance bottleneck.
  - `useLiveQuery` allows declarative real-time UI updates whenever database records change.
  - Rich query API for indexing, sorting by `updatedAt`, `totalSpent`, `calculatedUnitCost`, etc.
  - Full transactional ACID safety for multi-table updates (e.g., creating a Sale + updating Customer `totalSpent` & `ordersCount`).
- **Database Schema**:
  - `rawMaterials`: `++id, name, updatedAt`
  - `products`: `++id, name, calculatedUnitCost, updatedAt`
  - `customers`: `++id, name, phone, totalSpent, ordersCount`
  - `sales`: `++id, productId, customerId, saleDate`
  - `settings`: `id`

---

### 1.4 Backup, Export/Import & Google Drive Integration
- **Local Master JSON Backup**:
  - Export: Serializes all 5 tables + metadata (`version: "1.0.0"`, `exportedAt: ISOString`, `checksum`) into a formatted JSON Blob and triggers automated browser download (`ferewari-backup-YYYY-MM-DD.json`).
  - Import: Reads file via `FileReader`, validates JSON schema, verifies table arrays, and replaces/merges tables in a single `db.transaction('rw', ...)` block.
- **Google Drive Client-Side Sync**:
  - Uses Google Identity Services (`google.accounts.oauth2`) client-side implicit/auth-code flow.
  - Google Drive REST API v3 endpoint: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` for uploading the JSON payload directly to the user's Drive folder or AppData folder.
  - Resilient Fallback: When offline or if Google API Client ID is not yet provisioned in environment variables, the system displays an intuitive UI with status badges and simulated cloud backup capability for demonstrations, seamlessly handling online/offline states.

---

### 1.5 Monetization & Subscription State Machine
- **State Definition**:
  - `trial`: Days 1 to 15 (Full access, no restrictions).
  - `grace_period`: Days 16 to 25 (Full access, persistent `#E63946` alert banner with real-time day countdown and 2-day reminder toasts).
  - `expired`: Day 26+ without payment (Access to operational features blocked, reassuring paywall modal active).
  - `active`: Valid paid subscription (Full access, expiration date set 30 days ahead).
- **Pricing**: 5 000 FCFA / month.
- **Payment Interface**: Multi-channel mobile money modal (Wave, Orange Money, Credit Card) with simulated validation flow and direct instant account renewal.
- **Dev/Demo Switch**: In-app debug toolbar to instantaneously simulate trial, grace period, expired, and active states for testing and client demonstrations.

---

## 2. Technical Risk Analysis & Mitigations
| Technical Area | Risk | Mitigation |
| :--- | :--- | :--- |
| **IndexedDB Quota & Eviction** | Browser may purge storage on low disk space | Call `navigator.storage.persist()`, provide persistent backup prompt if last backup > 7 days. |
| **PWA Cache Invalidation** | Users running outdated app code | Configure `vite-plugin-pwa` with automatic service worker registration and update notification banner. |
| **Performance on Low-End Mobile** | Animation jank or sluggish live queries | Use lightweight CSS transitions and optimized Dexie indexed queries with virtualization where appropriate. |
| **Google Drive CORS & OAuth** | Token expiration or offline sync failure | Gracefully catch network errors, notify user, and ensure offline operations remain 100% unimpeded. |

---

## 3. Technical Research Gate Status
- **Status**: **PASS (READY)**
- **Next Phase**: `04 — repository-research`
- **Blockers**: None
