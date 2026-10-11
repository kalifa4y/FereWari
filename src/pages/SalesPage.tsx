import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Sale, Product } from '../db/db';
import { Button } from '../components/common/Button';
import { formatFCFA } from '../services/calculationService';
import { Zap, Search, Calendar, User, Phone, ShoppingBag, FileText, ArrowRight } from 'lucide-react';

interface SalesPageProps {
  onOpenSaleModal: () => void;
  onOpenReceipt: (sale: Sale, product?: Product) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onOpenSaleModal,
  onOpenReceipt
}) => {
  const [search, setSearch] = useState('');

  const sales = useLiveQuery(() => db.sales.orderBy('saleDate').reverse().toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const productsMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach(p => { if (p.id) map.set(p.id, p); });
    return map;
  }, [products]);

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase().trim();
    return sales.filter(s => {
      const prod = productsMap.get(s.productId);
      const matchProd = prod?.name.toLowerCase().includes(q) || false;
      const matchCust = s.customerName?.toLowerCase().includes(q) || false;
      const matchPhone = s.customerPhone?.includes(q) || false;
      return matchProd || matchCust || matchPhone;
    });
  }, [sales, search, productsMap]);

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy leading-tight">
            Historique des ventes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Consultez vos ventes passées et imprimez ou partagez vos reçus.
          </p>
        </div>

        <Button
          variant="vibrant"
          size="md"
          icon={<Zap className="w-4 h-4 text-white" />}
          onClick={onOpenSaleModal}
          className="shadow-md"
        >
          Nouvelle vente
        </Button>
      </div>

      {/* Search & Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une vente (produit, client, tél)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
          />
        </div>

        <div className="p-2.5 px-4 rounded-xl bg-brand-pale/50 border border-brand-subtle text-xs flex items-center gap-2 self-end sm:self-auto">
          <span className="text-slate-600 font-medium">{filteredSales.length} vente(s) :</span>
          <span className="font-display font-black text-base text-brand-navy">
            {formatFCFA(totalSalesAmount)}
          </span>
        </div>
      </div>

      {/* Sales Transactions & Empty States */}
      {sales.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-pale text-brand-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-black text-brand-navy">
            Aucune vente enregistrée
          </h3>
          {products.length > 0 ? (
            <>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Enregistrez votre première vente en quelques clics pour suivre vos encaissements.
              </p>
              <div className="pt-2">
                <Button variant="vibrant" size="md" onClick={onOpenSaleModal}>
                  Enregistrer une vente
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Vous devez d’abord créer au moins un produit pour pouvoir enregistrer des ventes.
              </p>
              <div className="pt-2">
                <Link
                  to="/recipes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-sm hover:bg-brand-navy transition-colors"
                >
                  Ajouter un produit d'abord <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-display font-black text-brand-navy">
            Aucune vente ne correspond à votre recherche
          </h3>
          <p className="text-xs text-slate-500">
            Vérifiez le nom du client, du produit ou le numéro de téléphone.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
            Effacer la recherche
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden divide-y divide-slate-100">
          {filteredSales.map((sale) => {
            const product = productsMap.get(sale.productId);
            const date = new Date(sale.saleDate);

            return (
              <div
                key={sale.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenReceipt(sale, product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenReceipt(sale, product);
                  }
                }}
                className="p-4 hover:bg-brand-pale/20 transition-colors flex items-center justify-between gap-3 cursor-pointer group focus:outline-none focus:bg-brand-pale/30"
              >
                {/* Left: Product & Customer */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-base sm:text-lg text-brand-navy truncate group-hover:text-brand-vibrant transition-colors">
                      {sale.quantity}x {product?.name || 'Produit'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      N° #{sale.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {sale.customerName || 'Client de passage'}
                    </span>

                    {sale.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {sale.customerPhone}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span className="text-base sm:text-xl font-display font-black text-brand-primary block">
                      {formatFCFA(sale.totalAmount)}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-vibrant group-hover:underline flex items-center justify-end gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Voir le reçu
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
