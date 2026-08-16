import { db, RawMaterial, Product, Customer, Sale, AppSettings } from '../db/db';

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
 * Serializes all tables into a structured JSON string.
 */
export async function generateBackupJSON(): Promise<string> {
  const [rawMaterials, products, customers, sales, settings] = await Promise.all([
    db.rawMaterials.toArray(),
    db.products.toArray(),
    db.customers.toArray(),
    db.sales.toArray(),
    db.settings.toArray()
  ]);

  const payload: FereWariBackupPayload = {
    app: 'FereWari',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      rawMaterialsCount: rawMaterials.length,
      productsCount: products.length,
      customersCount: customers.length,
      salesCount: sales.length
    },
    data: {
      rawMaterials,
      products,
      customers,
      sales,
      settings
    }
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
    lastBackupDate: new Date()
  });

  return filename;
}

/**
 * Parses and restores database from a JSON backup file.
 */
export async function restoreBackupFromFile(file: File): Promise<{
  success: boolean;
  message: string;
  counts?: { rawMaterials: number; products: number; customers: number; sales: number };
}> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as FereWariBackupPayload;

    if (!parsed || parsed.app !== 'FereWari' || !parsed.data) {
      return {
        success: false,
        message: "Format de fichier invalide. Ce fichier n'est pas une sauvegarde FereWari reconnue."
      };
    }

    const { rawMaterials, products, customers, sales, settings } = parsed.data;

    // Execute atomic transaction
    await db.transaction('rw', [db.rawMaterials, db.products, db.customers, db.sales, db.settings], async () => {
      await db.rawMaterials.clear();
      await db.products.clear();
      await db.customers.clear();
      await db.sales.clear();
      await db.settings.clear();

      if (rawMaterials && rawMaterials.length > 0) {
        const formatted = rawMaterials.map(item => ({ ...item, updatedAt: new Date(item.updatedAt) }));
        await db.rawMaterials.bulkAdd(formatted);
      }
      if (products && products.length > 0) {
        const formatted = products.map(item => ({ ...item, updatedAt: new Date(item.updatedAt) }));
        await db.products.bulkAdd(formatted);
      }
      if (customers && customers.length > 0) {
        const formatted = customers.map(item => ({ ...item, updatedAt: new Date(item.updatedAt) }));
        await db.customers.bulkAdd(formatted);
      }
      if (sales && sales.length > 0) {
        const formatted = sales.map(item => ({ ...item, saleDate: new Date(item.saleDate) }));
        await db.sales.bulkAdd(formatted);
      }
      if (settings && settings.length > 0) {
        const formatted = settings.map(item => ({
          ...item,
          trialStartDate: new Date(item.trialStartDate),
          subscriptionExpiresAt: item.subscriptionExpiresAt ? new Date(item.subscriptionExpiresAt) : undefined,
          lastBackupDate: new Date()
        }));
        await db.settings.bulkPut(formatted);
      } else {
        // Guarantee at least standard profile
        await db.settings.put({
          id: 'current_user_profile',
          userName: 'Atelier Artisanal',
          trialStartDate: new Date(),
          subscriptionStatus: 'trial',
          lastBackupDate: new Date(),
          googleDriveConnected: false
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
        sales: sales?.length || 0
      }
    };
  } catch (error) {
    console.error('Error importing backup:', error);
    return {
      success: false,
      message: `Erreur lors de la restauration: ${error instanceof Error ? error.message : 'Fichier corrompu'}`
    };
  }
}
