import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, RawMaterial, Sale } from '../db/db';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { formatFCFA, formatPercent, calculateProductCRU } from '../services/calculationService';
import {
  TrendingUp,
  ShoppingBag,
  FlaskConical,
  Layers,
  Zap,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Sparkles
} from 'lucide-react';

interface DashboardPageProps {
  onOpenSaleModal: (product?: Product) => void;
  onOpenRecipeModal: () => void;
  onOpenMaterialModal: () => void;
  onOpenReceipt: (sale: Sale, product?: Product) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenSaleModal,
  onOpenRecipeModal,
  onOpenMaterialModal,
  onOpenReceipt
}) => {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('saleDate').reverse().toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  const rawMaterialsMap = useMemo(() => {
    const map = new Map<number, RawMaterial>();
    rawMaterials.forEach(m => { if (m.id) map.set(m.id, m); });
    return map;
  }, [rawMaterials]);

  const productsMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach(p => { if (p.id) map.set(p.id, p); });
    return map;
  }, [products]);

  // Aggregate KPI Calculations
  const totalRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [sales]);

  const totalSalesCount = sales.length;

  const averageMargin = useMemo(() => {
    if (products.length === 0) return 0;
    const margins = products.map(p => {
      const b = calculateProductCRU(p, rawMaterialsMap);
      return b.grossMarginPercentage;
    });
    const sum = margins.reduce((a, b) => a + b, 0);
    return sum / products.length;
  }, [products, rawMaterialsMap]);

  // Low stock alerts (only if materials exist and stock <= 5)
  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter(m => m.stockQty <= 5);
  }, [rawMaterials]);

  // Recent 5 sales
  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Hero Welcome Banner */}
      <div className="rounded-3xl bg-ocean-gradient text-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-brand-cyan mb-1">
            <span>✨ FereWari — Atelier Artisanal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black leading-tight text-white">
            Maîtrisez vos Coûts de Fabrication & Vendez plus vite
          </h2>
          <p className="text-xs sm:text-sm text-brand-pale font-medium leading-relaxed">
            Vos coûts de revient (CRU) et vos marges bénéficiaires sont calculés en temps réel et 100% hors-ligne.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <Button
              variant="cyan"
              size="md"
              icon={<Zap className="w-4 h-4 text-brand-navy" />}
              onClick={() => onOpenSaleModal()}
              className="shadow-md"
            >
              ⚡ Vente Express
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Plus className="w-4 h-4 text-brand-primary" />}
              onClick={onOpenRecipeModal}
            >
              + Nouvelle Recette (BOM)
            </Button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-brand-cyan/15 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          label="Chiffre d'Affaires"
          value={formatFCFA(totalRevenue)}
          subtitle="Total des ventes enregistrées"
          icon={<TrendingUp className="w-6 h-6" />}
          variant="ocean"
        />

        <StatCard
          label="Ventes Réalisées"
          value={totalSalesCount}
          subtitle={`${customers.length} client(s) répertorié(s)`}
          icon={<ShoppingBag className="w-6 h-6" />}
          variant="default"
        />

        <StatCard
          label="Marge Moyenne"
          value={formatPercent(averageMargin)}
          subtitle={`${products.length} produit(s) en catalogue`}
          icon={<FlaskConical className="w-6 h-6" />}
          variant="default"
        />

        <StatCard
          label="Matières Premières"
          value={rawMaterials.length}
          subtitle={rawMaterials.length > 0 && lowStockMaterials.length > 0 ? `⚠️ ${lowStockMaterials.length} stock(s) faible(s)` : rawMaterials.length > 0 ? 'Stocks optimaux' : '0 matière'}
          icon={<Layers className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Low Stock Notification if any */}
      {rawMaterials.length > 0 && lowStockMaterials.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold uppercase tracking-wider">Alerte Réapprovisionnement</h4>
              <p>
                {lowStockMaterials.map(m => `${m.name} (${m.stockQty} ${m.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenMaterialModal}>
            Ajuster le stock
          </Button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recipes & Margins Highlights */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-display font-black text-brand-navy">
                Catalogue Produits & Coûts de Revient
              </h3>
              <p className="text-xs text-slate-500">
                Aperçu des marges bénéficiaires calculées selon vos recettes
              </p>
            </div>
            {products.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onOpenRecipeModal}>
                Voir tout ({products.length}) <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
              </Button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-pale text-brand-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-display font-black text-brand-navy">
                Aucune recette enregistrée
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Créez vos premières matières premières et assemblez vos recettes pour calculer instantanément votre Coût de Revient Unitaire (CRU).
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={onOpenMaterialModal}>
                  + Ajouter un intrant
                </Button>
                <Button variant="vibrant" size="sm" onClick={onOpenRecipeModal}>
                  + Créer une recette
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {products.slice(0, 4).map(p => {
                const b = calculateProductCRU(p, rawMaterialsMap);
                const isLoss = b.grossMarginAmount < 0;

                return (
                  <Card
                    key={p.id}
                    variant="default"
                    interactive
                    onClick={() => onOpenSaleModal(p)}
                    className="p-4 flex flex-col justify-between hover:border-brand-vibrant/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-black text-base text-brand-navy truncate">
                          {p.name}
                        </h4>
                        <Badge
                          variant={isLoss ? 'alert' : b.grossMarginPercentage >= 50 ? 'cyan' : 'blue'}
                          size="sm"
                        >
                          {formatPercent(b.grossMarginPercentage)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">PRIX VENTE</span>
                          <span className="font-bold text-brand-navy">{formatFCFA(p.sellingPrice)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">CRU (COÛT)</span>
                          <span className="font-bold text-slate-700">{formatFCFA(b.totalUnitCost)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-700">
                        Gain : +{formatFCFA(b.grossMarginAmount)} / u
                      </span>
                      <span className="text-[11px] font-bold text-brand-primary">
                        ⚡ Vendre
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Sales Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-display font-black text-brand-navy">
                Dernières Ventes
              </h3>
              <p className="text-xs text-slate-500">Transactions récentes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenSaleModal()}>
              + Vendre
            </Button>
          </div>

          <Card variant="default" className="p-0 overflow-hidden divide-y divide-slate-100">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucune vente enregistrée pour le moment.
              </div>
            ) : (
              recentSales.map(s => {
                const prod = productsMap.get(s.productId);
                return (
                  <div
                    key={s.id}
                    onClick={() => onOpenReceipt(s, prod)}
                    className="p-3.5 hover:bg-brand-pale/30 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-brand-navy truncate">
                        {s.quantity}x {prod?.name || 'Produit'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {s.customerName || 'Client de Passage'}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>{new Date(s.saleDate).toLocaleDateString('fr-FR')}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-black text-sm text-brand-primary block">
                        {formatFCFA(s.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 underline">Voir reçu</span>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
