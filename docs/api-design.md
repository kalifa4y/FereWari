# 🔌 API & Data Contracts Design — FereWari

## 1. Scope & Client-Side Service Architecture
Since FereWari V1 is a 100% client-side PWA without an intermediary custom backend, the "API" comprises:
1. **Internal Domain Service Contracts** (TypeScript service interfaces).
2. **Backup Interchange Format** (JSON schema for import/export).
3. **External Cloud Integration Contracts** (Google Drive REST API v3 and OAuth2).

---

## 2. Internal Domain Service Contracts

### 2.1 Calculation Service (`calculationService.ts`)
```typescript
export interface CalculationBreakdown {
  rawMaterialsCost: number;
  packagingCost: number;
  transportCost: number;
  otherCosts: number;
  totalUnitCost: number; // CRU
  sellingPrice: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
  dominantCostItem: {
    name: string;
    cost: number;
    percentage: number;
  };
}

export function calculateProductCRU(
  product: Pick<Product, 'packagingCost' | 'transportCost' | 'otherCosts' | 'ingredients' | 'sellingPrice'>,
  rawMaterialsMap: Map<number, RawMaterial>
): CalculationBreakdown;
```

### 2.2 Subscription Service (`subscriptionService.ts`)
```typescript
export interface SubscriptionStatusInfo {
  status: 'trial' | 'grace_period' | 'active' | 'expired';
  daysRemainingInTrial?: number;
  daysRemainingInGrace?: number;
  graceDeadlineDate?: string;
  isLocked: boolean;
  showGraceBanner: boolean;
  shouldShowReminderModal: boolean;
}

export function evaluateSubscriptionStatus(settings: AppSettings): SubscriptionStatusInfo;
export function activateSubscription(months?: number): Promise<void>;
export function simulateSubscriptionState(status: 'trial' | 'grace_period' | 'active' | 'expired'): Promise<void>;
```

### 2.3 Backup Service (`backupService.ts`)
```typescript
export interface FereWariBackupPayload {
  app: 'FereWari';
  version: string;
  exportedAt: string;
  metadata: {
    rawMaterialsCount: number;
    productsCount: number;
    customersCount: number;
    salesCount: number;
  };
  data: {
    rawMaterials: RawMaterial[];
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    settings: AppSettings[];
  };
}

export function exportBackupJSON(): Promise<Blob>;
export function importBackupJSON(file: File): Promise<{ success: boolean; message: string; recordCounts?: Record<string, number> }>;
```

---

## 3. External API Contracts: Google Drive REST API v3

### 3.1 OAuth2 Scope
- **Scope**: `https://www.googleapis.com/auth/drive.file` (Per-file access created by the app, privacy-preserving).

### 3.2 Upload Backup Endpoint
- **Method**: `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/related; boundary=foo_bar_baz`
- **Body**:
  - Metadata Part (`application/json`): `{ "name": "ferewari-backup-2026-08-15.json", "mimeType": "application/json" }`
  - Data Part (`application/json`): Serialized `FereWariBackupPayload`

---

## 4. API Design Gate Status
- **Status**: **PASS (READY)**
- **Next Phase**: `09 — ui-ux-design`
- **Blockers**: None
