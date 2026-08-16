# 📜 Requirements Specification — FereWari

## 1. Executive Summary & Actors
- **Product**: `FereWari` (Offline-first PWA for artisans and micro-manufacturers).
- **Actors**:
  - **Artisan / Producer (Primary User)**: Manages inventory, sets up recipes/BOM, logs sales, monitors customer ranking, backs up data, manages subscription.
  - **Customer (Passive Actor)**: End-buyer whose name, phone, and transactions are recorded.
  - **Local Storage / IndexedDB Engine (System Actor)**: Manages persistent offline data.
  - **Google Drive API (External System Actor)**: Optional client-side cloud backup destination.
  - **Mobile Money Gateway (External System Actor)**: Target provider for processing subscription fees (Wave / Orange Money).

---

## 2. System Capabilities & Functional Requirements

### 🏭 Module A: Raw Materials & Recipe Cost Management (BOM)
- **FR-A01 (Raw Materials Management)**:
  - The system shall allow the user to create, read, update, and delete raw materials (intrants).
  - Attributes: Name, Unit of measurement (`kg`, `g`, `L`, `ml`, `unité`, `paquet`, `sac`), Unit purchase cost (in FCFA), Current stock quantity.
  - Acceptance Criteria: Validates unit cost >= 0 and stock >= 0.
