import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Zap,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Sparkles,
  Percent
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
    const completeBreakdowns = products
      .map(p => calculateProductCRU(p, rawMaterialsMap))
      .filter(b => b.hasReliableMargin);

    if (completeBreakdowns.length === 0) return 0;
    const sum = completeBreakdowns.reduce((acc, b) => acc + b.grossMarginPercentage, 0);
    return sum / completeBreakdowns.length;
  }, [products, rawMaterialsMap]);

  // Low stock alerts: ONLY for materials with strictly positive quantity and <= 5.
  // Quantity === 0 is excluded as it represents untracked stock in the current data model.
  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter(m => m.stockQty > 0 && m.stockQty <= 5);
  }, [rawMaterials]);

  // Recent 5 sales
  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  const hasData = products.length > 0 || sales.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Action-Oriented Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy">
            Que voulez-vous faire aujourd’hui ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez facilement vos ventes, vos produits et vos ingrédients au quotidien.
          </p>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Button
            variant="vibrant"
            size="md"
            icon={<Zap className="w-4 h-4 text-white" />}
            onClick={() => onOpenSaleModal()}
            className="shadow-sm font-bold"
          >
            Enregistrer une vente
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Plus className="w-4 h-4 text-brand-primary" />}
            onClick={onOpenRecipeModal}
          >
            Ajouter un produit
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Plus className="w-4 h-4 text-brand-primary" />}
            onClick={onOpenMaterialModal}
          >
            Ajouter un ingrédient
          </Button>
        </div>
      </div>

      {/* KPI Stats or Onboarding Tip */}
      {!hasData ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-pale text-brand-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-black text-brand-navy">
            Bienvenue dans votre atelier FereWari
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Commencez par ajouter vos ingrédients ou vos produits pour calculer automatiquement vos coûts et enregistrer vos premières ventes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
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
            subtitle={totalSalesCount > 0 ? `${totalSalesCount} commande(s)` : 'Aucune vente'}
            icon={<ShoppingBag className="w-6 h-6" />}
            variant="default"
          />

          {products.length > 0 && (
            <StatCard
              label="Marge Moyenne"
              value={formatPercent(averageMargin)}
              subtitle={`${products.length} produit(s) en catalogue`}
              icon={<Percent className="w-6 h-6" />}
              variant="default"
            />
          )}
        </div>
      )}

      {/* Low Stock Notification (strictly stockQty > 0 && stockQty <= 5) */}
      {lowStockMaterials.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider">Alerte Réapprovisionnement</h4>
              <p>
                {lowStockMaterials.map(m => `${m.name} (${m.stockQty} ${m.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            to="/materials"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
          >
            Gérer les ingrédients
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section (Left 2 Cols if sales exist, else full width) */}
          <div className={recentSales.length > 0 ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-brand-navy">
                  Produits à vendre
                </h3>
                <p className="text-xs text-slate-500">
                  Accès rapide pour enregistrer une vente
                </p>
              </div>
              {products.length > 0 && (
                <Link
                  to="/recipes"
                  className="text-xs font-semibold text-brand-primary hover:text-brand-navy inline-flex items-center gap-1"
                >
                  Voir tout ({products.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {products.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center text-xs text-slate-500">
                Aucun produit créé pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {products.slice(0, 4).map(p => {
                  const b = calculateProductCRU(p, rawMaterialsMap);
                  const isComplete = b.isComplete;
                  const hasCost = isComplete && b.totalUnitCost > 0;
                  const hasReliableMargin = b.hasReliableMargin;
                  const isLoss = hasCost && hasReliableMargin && b.grossMarginAmount < 0;

                  return (
                    <Card
                      key={p.id}
                      variant="default"
                      className="p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display font-black text-base text-brand-navy truncate">
                            {p.name}
                          </h4>
                          {isComplete && hasCost ? (
                            hasReliableMargin ? (
                              <Badge
                                variant={isLoss ? 'alert' : b.grossMarginPercentage >= 50 ? 'cyan' : 'blue'}
                                size="sm"
                              >
                                {formatPercent(b.grossMarginPercentage)}
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Prix à renseigner
                              </Badge>
                            )
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Coût à compléter
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Prix Vente</span>
                            <span className="font-bold text-brand-navy">
                              {p.sellingPrice > 0 ? formatFCFA(p.sellingPrice) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Coût (CRU)</span>
                            <span className="font-bold text-slate-700">
                              {hasCost ? formatFCFA(b.totalUnitCost) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700">
                          {hasCost && hasReliableMargin ? `${isLoss ? '' : '+'}${formatFCFA(b.grossMarginAmount)} / u` : ''}
                        </span>
                        <Button
                          variant="vibrant"
                          size="sm"
                          icon={<Zap className="w-3.5 h-3.5 text-white" />}
                          onClick={() => onOpenSaleModal(p)}
                        >
                          Vendre
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Sales Section (Right 1 Col) */}
          {recentSales.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-black text-brand-navy">
                    Dernières Ventes
                  </h3>
                  <p className="text-xs text-slate-500">Historique récent</p>
                </div>
                <Link
                  to="/sales"
                  className="text-xs font-semibold text-brand-primary hover:text-brand-navy inline-flex items-center gap-1"
                >
                  Tout voir <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Card variant="default" className="p-0 overflow-hidden divide-y divide-slate-100">
                {recentSales.map(s => {
                  const prod = productsMap.get(s.productId);
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-brand-navy truncate">
                          {s.quantity}x {prod?.name || 'Produit'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {s.customerName || 'Client de passage'}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          <span>{new Date(s.saleDate).toLocaleDateString('fr-FR')}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="font-display font-black text-sm text-brand-primary block">
                          {formatFCFA(s.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(s, prod)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-brand-primary underline transition-colors"
                        >
                          Voir reçu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
