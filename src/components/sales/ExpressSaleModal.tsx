import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Product, Customer, Sale, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { User, Phone, CheckCircle } from 'lucide-react';

interface ExpressSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  initialProduct?: Product | null;
  onSaleCompleted?: (sale: Sale, customer?: Customer) => void;
}

export const ExpressSaleModal: React.FC<ExpressSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  initialProduct,
  onSaleCompleted
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customTotal, setCustomTotal] = useState<number | ''>('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct?.id) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && products[0].id) {
      setSelectedProductId(products[0].id);
    }
    setQuantity(1);
    setCustomTotal('');
    setCustomerQuery('');
    setCustomerPhone('');
    setSelectedCustomer(null);
    setError(null);
  }, [isOpen, initialProduct, products]);

  const currentProduct = useMemo(() => {
    return products.find(p => p.id === Number(selectedProductId));
  }, [products, selectedProductId]);

  // Default calculated total
  const calculatedTotal = useMemo(() => {
    if (!currentProduct) return 0;
    return (currentProduct.sellingPrice || 0) * (Number(quantity) || 1);
  }, [currentProduct, quantity]);

  const finalTotal = customTotal !== '' ? Number(customTotal) : calculatedTotal;

  // Matching customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerQuery.trim()) return [];
    const q = customerQuery.toLowerCase().trim();
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 4);
  }, [customers, customerQuery]);

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerQuery(cust.name);
    setCustomerPhone(cust.phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !currentProduct) {
      setError('Veuillez sélectionner un produit.');
      return;
    }
    if (Number(quantity) <= 0) {
      setError('La quantité vendue doit être supérieure à 0.');
      return;
    }
    if (finalTotal < 0) {
      setError('Le montant total ne peut pas être négatif.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      let targetCustomerId = selectedCustomer?.id;
      const cleanName = customerQuery.trim() || 'Client de Passage';
      const cleanPhone = customerPhone.trim() || '';

      await db.transaction('rw', [db.sales, db.customers], async () => {
        // If customer exists or was selected
        if (targetCustomerId) {
          const cust = await db.customers.get(targetCustomerId);
          if (cust) {
            await db.customers.update(targetCustomerId, {
              totalSpent: (cust.totalSpent || 0) + finalTotal,
              ordersCount: (cust.ordersCount || 0) + 1,
              updatedAt: now
            });
          }
        } else if (cleanName !== 'Client de Passage' || cleanPhone) {
          // Check if phone or name matches existing customer in DB
          let existing = await db.customers.where('phone').equals(cleanPhone).first();
          if (!existing && cleanName !== 'Client de Passage') {
            existing = await db.customers.where('name').equals(cleanName).first();
          }

          if (existing?.id) {
            targetCustomerId = existing.id;
            await db.customers.update(existing.id, {
              totalSpent: (existing.totalSpent || 0) + finalTotal,
              ordersCount: (existing.ordersCount || 0) + 1,
              updatedAt: now
            });
          } else {
            // Create brand new customer
            targetCustomerId = await db.customers.add({
              name: cleanName,
              phone: cleanPhone,
              totalSpent: finalTotal,
              ordersCount: 1,
              updatedAt: now
            }) as number;
          }
        }

        // Create Sale Record
        const salePayload: Sale = {
          productId: Number(selectedProductId),
          quantity: Number(quantity),
          totalAmount: finalTotal,
          customerId: targetCustomerId,
          customerName: cleanName,
          customerPhone: cleanPhone,
          saleDate: now
        };

        const saleId = await db.sales.add(salePayload);
        salePayload.id = saleId as number;

        if (onSaleCompleted) {
          onSaleCompleted(salePayload, selectedCustomer || undefined);
        }
      });

      // Trigger Confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });

      onClose();
    } catch (err) {
      console.error('Error saving sale:', err);
      setError('Erreur lors de l\'enregistrement de la vente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Vente Express (POS)"
      subtitle="Enregistrez une vente instantanément et mettez à jour votre classement client"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert">
            {error}
          </div>
        )}

        {/* 1. Product Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
            Produit Vendu
          </label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
            required
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatFCFA(p.sellingPrice)}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Quantity & Total Amount */}
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Quantité vendue"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(val);
              setCustomTotal(''); // reset custom override when qty changes
            }}
            required
          />

          <Input
            label="Montant Total"
            type="number"
            min="0"
            step="any"
            placeholder={calculatedTotal.toString()}
            suffix="FCFA"
            value={customTotal !== '' ? customTotal : calculatedTotal}
            onChange={e => setCustomTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
            helperText={customTotal !== '' ? 'Montant personnalisé appliqué' : 'Calculé automatiquement'}
          />
        </div>

        {/* 3. Customer Attribution (Fast & Non-blocking) */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-vibrant" />
              Attribution Client (Optionnel)
            </h4>
            <p className="text-[11px] text-slate-500">
              Saisissez le nom ou le téléphone pour lier la vente au classement de fidélité.
            </p>
          </div>

          <div className="space-y-2">
            <Input
              label="Nom du client / Entreprise"
              placeholder="Ex: Aïssatou Diallo, Boutique Teranga..."
              icon={<User className="w-4 h-4" />}
              value={customerQuery}
              onChange={e => {
                setCustomerQuery(e.target.value);
                if (selectedCustomer && selectedCustomer.name !== e.target.value) {
                  setSelectedCustomer(null);
                }
              }}
            />

            {/* Smart Suggestions Dropdown */}
            {customerSuggestions.length > 0 && !selectedCustomer && (
              <div className="p-2 rounded-xl bg-brand-pale/50 border border-brand-subtle space-y-1">
                <span className="text-[10px] font-bold uppercase text-brand-navy block px-2">
                  Suggestions de clients existants :
                </span>
                {customerSuggestions.map(cust => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-brand-navy">{cust.name}</p>
                      <p className="text-[10px] text-slate-500">{cust.phone}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-brand-primary">
                      {cust.ordersCount} achat(s) ({formatFCFA(cust.totalSpent)})
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Input
              label="Téléphone (WhatsApp / Mobile)"
              type="tel"
              placeholder="+221 7X XXX XX XX"
              icon={<Phone className="w-4 h-4" />}
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Sale Summary Card */}
        <div className="p-4 rounded-2xl bg-ocean-gradient text-white flex items-center justify-between shadow-md">
          <div className="space-y-0.5">
            <span className="text-xs text-brand-subtle font-semibold">Total à encaisser</span>
            <p className="text-2xl font-display font-black tracking-tight text-white">
              {formatFCFA(finalTotal)}
            </p>
          </div>
          <div className="text-right text-xs text-brand-pale">
            <p className="font-bold">{quantity}x {currentProduct?.name || 'Produit'}</p>
            <p className="text-[11px] opacity-80">{customerQuery || 'Client de Passage'}</p>
          </div>
        </div>

        {/* 5. Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="vibrant"
            size="lg"
            className="font-display font-black text-base shadow-md"
            isLoading={isSubmitting}
            icon={<CheckCircle className="w-4 h-4" />}
          >
            Enregistrer la Vente
          </Button>
        </div>
      </form>
    </Modal>
  );
};
