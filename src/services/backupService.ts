import { db, RawMaterial, Product, Customer, Sale, AppSettings } from '../db/db';

export const MAX_BACKUP_SIZE = 15 * 1024 * 1024; // 15 Mo

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

/**
 * Checks if a backup is urgently recommended (> 7 days since last backup).
 */
export function isBackupReminderDue(lastBackupDate?: Date): boolean {
  if (!lastBackupDate) return true;
  const now = new Date();
  const diffDays = (now.getTime() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

/**
 * Validates the structure and data types of a backup payload before applying it.
 * Ensures zero data loss and catches malformed or corrupted inputs.
 */
export function validateBackupPayload(
  payload: unknown,
  fileSize?: number
): { valid: boolean; error?: string; data?: FereWariBackupPayload } {
  if (fileSize !== undefined) {
    if (fileSize <= 0) {
      return { valid: false, error: 'Le fichier de sauvegarde est vide.' };
    }
    if (fileSize > MAX_BACKUP_SIZE) {
      return {
        valid: false,
        error: `Le fichier de sauvegarde dépasse la taille maximale autorisée (15 Mo).`,
      };
    }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'Le contenu du fichier n’est pas un objet JSON valide.' };
  }

  const candidate = payload as Record<string, unknown>;

  if (candidate.app !== 'FereWari') {
    return {
      valid: false,
      error: "Ce fichier n'est pas une sauvegarde FereWari reconnue (identifiant d'application manquant ou invalide).",
    };
  }

  if (typeof candidate.version !== 'string' || !candidate.version.trim()) {
    return { valid: false, error: 'Version de sauvegarde manquante ou invalide.' };
  }

  if (!candidate.data || typeof candidate.data !== 'object' || Array.isArray(candidate.data)) {
    return { valid: false, error: 'La section des données (data) est manquante ou invalide.' };
  }

  const data = candidate.data as Record<string, unknown>;

  if (!Array.isArray(data.rawMaterials)) {
    return { valid: false, error: 'La table des matières premières (rawMaterials) est invalide.' };
  }
  if (!Array.isArray(data.products)) {
    return { valid: false, error: 'La table des produits (products) est invalide.' };
  }
  if (!Array.isArray(data.customers)) {
    return { valid: false, error: 'La table des clients (customers) est invalide.' };
  }
  if (!Array.isArray(data.sales)) {
    return { valid: false, error: 'La table des ventes (sales) est invalide.' };
  }
  if (!Array.isArray(data.settings)) {
    return { valid: false, error: 'La table des paramètres (settings) est invalide.' };
  }

  // Validate rawMaterials items
  for (let i = 0; i < data.rawMaterials.length; i++) {
    const item = data.rawMaterials[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: `Matière première #${i + 1} invalide : nom manquant.` };
    }
    if (typeof item.unit !== 'string' || !item.unit.trim()) {
      return { valid: false, error: `Matière première "${item.name}" invalide : unité manquante.` };
    }
    const stock = typeof item.stockQty === 'number' ? item.stockQty : (typeof item.currentStock === 'number' ? item.currentStock : undefined);
    if (stock !== undefined && (!Number.isFinite(stock) || stock < 0)) {
      return { valid: false, error: `Matière première "${item.name}" : stock invalide ou négatif.` };
    }
    const cost = typeof item.unitCost === 'number' ? item.unitCost : (typeof item.purchasePrice === 'number' ? item.purchasePrice : undefined);
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      return { valid: false, error: `Matière première "${item.name}" : prix d’achat invalide ou négatif.` };
    }
  }

  // Validate products items
  for (let i = 0; i < data.products.length; i++) {
    const item = data.products[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: `Produit #${i + 1} invalide : nom manquant.` };
    }
    if (typeof item.sellingPrice !== 'number' || !Number.isFinite(item.sellingPrice) || item.sellingPrice < 0) {
      return { valid: false, error: `Produit "${item.name}" : prix de vente invalide ou négatif.` };
    }
    if (!Array.isArray(item.ingredients)) {
      return { valid: false, error: `Produit "${item.name}" : liste des ingrédients invalide.` };
    }
    for (let j = 0; j < item.ingredients.length; j++) {
      const ing = item.ingredients[j] as Record<string, unknown>;
      if (!ing || typeof ing !== 'object') {
        return { valid: false, error: `Produit "${item.name}" : ingrédient #${j + 1} invalide.` };
      }
      if (typeof ing.quantity !== 'number' || !Number.isFinite(ing.quantity) || ing.quantity <= 0) {
        return { valid: false, error: `Produit "${item.name}" : quantité de l'ingrédient #${j + 1} invalide.` };
      }
      if (typeof ing.unit !== 'string' || !ing.unit.trim()) {
        return { valid: false, error: `Produit "${item.name}" : unité de l'ingrédient #${j + 1} manquante.` };
      }
    }
  }

  // Validate customers items
  for (let i = 0; i < data.customers.length; i++) {
    const item = data.customers[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: `Client #${i + 1} invalide : nom manquant.` };
    }
    if (typeof item.totalSpent === 'number' && (!Number.isFinite(item.totalSpent) || item.totalSpent < 0)) {
      return { valid: false, error: `Client "${item.name}" : total dépensé négatif ou invalide.` };
    }
  }

  // Validate sales items
  for (let i = 0; i < data.sales.length; i++) {
    const item = data.sales[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `Vente #${i + 1} invalide.` };
    }
    if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: `Vente #${i + 1} : quantité invalide.` };
    }
    if (typeof item.totalAmount !== 'number' || !Number.isFinite(item.totalAmount) || item.totalAmount < 0) {
      return { valid: false, error: `Vente #${i + 1} : montant invalide.` };
    }
  }

  return {
    valid: true,
    data: candidate as unknown as FereWariBackupPayload,
  };
}

