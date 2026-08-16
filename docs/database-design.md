# 🗄️ Database Design — FereWari (IndexedDB / Dexie.js)

## 1. Database Architecture & Stores
- **Database Name**: `FereWariDB`
- **Engine**: IndexedDB via `Dexie.js` v4
- **Version**: 1

---

## 2. Table Specifications & Indexes

### 2.1 Table: `rawMaterials`
Stores inventory and unit purchase costs for all raw ingredients / intrants.
- **Indexed Fields**: `++id, name, updatedAt`
- **Schema**:
```typescript
export interface RawMaterial {
  id?: number;              // Auto-increment primary key
  name: string;             // Name of material (e.g. "Fleurs d'Hibiscus séchées")
  unit: string;             // Unit of measure: "kg", "g", "L", "ml", "unité", "sac"
  unitCost: number;         // Purchase cost per unit in FCFA (e.g. 1500 FCFA/kg)
  stockQty: number;         // Current stock on hand
  updatedAt: Date;          // Last modification timestamp
}
```

### 2.2 Table: `products`
Stores finished products with their Bill of Materials (BOM) composition and overhead costs.
- **Indexed Fields**: `++id, name, calculatedUnitCost, updatedAt`
- **Schema**:
```typescript
export interface RecipeItem {
  rawMaterialId: number;    // Reference to rawMaterials.id
  quantity: number;         // Quantity consumed per finished unit
}

export interface Product {
  id?: number;              // Auto-increment primary key
  name: string;             // Name of finished product (e.g. "Jus de Bissap 33cl")
  sellingPrice: number;     // Target selling price in FCFA
  packagingCost: number;    // Packaging cost per unit (bottle, cap, label)
  transportCost: number;    // Allocated logistics/transport cost per unit
  otherCosts: number;       // Direct labor or manufacturing overheads
  ingredients: RecipeItem[];// Array of raw material recipe items
  calculatedUnitCost: number; // Stored CRU (Coût de Revient Unitaire)
  updatedAt: Date;          // Last modification timestamp
}
```

### 2.3 Table: `customers`
Stores customer directory and aggregated loyalty metrics.
- **Indexed Fields**: `++id, name, phone, totalSpent, ordersCount`
- **Schema**:
```typescript
export interface Customer {
  id?: number;              // Auto-increment primary key
  name: string;             // Customer full name or business name
  phone: string;            // Contact phone number (e.g. "+221 77 000 00 00")
  totalSpent: number;       // Cumulative purchase volume in FCFA
  ordersCount: number;      // Total number of completed orders
  updatedAt: Date;          // Last transaction / modification timestamp
}
```

### 2.4 Table: `sales`
Transaction log for all completed orders.
- **Indexed Fields**: `++id, productId, customerId, saleDate`
- **Schema**:
```typescript
export interface Sale {
  id?: number;              // Auto-increment primary key
  productId: number;        // Reference to products.id
  quantity: number;         // Quantity sold
  totalAmount: number;      // Final sale total in FCFA
  customerId?: number;      // Optional reference to customers.id
  customerName?: string;    // Snapshot of customer name at sale time
  customerPhone?: string;   // Snapshot of customer phone at sale time
  saleDate: Date;           // Date and time of sale
}
```

### 2.5 Table: `settings`
Stores user profile, trial/subscription state, and cloud backup metadata.
- **Indexed Fields**: `id`
- **Schema**:
```typescript
export interface AppSettings {
  id?: string;              // Fixed singleton key: 'current_user_profile'
  userName: string;         // Artisan / Enterprise name
  trialStartDate: Date;     // Timestamp when trial was initialized
  subscriptionStatus: 'trial' | 'grace_period' | 'active' | 'expired';
  subscriptionExpiresAt?: Date; // Expiration date for active subscriptions
  lastBackupDate?: Date;    // Timestamp of most recent JSON or Drive backup
  googleDriveConnected: boolean; // OAuth connection status
}
```

---

## 3. Atomic Transactions & Integrity Rules
- **Sale Registration**: Executed inside `db.transaction('rw', [db.sales, db.customers, db.products], async () => { ... })`:
  1. Inserts record into `sales`.
  2. Resolves or creates `customer`.
  3. Increments customer `totalSpent += sale.totalAmount` and `ordersCount += 1`.
- **JSON Import**: Executed inside `db.transaction('rw', [db.rawMaterials, db.products, db.customers, db.sales, db.settings], async () => { ... })`:
  1. Clears existing tables.
  2. Bulk inserts imported data arrays.
  3. Validates date objects.

---

## 4. Database Design Gate Status
- **Status**: **PASS (READY)**
- **Next Phase**: `08 — api-design`
- **Blockers**: None
