# 📋 Project Discovery — FereWari

## 1. Project Overview
- **Project Name**: `FereWari` (Respecting exact capitalization: uppercase 'F' and uppercase 'W').
- **Nature**: Progressive Web Application (PWA) 100% Client-Side & Offline-First.
- **Domain**: Artisanal Production, Agri-food Transformation, Small Manufacturing, Cost Management & Direct Sales.
- **Monetization**: Fixed subscription model at 5 000 FCFA / month with a 15-day free trial and a 10-day grace period with interactive reminders.
- **Storage & Backup**: Local-first master storage in browser IndexedDB via Dexie.js, with export/import JSON and optional client-side Google Drive sync.

---

## 2. Problem Statement
- **The Core Problem**: Local artisans, transformers, and small production unit managers (agri-food, cosmetics, craft manufacturing, confectioneries, micro-distilleries) struggle to accurately determine their unit cost of production (*Coût de Revient Unitaire — CRU*). They frequently underprice their products, neglect indirect costs (packaging, transport, overheads, labor), and manage sales with paper notebooks, leading to cash-flow leaks and customer tracking chaos.
- **Target Audience**: Micro-enterprises, agri-food processors, soap/cosmetics makers, artisan bakers/confectioners, local beverage producers, craft workshops.
- **Current Alternatives**:
  - Paper notebooks & registers: prone to data loss, calculation errors, zero real-time insights into margins.
  - Generic ERP/Accounting software (Excel, Odoo, QuickBooks): overly complex, require desktop/reliable internet, steep learning curve, expensive recurring fees in foreign currency.
- **Consequences of Not Solving**: Artisans sell at a loss without knowing it, run out of raw materials unexpectedly, lose customer relationship history, and experience business failure.

---

## 3. Target Users & Personas
### Primary Persona: Fatou — Agri-food Processor & Artisan Juice Maker
- **Role**: Founder and manager of a small fruit juice and dried fruit workshop.
- **Context**: Buys fruits (hibiscus, ginger, baobab, mango) at local markets, bottles them, labels them, and delivers to local shops and individuals.
- **Pain Points**:
  - Unstable raw material purchase prices.
  - Forgets to account for bottles, caps, labels, and delivery transport in unit cost.
  - Operates in areas with intermittent or costly mobile internet connectivity.
  - Needs fast recording of orders on her smartphone during sales.
- **Proficiency**: Familiar with WhatsApp, Wave, and Orange Money; desires an intuitive, app-like mobile experience with zero accounting jargon.

### Secondary Persona: Mamadou — Handcrafted Cosmetics & Soap Maker
- **Role**: Produces artisanal shea butter creams and herbal soaps.
- **Needs**: Precise recipe formulation (Bill of Materials), bulk ingredient cost allocation, tracking loyal wholesale customers, keeping historical records safely backed up without complex cloud infrastructure.

---

## 4. Core Value Proposition
1. **Effortless & Automated Cost Calculation (CRU)**: Instant aggregation of raw materials, packaging, logistics, and overheads to reveal true margins before setting sales prices.
2. **100% Offline-First Operational Resilience**: Zero latency, works anywhere without internet access; records transactions and formulas directly in the browser's IndexedDB.
3. **Frictionless Express Sales & Customer Loyalty**: Ultra-fast order entry (Product, Qty, Amount, Client Phone/Name) with immediate customer recognition and loyalty ranking.
4. **Data Sovereignty & Safe Backups**: Local master storage with 1-click JSON export/import and optional Google Drive backup without server-side database exposure.
5. **Fair & Accessible Monetization**: 15 days full trial, 10 days soft grace period, transparent pricing of 5 000 FCFA/month with mobile money readiness.

---

## 5. Primary Objective & Success Criteria
- **Primary Objective**: Provide an indispensable, robust, beautiful mobile-first PWA that empowers small producers to master their production costs and accelerate their daily sales without internet dependencies.
- **Success Criteria**:
  - Instant calculation of CRU and gross profit margins upon recipe configuration (< 50ms).
  - Sub-5-second completion time for recording an express sale.
  - 100% offline availability with zero data loss.
  - Flawless backup & restore cycle (JSON & Google Drive).
  - High user clarity regarding subscription lifecycle and data safety reassurance.

---

## 6. Project Scope
### In Scope (V1 MVP)
- **Module A: Cost & Recipe Management (BOM)**:
  - Raw materials inventory & unit costs.
  - Variable & fixed manufacturing costs (packaging, transport, other overheads).
  - Dynamic recipe formulation and automated CRU + margin breakdown calculation.
- **Module B: Express Sales & Customer Loyalty**:
  - Express sale POS interface with auto-completion from customer base.
  - Customer directory with cumulative purchase volume and loyalty ranking table.
- **Module C: Lifecycle, Monetization & Paywall**:
  - 15-day free trial engine.
  - 10-day non-blocking grace period with persistent alert banner & countdown.
  - Reassuring paywall interface post-grace period highlighting data safety.
  - Mobile Money payment simulation/integration stub (Wave, Orange Money) for 5 000 FCFA / month.
- **Module D: Local Data Engine & Google Drive Sync**:
  - IndexedDB implementation via `Dexie.js`.
  - Structured JSON export & import with schema validation.
  - Google Drive OAuth2 integration & 7-day backup reminder.
- **Brand & UI/UX Excellence**:
  - Darker Grotesque display typography + Google Sans Flex body.
  - Ocean-themed corporate palette (`#03045E`, `#023E8A`, `#0077B6`, etc.).
  - Ionic React mobile navigation + Tailwind CSS styling + micro-interactions.

### Out of Scope (V1)
- Multi-user team synchronization via centralized backend server (reserved for future NestJS + PostgreSQL V2).
- Native app store binary releases (PWA installable directly from browser).
- Complex double-entry general ledger accounting.

---

## 7. Assumptions & Constraints
### Assumptions
- [CONFIRMED] Users access the app via modern mobile and desktop browsers supporting IndexedDB and Service Workers.
- [CONFIRMED] The currency of reference is FCFA (XOF/XAF).
- [CONFIRMED] No centralized server backend in V1; all state is persisted locally.

### Constraints
- [CONFIRMED] Strictly TypeScript, React 18+, Vite, Ionic React, Tailwind CSS, Dexie.js.
- [CONFIRMED] Strict compliance with brand guidelines: Darker Grotesque, Google Sans Flex, `#03045E` dominant palette.
- [CONFIRMED] Exact naming: `FereWari`.

---

## 8. Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Browser cache / storage eviction | Low | High | Use `navigator.storage.persist()`, structured JSON export, and automated backup reminders. |
| Inaccurate cost estimates by user | Medium | Medium | Provide visual cost component breakdowns and recipe margin previews. |
| User anxiety about paywall data loss | Medium | High | Display prominent reassurance messages stating that all data is permanently and safely kept in local storage. |

---

## 9. Discovery Status & Gate
- **Status**: **PASS (READY)**
- **Next Phase**: `02 — requirements-engineering`
- **Blockers**: None
