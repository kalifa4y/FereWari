import Dexie, { Table } from 'dexie';

export interface RawMaterial {
  id?: number;
  name: string;
  unit: string;
  unitCost: number;
  stockQty: number;
  updatedAt: Date;
}

export interface RecipeItem {
  rawMaterialId: number;
  quantity: number;
}

export interface Product {
  id?: number;
  name: string;
  sellingPrice: number;
  packagingCost: number;
  transportCost: number;
  otherCosts: number;
  ingredients: RecipeItem[];
  calculatedUnitCost: number;
  updatedAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  updatedAt: Date;
}

export interface Sale {
  id?: number;
  productId: number;
  quantity: number;
  totalAmount: number;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  saleDate: Date;
}

export interface AppSettings {
  id?: string; // 'current_user_profile'
  userName: string;
  pinCode?: string;
  isConfigured?: boolean;
  trialStartDate: Date;
  subscriptionStatus: 'trial' | 'grace_period' | 'active' | 'expired';
  subscriptionExpiresAt?: Date;
  lastBackupDate?: Date;
  googleDriveConnected: boolean;
}

export class FereWariDatabase extends Dexie {
  rawMaterials!: Table<RawMaterial>;
  products!: Table<Product>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  settings!: Table<AppSettings>;

  constructor() {
    super('FereWariDB');
    this.version(1).stores({
      rawMaterials: '++id, name, updatedAt',
      products: '++id, name, calculatedUnitCost, updatedAt',
      customers: '++id, name, phone, totalSpent, ordersCount',
      sales: '++id, productId, customerId, saleDate',
      settings: 'id'
    });
  }
}

export const db = new FereWariDatabase();
