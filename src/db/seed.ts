import { db, AppSettings } from './db';

/**
 * Initializes app settings if first run and cleans legacy mock data if present.
 * Leaves the database completely clean for the artisan.
 */
export async function seedInitialData() {
  // Check if legacy mock data exists and remove it
  const mockMaterial = await db.rawMaterials.where('name').equals("Fleurs d'Hibiscus séchées (Bissap)").first();
  if (mockMaterial) {
    await clearAllUserData();
  }

  // Ensure singleton app settings exist
  const existingSettings = await db.settings.get('current_user_profile');
  if (!existingSettings) {
    const now = new Date();
    const initialSettings: AppSettings = {
      id: 'current_user_profile',
      userName: '',
      pinCode: '',
      isConfigured: false,
      trialStartDate: now,
      subscriptionStatus: 'active',
      googleDriveConnected: false
    };
    await db.settings.put(initialSettings);
  }
}

/**
 * Completely wipes all artisan business data (raw materials, products, customers, sales)
 * for a fresh start.
 */
export async function clearAllUserData() {
  await db.transaction('rw', [db.rawMaterials, db.products, db.customers, db.sales], async () => {
    await db.rawMaterials.clear();
    await db.products.clear();
    await db.customers.clear();
    await db.sales.clear();
  });
}