- **FR-A02 (Additional Manufacturing Costs)**:
  - The system shall support unit packaging costs (bouteilles, étiquettes, bouchons, cartons).
  - The system shall support allocatable transport/logistics costs per batch/unit.
  - The system shall support optional other manufacturing overheads (main d'œuvre, énergie, etc.).
- **FR-A03 (Recipe & Finished Product Formulation - BOM)**:
  - The system shall allow the user to compose a finished product by selecting multiple raw materials with designated quantities.
  - The system shall dynamically compute the **Unit Cost of Production (Coût de Revient Unitaire — CRU)**:
    $$\text{CRU} = \sum (\text{Ingredient Quantity} \times \text{Raw Material Unit Cost}) + \text{Packaging Cost} + \text{Transport Cost} + \text{Other Costs}$$
  - The system shall compute the Gross Margin (Marge Brute) and Margin Percentage based on the configured Selling Price:
    $$\text{Margin (FCFA)} = \text{Selling Price} - \text{CRU}$$
    $$\text{Margin \%} = \frac{\text{Selling Price} - \text{CRU}}{\text{Selling Price}} \times 100$$
- **FR-A04 (Cost Breakdown Visualizer)**:
  - The system shall visually highlight the dominant expense item in the finished product formulation (e.g., primary ingredient vs. packaging vs. transport).

---

### 👥 Module B: Express Sales & Customer Loyalty
- **FR-B01 (Express Sales POS)**:
  - The system shall provide an ultra-fast checkout/sale registration screen.
  - Inputs: Product selection, Quantity, Auto-calculated or customized Total Amount, Sale Date (defaults to today/now).
  - Quick customer attribution: Name and Phone number fields.
- **FR-B02 (Intelligent Customer Auto-Suggestion)**:
  - As the user types the customer name or phone number, the system shall provide instant auto-complete suggestions from existing customers in IndexedDB.
  - If a new customer is entered, the system shall automatically create the customer record.
- **FR-B03 (Customer Loyalty & Volume Ranking)**:
  - The system shall maintain an aggregated customer ledger: `totalSpent` (FCFA) and `ordersCount`.
  - Upon registering a sale, the system shall atomically update the customer's total spent and order count.
  - The system shall provide a dedicated Customer Loyalty Table sorted by total purchases and order frequency to assist in prioritizing order fulfillment and deliveries.

---

### 💳 Module C: Monetization, Lifecycle & Paywall Engine
- **FR-C01 (Trial Period Management)**:
  - On first app initialization, the system shall generate an `AppSettings` record with `trialStartDate = now()`, `subscriptionStatus = 'trial'`.
  - The trial period shall last exactly 15 calendar days from `trialStartDate`.
  - During the trial, full operational features are accessible without any disruption.
- **FR-C02 (Grace Period & Countdown Banner)**:
  - Between Day 16 and Day 25 (10-day grace window), `subscriptionStatus` becomes `'grace_period'`.
  - The system shall display a persistent, non-blocking top banner with a distinct soft red/coral background (`#E63946`):
    > *"Votre période d'essai est terminée. Il vous reste [X] jours (date limite : [Jour, ex. Mardi 24 Mars]) pour souscrire à 5 000 FCFA/mois. Passé ce délai, l'accès sera temporairement bloqué, mais TOUTES VOS DONNÉES SONT ET RESTERONT CONSERVÉES EN TOUTE SÉCURITÉ."*
  - A visual reminder modal/toast shall prompt the user every 2 days.
  - The banner includes a direct call-to-action button: `[ Payer maintenant - 5 000 FCFA ]`.
- **FR-C03 (Paywall & Data Preservation Reassurance)**:
  - When the 10-day grace period expires without subscription payment, `subscriptionStatus` transitions to `'expired'`.
  - The system shall lock operational routes (sales, recipes, inventory) and display an elegant, high-converting Paywall modal/screen.
  - The Paywall must explicitly reassure the user:
    > *"Toutes vos données (recettes, matières premières, clients, ventes) sont et resteront conservées en toute sécurité sur votre appareil."*
- **FR-C04 (Subscription Payment Simulation & Activation)**:
  - The system shall provide a payment modal offering mobile money options (Wave, Orange Money, Card).
  - Upon successful payment confirmation of 5 000 FCFA, `subscriptionStatus` changes to `'active'`, and `subscriptionExpiresAt` is extended by 30 days.
  - A Developer/Testing Switch shall allow toggling between Trial, Grace Period, Active, and Expired states for demonstration and testing.

---

### 💾 Module D: Offline-First Engine, JSON Backup & Google Drive Sync
- **FR-D01 (IndexedDB Master Store)**:
  - The system shall execute all CRUD operations against client-side IndexedDB via Dexie.js with zero network requests required.
- **FR-D02 (Structured JSON Backup & Export)**:
  - The system shall export a timestamped JSON file (`ferewari-backup-YYYY-MM-DD.json`) containing metadata (app version, export date, record counts) and full dumps of `rawMaterials`, `products`, `customers`, `sales`, and `settings`.
- **FR-D03 (JSON Backup Restore & Import)**:
  - The system shall allow selecting a `.json` backup file, validate its structure and schema, and restore the database cleanly with confirmation prompts.
- **FR-D04 (Google Drive OAuth2 Client-Side Backup)**:
  - The settings screen shall allow authenticating with Google Drive via client-side OAuth2 (Google Identity Services).
  - Actions: `[ Connecter Google Drive ]`, `[ Sauvegarder maintenant ]`, `[ Restaurer une sauvegarde ]`.
  - Automated non-intrusive reminder if `lastBackupDate` is older than 7 days or nonexistent.

---

## 3. Business Rules (BR)
- **BR-001 (CRU Non-Negativity)**: All unit costs and ingredient quantities must be $\ge 0$.
- **BR-002 (Automatic Sales Calculation)**: Default sale total is $\text{Quantity} \times \text{Product Selling Price}$, but can be manually overridden for special discounts.
- **BR-003 (Customer Cumulative Sync)**: Every registered sale increases the customer's `totalSpent` by `sale.totalAmount` and increments `ordersCount` by 1.
- **BR-004 (Subscription Price)**: Flat rate of 5 000 FCFA per 30-day renewal cycle.
- **BR-005 (Data Preservation Guarantee)**: Account expiration or paywall lock never deletes or modifies existing IndexedDB records.

---

## 4. Non-Functional Requirements (NFR)
- **NFR-01 (Performance)**: UI interactions and cost recalculations must render in < 50ms.
- **NFR-02 (PWA & Offline Capability)**: Full functionality offline via Service Worker, with Web App Manifest (`theme_color: #03045E`, `display: standalone`).
- **NFR-03 (Design & Aesthetics)**: Comply strictly with `brand-guidelines.md` (Navy `#03045E`, Primary `#023E8A`, Vibrants `#0077B6`/`#0096C7`, Cyan `#00B4D8`, Alert `#E63946`, Darker Grotesque display font, Google Sans Flex body font).
- **NFR-04 (Responsive & Touch-Optimized)**: Mobile-first ergonomic touch targets ($\ge 44\text{px}$), smooth bottom-sheet modals, floating action buttons, and tablet/desktop adaptability.
- **NFR-05 (Accessibility & Data Integrity)**: Keyboard navigation, high-contrast text ratios conforming to WCAG AA, safe IndexedDB transactions.

---

## 5. Requirements Gate Status
- **Status**: **PASS (READY)**
- **Next Phase**: `03 — technical-research`
- **Blockers**: None
