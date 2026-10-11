import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Customer, Sale, Product, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { Phone, Calendar, MessageCircle } from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  productsMap: Map<number, Product>;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  productsMap
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer?.id || !isOpen) {
      setSales([]);
      return;
    }

    const loadCustomerSales = async () => {
      setLoading(true);
      try {
        const list = await db.sales.where('customerId').equals(customer.id!).reverse().sortBy('saleDate');
        setSales(list);
      } catch (err) {
        console.error('Error loading customer sales:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerSales();
  }, [customer, isOpen]);

  if (!customer) return null;

  const handleWhatsApp = () => {
    if (!customer.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle="Fiche client et historique des achats"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Customer KPI Header Card */}
        <div className="p-4 rounded-2xl bg-ocean-gradient text-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-brand-subtle font-semibold">Total des achats</span>
            <p className="text-2xl font-display font-black text-white">
              {formatFCFA(customer.totalSpent)}
            </p>
            {customer.phone && (
              <p className="text-xs text-brand-pale flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3" />
                <span>{customer.phone}</span>
              </p>
            )}
          </div>

          <div className="text-right space-y-2">
            <div className="px-3 py-1 rounded-xl bg-white/15 text-white font-display font-black text-sm">
              {customer.ordersCount} commande(s)
            </div>
            {customer.phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="text-xs px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Purchase History */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
            Commandes passées
          </h4>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Chargement...</div>
          ) : sales.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Aucun achat enregistré pour ce client.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sales.map(s => {
                const product = productsMap.get(s.productId);
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-brand-navy">
                        {s.quantity}x {product?.name || 'Produit'}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(s.saleDate).toLocaleDateString('fr-FR')}</span>
                      </p>
                    </div>

                    <span className="font-display font-black text-sm text-brand-primary">
                      {formatFCFA(s.totalAmount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button variant="outline" size="md" className="w-full" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
