# 🔍 Repository Research Report — FereWari

## 1. Codebase & Directory Structure Analysis
- **Current State**: Greenfield project initialization in `c:/Users/legion/Desktop/FereW`.
- **Existing Files & Documentation**:
  - `docs/project-discovery.md` (Validated)
  - `docs/requirements.md` (Validated)
  - `docs/technical-research.md` (Validated)
- **Target Repository Structure**:
```text
FereW/
├── docs/                      # Architectural & requirements documentation
│   ├── project-discovery.md
│   ├── requirements.md
│   ├── technical-research.md
│   ├── repository-research.md
│   ├── system-architecture.md
│   ├── database-design.md
│   ├── api-design.md
│   ├── ui-ux-design.md
│   └── frontend-architecture.md
├── public/                    # PWA assets, icons, manifest
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── apple-touch-icon.png
├── src/
│   ├── assets/                # Logos, illustrations
│   ├── components/            # Reusable UI & presentation components
│   │   ├── common/            # Buttons, Badges, Modals, StatCards, Banners
│   │   ├── layout/            # AppHeader, BottomNav, PageContainer
│   │   ├── recipes/           # BOM builder, IngredientRow, CostBreakdownChart
│   │   ├── sales/             # ExpressSaleForm, SaleReceiptModal
│   │   ├── customers/         # CustomerRankingTable, CustomerDetailModal
│   │   ├── subscription/      # PaywallModal, GracePeriodBanner, PaymentModal
│   │   └── backup/            # BackupManager, DriveSyncCard, RestoreModal
│   ├── db/                    # Dexie.js database & schema definition
│   │   ├── db.ts              # Core Dexie Database instance & interfaces
│   │   ├── seed.ts            # Artisanal demo data (Juices, Soaps, Raw Materials)
│   │   └── migrations.ts      # Schema evolution helpers
│   ├── hooks/                 # Custom React hooks (useSubscription, useLiveQuery helpers)
│   ├── services/              # Business logic services
│   │   ├── calculationService.ts # CRU, Gross Margin, and BOM math
│   │   ├── backupService.ts      # JSON export/import & validation
│   │   ├── driveService.ts       # Google Drive client-side REST sync
│   │   └── subscriptionService.ts# Trial, Grace, and Paywall state logic
│   ├── pages/                 # Main Ionic / React application screens
│   │   ├── DashboardPage.tsx     # KPI metrics, quick actions, recent sales
│   │   ├── RawMaterialsPage.tsx  # Intrants inventory & costs
│   │   ├── RecipesPage.tsx       # Products, BOM recipes, CRU calculations
│   │   ├── SalesPage.tsx         # Express sale entry & transaction log
│   │   ├── CustomersPage.tsx     # Loyalty ranking & client history
│   │   └── SettingsPage.tsx      # Google Drive backup, JSON import/export, subscription status
│   ├── styles/                # Global CSS & Tailwind layers
│   │   └── index.css
│   ├── App.tsx                # App entry point, Ionic setup & global providers
│   ├── main.tsx               # DOM root mounting
│   └── brand-guidelines.md    # Brand identity & design tokens reference
├── index.html                 # HTML entry point with Google Fonts
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind theme & color extensions
├── tsconfig.json              # TypeScript compilation config
├── vite.config.ts             # Vite & PWA plugin config
└── README.md                  # Project overview & startup instructions
```

---

## 2. Environment & Dependency Audit
- **Operating System**: Windows (PowerShell shell environment).
- **Node & Package Management**: Standard Node.js / `npm` or `npx`.
- **Target Dependencies**:
  - `react`, `react-dom`
  - `@ionic/react`, `@ionic/react-router`, `react-router-dom@^5.3.4` (or v6 with Ionic support)
  - `dexie`, `dexie-react-hooks`
  - `lucide-react`, `ionicons`
  - `framer-motion`
  - `clsx`, `tailwind-merge`
  - `canvas-confetti` (for celebration micro-interactions on sales & subscription unlock)
- **Dev Dependencies**:
  - `vite`, `@vitejs/plugin-react`
  - `vite-plugin-pwa`
  - `tailwindcss`, `postcss`, `autoprefixer`
  - `typescript`, `@types/react`, `@types/react-dom`, `@types/node`

---

## 3. Repository Research Gate Status
- **Status**: **PASS (READY)**
- **Next Phase**: `05 — task-planning`
- **Blockers**: None
