import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Product, Customer, Sale, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import {
  ShoppingBag,
  User,
  Phone,
  CheckCircle,
  Plus,
  Minus,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';

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
  const [customTotalInput, setCustomTotalInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opened or when initial product / products change
  useEffect(() => {
    if (!isOpen) return;

    if (initialProduct?.id) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && products[0].id) {
      setSelectedProductId(products[0].id);
    } else {
      setSelectedProductId('');
    }

    setQuantity(1);
    setCustomTotalInput('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomer(null);
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, initialProduct, products]);

  const currentProduct = useMemo(() => {
    return products.find(p => p.id === Number(selectedProductId));
  }, [products, selectedProductId]);

  // Automatic calculation: Unit Price × Quantity
  const calculatedTotal = useMemo(() => {
    if (!currentProduct) return 0;
    const price = currentProduct.sellingPrice || 0;
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
    return price * qty;
  }, [currentProduct, quantity]);

  // Parse custom amount if user provided one
  const parsedCustomTotal = useMemo(() => {
    if (customTotalInput.trim() === '') return null;
    const val = Number(customTotalInput);
    return Number.isFinite(val) && val >= 0 ? val : NaN;
  }, [customTotalInput]);

  const hasCustomTotal = parsedCustomTotal !== null && !Number.isNaN(parsedCustomTotal);
  const finalTotal = hasCustomTotal ? parsedCustomTotal : calculatedTotal;

  // Filter suggestions when user types in the customer name or phone
  const customerSuggestions = useMemo(() => {
    if (selectedCustomer) return [];
    const query = customerName.trim().toLowerCase();
    const phoneQuery = customerPhone.trim();
    if (!query && !phoneQuery) return [];

    return customers
      .filter(c => {
        const matchName = query ? c.name.toLowerCase().includes(query) : false;
        const matchPhone = phoneQuery ? c.phone.includes(phoneQuery) : false;
        return matchName || matchPhone;
      })
      .slice(0, 4);
  }, [customers, customerName, customerPhone, selectedCustomer]);

  // Handlers for product and quantity changes: reset custom total
  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    setCustomTotalInput('');
    setError(null);
  };

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, Math.floor(newQty) || 1);
    setQuantity(validQty);
    setCustomTotalInput('');
    setError(null);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone || '');
  };

  const handleDetachCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleCustomerNameChange = (val: string) => {
    if (selectedCustomer && selectedCustomer.name !== val) {
      // If user starts modifying the name of a selected customer, detach and clear phone
      setSelectedCustomer(null);
      setCustomerPhone('');
    }
    setCustomerName(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (products.length === 0) {
      setError('Aucun produit disponible dans le catalogue.');
      return;
    }

    if (!selectedProductId || !currentProduct) {
      setError('Veuillez sélectionner un produit.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('La quantité vendue doit être un nombre entier supérieur à 0.');
      return;
    }

    if (parsedCustomTotal !== null && Number.isNaN(parsedCustomTotal)) {
      setError('Le montant personnalisé doit être un nombre valide (0 ou supérieur).');
      return;
    }

    if (!Number.isFinite(finalTotal) || finalTotal < 0) {
      setError('Le montant total ne peut pas être négatif.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      let targetCustomerId: number | undefined = selectedCustomer?.id;
      const cleanName = customerName.trim();
      const cleanPhone = customerPhone.trim();
      const hasCustomerInfo = Boolean(cleanName || cleanPhone);
      const displayName = hasCustomerInfo ? cleanName || 'Client de passage' : 'Client de passage';

      let savedSale: Sale | null = null;
      let associatedCustomer: Customer | undefined = selectedCustomer || undefined;

      // Atomic Dexie transaction for sale and customer records
      await db.transaction('rw', [db.sales, db.customers], async () => {
        if (targetCustomerId) {
          const cust = await db.customers.get(targetCustomerId);
          if (cust) {
            await db.customers.update(targetCustomerId, {
              totalSpent: (cust.totalSpent || 0) + finalTotal,
              ordersCount: (cust.ordersCount || 0) + 1,
              updatedAt: now
            });
            associatedCustomer = {
              ...cust,
              totalSpent: (cust.totalSpent || 0) + finalTotal,
              ordersCount: (cust.ordersCount || 0) + 1,
              updatedAt: now
            };
          }
        } else if (hasCustomerInfo) {
          // Lookup existing customer: use phone only if phone is non-empty!
          let existing: Customer | undefined;
          if (cleanPhone.length > 0) {
            existing = await db.customers.where('phone').equals(cleanPhone).first();
          }
          if (!existing && cleanName.length > 0) {
            existing = await db.customers.where('name').equals(cleanName).first();
          }

          if (existing?.id) {
            targetCustomerId = existing.id;
            await db.customers.update(existing.id, {
              totalSpent: (existing.totalSpent || 0) + finalTotal,
              ordersCount: (existing.ordersCount || 0) + 1,
              updatedAt: now
            });
            associatedCustomer = {
              ...existing,
              totalSpent: (existing.totalSpent || 0) + finalTotal,
              ordersCount: (existing.ordersCount || 0) + 1,
              updatedAt: now
            };
          } else {
            // Create new customer record
            const newCustId = (await db.customers.add({
              name: displayName,
              phone: cleanPhone,
              totalSpent: finalTotal,
              ordersCount: 1,
              updatedAt: now
            })) as number;
            targetCustomerId = newCustId;
            associatedCustomer = {
              id: newCustId,
              name: displayName,
              phone: cleanPhone,
              totalSpent: finalTotal,
              ordersCount: 1,
              updatedAt: now
            };
          }
        }

        const salePayload: Sale = {
          productId: Number(selectedProductId),
          quantity,
          totalAmount: finalTotal,
          customerId: targetCustomerId,
          customerName: displayName,
          customerPhone: cleanPhone,
          saleDate: now
        };

        const saleId = (await db.sales.add(salePayload)) as number;
        savedSale = { ...salePayload, id: saleId };
      });

      // Dexie transaction committed successfully
      if (savedSale && onSaleCompleted) {
        onSaleCompleted(savedSale, associatedCustomer);
      }

      onClose();
    } catch (err) {
      console.error('Error saving sale:', err);
      setError("Une erreur est survenue lors de l'enregistrement de la vente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer une vente"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-900 space-y-2">
            <div className="flex justify-center">
              <ShoppingBag className="w-8 h-8 text-amber-600" />
            </div>
            <p className="font-bold text-sm">Aucun produit dans votre catalogue</p>
            <p className="text-slate-600">
              Créez d'abord une fiche recette pour pouvoir enregistrer des ventes.
            </p>
          </div>
        ) : (
          <>
            {/* A. Choix du produit */}
            <div className="space-y-1.5">
              <label
                htmlFor="sale-product-select"
                className="block text-xs font-bold text-brand-navy tracking-wide uppercase"
              >
                Produit
              </label>
              <select
                id="sale-product-select"
                value={selectedProductId}
                onChange={e => handleProductChange(Number(e.target.value))}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatFCFA(p.sellingPrice)}
                  </option>
                ))}
              </select>

              {currentProduct && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 px-1">
                  <span>Prix unitaire :</span>
                  <span className="font-bold text-brand-navy">
                    {formatFCFA(currentProduct.sellingPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* B. Quantité */}
            <div className="space-y-1.5">
              <label
                htmlFor="sale-quantity-input"
                className="block text-xs font-bold text-brand-navy tracking-wide uppercase"
              >
                Quantité
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-12 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="sale-quantity-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-center font-display font-black text-xl py-2 rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-12 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold flex items-center justify-center transition-colors shrink-0"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* C. Total à encaisser */}
            <div className="p-4 rounded-2xl bg-brand-pale/50 border border-brand-subtle/60 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Total à encaisser
                </span>
                <span className="text-2xl font-display font-black text-brand-navy">
                  {formatFCFA(finalTotal)}
                </span>
              </div>

              {hasCustomTotal && (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>
                    Montant modifié manuellement (calculé : {formatFCFA(calculatedTotal)})
                  </span>
                </div>
              )}

              {/* Remise ou montant personnalisé (replié par défaut) */}
              <details className="group pt-1">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
                  <span>Appliquer une remise ou modifier le montant</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pt-2">
                  <Input
                    id="sale-custom-total-input"
                    label="Montant personnalisé"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder={calculatedTotal.toString()}
                    suffix="FCFA"
                    value={customTotalInput}
                    onChange={e => setCustomTotalInput(e.target.value)}
                    helperText="Laissez vide pour conserver le montant calculé automatiquement."
                  />
                </div>
              </details>
            </div>

            {/* D. Client facultatif (replié par défaut) */}
            <details className="group rounded-2xl border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
                <div>
                  <span className="block text-sm font-display font-black text-brand-navy">
                    Ajouter un client (facultatif)
                  </span>
                  <span className="block text-xs text-slate-500">
                    {selectedCustomer
                      ? `Client : ${selectedCustomer.name}`
                      : customerName.trim()
                        ? `Client : ${customerName.trim()}`
                        : 'Client de passage par défaut'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
              </summary>

              <div className="px-4 pb-4 pt-1 space-y-3">
                {selectedCustomer && (
                  <div className="p-2.5 rounded-xl bg-brand-pale/70 border border-brand-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-brand-navy block">
                        Client sélectionné : {selectedCustomer.name}
                      </span>
                      <span className="text-slate-500">
                        {selectedCustomer.phone || 'Sans téléphone'} • {selectedCustomer.ordersCount || 0} commande(s)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetachCustomer}
                      className="p-1 text-slate-400 hover:text-brand-alert rounded-lg hover:bg-white transition-colors"
                      title="Détacher ce client"
                      aria-label="Détacher le client"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <Input
                  id="sale-customer-name"
                  label="Nom du client"
                  placeholder="Ex : Aïssatou Diallo"
                  icon={<User className="w-4 h-4" />}
                  value={customerName}
                  onChange={e => handleCustomerNameChange(e.target.value)}
                />

                {/* Suggestions automatiques */}
                {customerSuggestions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                      Clients enregistrés :
                    </span>
                    <div className="space-y-1">
                      {customerSuggestions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left p-2 rounded-lg hover:bg-white flex items-center justify-between text-xs transition-colors border border-transparent hover:border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-brand-navy block">{c.name}</span>
                            <span className="text-[11px] text-slate-500">{c.phone || 'Pas de numéro'}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-brand-primary">
                            {c.ordersCount || 0} achat(s)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  id="sale-customer-phone"
                  label="Numéro de téléphone"
                  type="tel"
                  placeholder="Ex : 70 12 34 56"
                  icon={<Phone className="w-4 h-4" />}
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </details>
          </>
        )}

        {/* Footer avec action unique */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Annuler
          </Button>

          <Button
            type="submit"
            variant="vibrant"
            size="md"
            disabled={products.length === 0 || isSubmitting}
            isLoading={isSubmitting}
            icon={<CheckCircle className="w-4 h-4" />}
            className="w-full sm:w-auto font-display font-black text-sm shadow-md"
          >
            Enregistrer la vente ({formatFCFA(finalTotal)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};