/**
 * Serializes all tables into a structured JSON string.
 * Sensitive local security credentials (pinCode, pinHash, pinSalt) are strictly excluded.
 */
export async function generateBackupJSON(dataOverride?: {
  rawMaterials?: RawMaterial[];
  products?: Product[];
  customers?: Customer[];
  sales?: Sale[];
  settings?: AppSettings[];
}): Promise<string> {
  let rawMaterials: RawMaterial[] = [];
  let products: Product[] = [];
  let customers: Customer[] = [];
  let sales: Sale[] = [];
  let settings: AppSettings[] = [];

  if (dataOverride) {
    rawMaterials = dataOverride.rawMaterials || [];
    products = dataOverride.products || [];
    customers = dataOverride.customers || [];
    sales = dataOverride.sales || [];
    settings = dataOverride.settings || [];
  } else if (typeof indexedDB !== 'undefined') {
    [rawMaterials, products, customers, sales, settings] = await Promise.all([
      db.rawMaterials.toArray(),
      db.products.toArray(),
      db.customers.toArray(),
      db.sales.toArray(),
      db.settings.toArray(),
    ]);
  }

  // Sanitize settings to never expose PIN or cryptographic salts
  const sanitizedSettings = settings.map((s) => {
    const sanitized: AppSettings = { ...s };
    delete sanitized.pinCode;
    delete sanitized.pinHash;
    delete sanitized.pinSalt;
    delete sanitized.pinIterations;
    return sanitized;
  });

  const payload: FereWariBackupPayload = {
    app: 'FereWari',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      rawMaterialsCount: rawMaterials.length,
      productsCount: products.length,
      customersCount: customers.length,
      salesCount: sales.length,
    },
    data: {
      rawMaterials,
      products,
      customers,
      sales,
      settings: sanitizedSettings,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Exports data to a local JSON file download.
 */
export async function exportBackupToFile(): Promise<string> {
  const json = await generateBackupJSON();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ferewari-backup-${dateStr}.json`;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  // Update last backup date
  await db.settings.update('current_user_profile', {
    lastBackupDate: new Date(),
  });

  return filename;
}

/**
 * Parses and restores database from a JSON backup file.
 * Performs pre-flight validations, ensures local PIN security preservation,
 * and executes within an atomic Dexie transaction.
 */
export async function restoreBackupFromFile(file: File): Promise<{
  success: boolean;
  message: string;
  counts?: { rawMaterials: number; products: number; customers: number; sales: number };
}> {
  try {
    if (file.size > MAX_BACKUP_SIZE) {
      return {
        success: false,
        message: 'Le fichier dépasse la taille maximale autorisée (15 Mo).',
      };
    }
    if (file.size === 0) {
      return {
        success: false,
        message: 'Le fichier de sauvegarde est vide.',
      };
    }

    const text = await file.text();
    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Format de fichier corrompu. Le fichier ne contient pas de JSON valide.',
      };
    }

    const validation = validateBackupPayload(rawParsed, file.size);
    if (!validation.valid || !validation.data) {
      return {
        success: false,
        message: validation.error || 'Sauvegarde invalide.',
      };
    }

    const { rawMaterials, products, customers, sales, settings } = validation.data.data;

    // Preserve local security credentials so restore never silently removes or resets PIN
    const existingSettings = await db.settings.get('current_user_profile');
    const preservedPinHash = existingSettings?.pinHash;
    const preservedPinSalt = existingSettings?.pinSalt;
    const preservedPinIterations = existingSettings?.pinIterations;
    const preservedPinCode = existingSettings?.pinCode;

    // Execute atomic transaction: any failure will rollback without touching existing data
    await db.transaction('rw', [db.rawMaterials, db.products, db.customers, db.sales, db.settings], async () => {
      await db.rawMaterials.clear();
      await db.products.clear();
      await db.customers.clear();
      await db.sales.clear();
      await db.settings.clear();

      if (rawMaterials && rawMaterials.length > 0) {
        const formatted = rawMaterials.map((item) => ({
          ...item,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }));
        await db.rawMaterials.bulkAdd(formatted);
      }

      if (products && products.length > 0) {
        const formatted = products.map((item) => ({
          ...item,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }));
        await db.products.bulkAdd(formatted);
      }

      if (customers && customers.length > 0) {
        const formatted = customers.map((item) => ({
          ...item,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }));
        await db.customers.bulkAdd(formatted);
      }

      if (sales && sales.length > 0) {
        const formatted = sales.map((item) => ({
          ...item,
          saleDate: item.saleDate ? new Date(item.saleDate) : new Date(),
        }));
        await db.sales.bulkAdd(formatted);
      }

      if (settings && settings.length > 0) {
        const formatted = settings.map((item) => {
          const profile: AppSettings = {
            ...item,
            trialStartDate: item.trialStartDate ? new Date(item.trialStartDate) : new Date(),
            subscriptionExpiresAt: item.subscriptionExpiresAt ? new Date(item.subscriptionExpiresAt) : undefined,
            lastBackupDate: new Date(),
          };

          // If this is the main profile, protect and preserve local security setup
          if (profile.id === 'current_user_profile') {
            if (preservedPinHash) {
              profile.pinHash = preservedPinHash;
              profile.pinSalt = preservedPinSalt;
              profile.pinIterations = preservedPinIterations;
              delete profile.pinCode;
            } else if (preservedPinCode) {
              profile.pinCode = preservedPinCode;
              delete profile.pinHash;
              delete profile.pinSalt;
              delete profile.pinIterations;
            } else {
              delete profile.pinHash;
              delete profile.pinSalt;
              delete profile.pinIterations;
              delete profile.pinCode;
            }
          }

          return profile;
        });
        await db.settings.bulkPut(formatted);
      } else {
        // Guarantee at least standard profile with preserved PIN
        await db.settings.put({
          id: 'current_user_profile',
          userName: existingSettings?.userName || 'Atelier Artisanal',
          trialStartDate: existingSettings?.trialStartDate || new Date(),
          subscriptionStatus: existingSettings?.subscriptionStatus || 'trial',
          lastBackupDate: new Date(),
          googleDriveConnected: false,
          pinHash: preservedPinHash,
          pinSalt: preservedPinSalt,
          pinIterations: preservedPinIterations,
          pinCode: preservedPinCode,
        });
      }
    });

    return {
      success: true,
      message: 'Sauvegarde restaurée avec succès !',
      counts: {
        rawMaterials: rawMaterials?.length || 0,
        products: products?.length || 0,
        customers: customers?.length || 0,
        sales: sales?.length || 0,
      },
    };
  } catch (error) {
    console.error('Error importing backup:', error);
    return {
      success: false,
      message: `Erreur lors de la restauration: ${error instanceof Error ? error.message : 'Fichier corrompu'}`,
    };
  }
}
