import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, Sale } from './db/db';
import { seedInitialData } from './db/seed';

import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { DonationModal } from './components/subscription/DonationModal';
import { OnboardingScreen } from './components/auth/OnboardingScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';

import { ExpressSaleModal } from './components/sales/ExpressSaleModal';
import { SaleReceiptModal } from './components/sales/SaleReceiptModal';
import { ProductFormModal } from './components/recipes/ProductFormModal';
import { RawMaterialFormModal } from './components/materials/RawMaterialFormModal';

import { DashboardPage } from './pages/DashboardPage';
import { RawMaterialsPage } from './pages/RawMaterialsPage';
import { RecipesPage } from './pages/RecipesPage';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('fw_unlocked') === 'true';
  });

  // Settings & user profile
  const settings = useLiveQuery(() => db.settings.get('current_user_profile'), []);

  // Global Modal States
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleInitialProduct, setSaleInitialProduct] = useState<Product | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [activeReceiptProduct, setActiveReceiptProduct] = useState<Product | undefined>(undefined);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Live queries for global modals
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // Seed / Initialize on boot
  useEffect(() => {
    const init = async () => {
      try {
        await seedInitialData();
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem('fw_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('fw_unlocked');
    setIsUnlocked(false);
  };

  const handleOpenSale = (product?: Product) => {
    setSaleInitialProduct(product || null);
    setIsSaleModalOpen(true);
  };

  const handleOpenReceipt = (sale: Sale, product?: Product) => {
    setActiveReceiptSale(sale);
    setActiveReceiptProduct(product || products.find(p => p.id === sale.productId));
    setIsReceiptOpen(true);
  };

  const handleSaleCompleted = (sale: Sale) => {
    const prod = products.find(p => p.id === sale.productId);
    handleOpenReceipt(sale, prod);
  };

  if (!isInitialized || settings === undefined) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-ocean-gradient flex items-center justify-center text-white mx-auto shadow-lg animate-pulse">
            <span className="font-display font-black text-2xl">FW</span>
          </div>
          <h2 className="text-xl font-display font-black text-brand-navy">FereWari</h2>
          <p className="text-xs text-slate-400">Chargement de votre atelier local...</p>
        </div>
      </div>
    );
  }

  // 1. First-time setup / Onboarding flow
  const isProfileConfigured = Boolean(settings?.isConfigured && settings?.pinCode && settings?.userName?.trim());
  if (!isProfileConfigured) {
    return <OnboardingScreen onComplete={handleUnlock} />;
  }

  // 2. Security PIN Unlock Screen
  if (!isUnlocked) {
    return (
      <PinLockScreen
        companyName={settings.userName}
        expectedPin={settings.pinCode || '0000'}
        onUnlock={handleUnlock}
      />
    );
  }

  // 3. Main Authenticated Application
  return (
    <Router>
      <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col font-sans">
        {/* Top Header */}
        <AppHeader
          onOpenDonation={() => setIsDonationOpen(true)}
          onLock={handleLock}
          companyName={settings.userName}
        />

        {/* Main Views Container */}
        <main className="flex-1 px-3 sm:px-6 pt-4 pb-24 max-w-7xl mx-auto w-full">
          <Switch>
            <Route exact path="/">
              <DashboardPage
                onOpenSaleModal={handleOpenSale}
                onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
                onOpenMaterialModal={() => setIsMaterialModalOpen(true)}
                onOpenReceipt={handleOpenReceipt}
              />
            </Route>

            <Route path="/materials">
              <RawMaterialsPage />
            </Route>

            <Route path="/recipes">
              <RecipesPage onQuickSell={handleOpenSale} />
            </Route>

            <Route path="/sales">
              <SalesPage
                onOpenSaleModal={() => handleOpenSale()}
                onOpenReceipt={handleOpenReceipt}
              />
            </Route>

            <Route path="/customers">
              <CustomersPage />
            </Route>

            <Route path="/settings">
              <SettingsPage
                onOpenDonation={() => setIsDonationOpen(true)}
                onLockApp={handleLock}
              />
            </Route>

            <Redirect to="/" />
          </Switch>
        </main>

        {/* Bottom Tab Bar Navigation */}
        <BottomNav />

        {/* Voluntary Donation & Support Modal */}
        <DonationModal
          isOpen={isDonationOpen}
          onClose={() => setIsDonationOpen(false)}
        />

        {/* Global Express Sale Modal */}
        <ExpressSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          products={products}
          customers={customers}
          initialProduct={saleInitialProduct}
          onSaleCompleted={handleSaleCompleted}
        />

        {/* Global Sale Receipt Modal */}
        <SaleReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sale={activeReceiptSale}
          product={activeReceiptProduct}
        />

        {/* Global Quick Recipe Form Modal */}
        <ProductFormModal
          isOpen={isRecipeModalOpen}
          onClose={() => setIsRecipeModalOpen(false)}
          productToEdit={null}
          rawMaterials={rawMaterials}
        />

        {/* Global Quick Raw Material Form Modal */}
        <RawMaterialFormModal
          isOpen={isMaterialModalOpen}
          onClose={() => setIsMaterialModalOpen(false)}
          materialToEdit={null}
        />
      </div>
    </Router>
  );
};
