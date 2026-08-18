import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { WizardStepper, WizardStep } from '../common/WizardStepper';
import { Product, Customer, Sale, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import {
  ShoppingBag,
  UserCheck,
  User,
  Phone,
  CheckCircle,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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
    setCurrentStepIndex(0);
    setError(null);
  }, [isOpen, initialProduct, products]);

  const currentProduct = useMemo(() => {
    return products.find(p => p.id === Number(selectedProductId));
  }, [products, selectedProductId]);

  const calculatedTotal = useMemo(() => {
    if (!currentProduct) return 0;
    return (currentProduct.sellingPrice || 0) * (Number(quantity) || 1);
  }, [currentProduct, quantity]);

  const finalTotal = customTotal !== '' ? Number(customTotal) : calculatedTotal;

  const customerSuggestions = useMemo(() => {
    if (!customerQuery.trim()) return [];
    const q = customerQuery.toLowerCase().trim();
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 4);
  }, [customers, customerQuery]);

  const steps: WizardStep[] = [
    {
      id: 'product',
      title: 'Produit & Quantité',
      shortTitle: '1. Produit & Qté',
      description: 'Sélection & Montant',
      icon: <ShoppingBag className="w-4 h-4" />
    },
    {
      id: 'customer',
      title: 'Client & Encaissement',
      shortTitle: '2. Client & Reçu',
      description: 'Fidélité & Validation',
      icon: <UserCheck className="w-4 h-4" />
    }
  ];

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerQuery(cust.name);
    setCustomerPhone(cust.phone);
  };

  const validateStep1 = () => {
    if (!selectedProductId || !currentProduct) {
      setError('Veuillez sélectionner un produit.');
      return false;
    }
    if (Number(quantity) <= 0) {
      setError('La quantité vendue doit être supérieure à 0.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setError(null);
      setCurrentStepIndex(1);
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStepIndex(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !currentProduct) {
      setCurrentStepIndex(0);
      setError('Veuillez sélectionner un produit.');
      return;
    }
    if (Number(quantity) <= 0) {
      setCurrentStepIndex(0);
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
            targetCustomerId = await db.customers.add({
              name: cleanName,
              phone: cleanPhone,
              totalSpent: finalTotal,
              ordersCount: 1,
              updatedAt: now
            }) as number;
          }
        }

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

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.65 }
      });

      onClose();
    } catch (err) {
      console.error('Error saving sale:', err);
      setError('Erreur lors de l\'enregistrement de la vente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Product Selection & Quantity
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy">
          Sélection du Produit & Quantité
        </h4>
        <p className="text-xs text-slate-500">
          Choisissez l'article vendu et le nombre d'unités encaissées.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800 space-y-2">
          <p className="font-bold">Aucun produit dans votre catalogue !</p>
          <p className="text-[11px] opacity-80">
            Créez d'abord une fiche recette pour pouvoir enregistrer des ventes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visual product grid selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wide">
              Catalogue Produits
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {products.map(p => {
                const isSelected = selectedProductId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id!);
                      setCustomTotal('');
                      if (error) setError(null);
                    }}
                    className={clsx(
                      'p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 shadow-xs',
                      isSelected
                        ? 'border-brand-primary bg-brand-pale/60 ring-2 ring-brand-primary/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="truncate">
                      <p className="font-bold text-xs text-brand-navy truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">CRU: {formatFCFA(p.calculatedUnitCost)}</p>
                    </div>
                    <span className="font-display font-black text-sm text-brand-primary shrink-0">
                      {formatFCFA(p.sellingPrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity stepper with +/- buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wide">
                Quantité Vendue
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold flex items-center justify-center transition-colors shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => {
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                    setCustomTotal('');
                  }}
                  className="w-full text-center font-display font-black text-lg py-2 rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold flex items-center justify-center transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Input
              label="Montant Total à Encaisser"
              type="number"
              min="0"
              step="any"
              placeholder={calculatedTotal.toString()}
              suffix="FCFA"
              value={customTotal !== '' ? customTotal : calculatedTotal}
              onChange={e => setCustomTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText={customTotal !== '' ? 'Prix personnalisé / remise appliquée' : 'Calculé : Prix unitaire × Quantité'}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Customer Attribution & Confirmation
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy">
          Attribution Client & Encaissement
        </h4>
        <p className="text-xs text-slate-500">
          Attribuez la commande à un client pour enrichir son profil de fidélité.
        </p>
      </div>

      <div className="space-y-2.5">
        <Input
          label="Nom du client / Boutique (Optionnel)"
          placeholder="Ex: Aïssatou Diallo, Supérette Étoile..."
          icon={<User className="w-4 h-4" />}
          value={customerQuery}
          onChange={e => {
            setCustomerQuery(e.target.value);
            if (selectedCustomer && selectedCustomer.name !== e.target.value) {
              setSelectedCustomer(null);
            }
          }}
          autoFocus
        />

        {/* Smart Suggestions */}
        {customerSuggestions.length > 0 && !selectedCustomer && (
          <div className="p-2.5 rounded-2xl bg-brand-pale/50 border border-brand-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase text-brand-navy block px-2">
              Clients répertoriés :
            </span>
            {customerSuggestions.map(cust => (
              <button
                key={cust.id}
                type="button"
                onClick={() => handleSelectCustomer(cust)}
                className="w-full text-left p-2 rounded-xl hover:bg-white flex items-center justify-between text-xs transition-colors"
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
          label="Numéro de Téléphone (WhatsApp) - Optionnel"
          type="tel"
          placeholder="+221 7X XXX XX XX"
          icon={<Phone className="w-4 h-4" />}
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
        />
      </div>

      {/* Sale Summary Ticket */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-navy via-brand-primary to-brand-vibrant text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-subtle">
              Ticket d'Encaissement
            </span>
          </div>
          <span className="text-xs font-bold text-white/90">
            {customerQuery.trim() || 'Client de Passage'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-brand-pale">
          <span>Article : {currentProduct?.name}</span>
          <span className="font-bold">{quantity} unité(s)</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-white/80">Net à encaisser</span>
          <span className="text-2xl font-display font-black text-white">
            {formatFCFA(finalTotal)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Vente Express (POS)"
      subtitle="Assistant rapide d'encaissement et de fidélisation client"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <WizardStepper
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={(index) => {
            if (index === 0 || validateStep1()) {
              setCurrentStepIndex(index);
            }
          }}
          maxAccessibleStepIndex={currentStepIndex}
        />

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {currentStepIndex === 0 && renderStep1()}
              {currentStepIndex === 1 && renderStep2()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {currentStepIndex > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handlePrev}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Précédent
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Annuler
            </Button>
          )}

          <div className="flex items-center gap-2">
            {currentStepIndex === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={products.length === 0}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="shadow-sm"
              >
                Continuer
              </Button>
            ) : (
              <Button
                type="submit"
                variant="vibrant"
                size="lg"
                isLoading={isSubmitting}
                icon={<CheckCircle className="w-4 h-4" />}
                className="font-display font-black text-base shadow-md"
              >
                Encaisser {formatFCFA(finalTotal)}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
