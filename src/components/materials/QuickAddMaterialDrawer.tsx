import React, { useState } from 'react';
import { db, RawMaterial } from '../../db/db';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { MATERIAL_UNITS, parseAmount } from './RawMaterialFormModal';
import { Plus, X, ChevronDown, AlertTriangle } from 'lucide-react';

interface QuickAddMaterialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newMaterial: RawMaterial) => void;
}

export const QuickAddMaterialDrawer: React.FC<QuickAddMaterialDrawerProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [priceInput, setPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const price = parseAmount(priceInput);
  const stock = parseAmount(stockInput);

  const reset = () => {
    setName('');
    setUnit('kg');
    setPriceInput('');
    setStockInput('');
    setError(null);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (isSubmitting) return;
    if (!name.trim()) {
      setError('Indiquez le nom de l\'ingrédient.');
      document.getElementById('quick-material-name')?.focus();
      return;
    }
    if (price === null || Number.isNaN(price)) {
      setError(price === null ? 'Indiquez le prix d\'achat.' : 'Indiquez un prix valide (0 ou plus).');
      document.getElementById('quick-material-price')?.focus();
      return;
    }
    if (stock !== null && Number.isNaN(stock)) {
      setError('Indiquez une quantité de stock valide (0 ou plus).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<RawMaterial, 'id'> = {
        name: name.trim(),
        unit: unit.trim(),
        unitCost: price,
        stockQty: stock ?? 0,
        updatedAt: new Date(),
      };

      const newId = await db.rawMaterials.add(payload as RawMaterial);
      const created: RawMaterial = { ...payload, id: Number(newId) };

      reset();
      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Error adding quick raw material:', err);
      setError('L\'enregistrement a échoué. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // This panel is rendered inside the product form: Enter must create the
  // ingredient instead of submitting the whole product.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      void handleCreate();
    }
  };

  return (
    <div
      role="group"
      aria-labelledby="quick-material-title"
      onKeyDown={handleKeyDown}
      className="p-4 rounded-2xl bg-brand-pale/30 border-2 border-brand-vibrant/30 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h5 id="quick-material-title" className="text-sm font-display font-black text-brand-navy">
          Nouvel ingrédient
        </h5>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Fermer"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div role="alert" className="p-2.5 rounded-xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            id="quick-material-name"
            label="Nom de l'ingrédient"
            placeholder="Ex : Sucre, Huile, Karité"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label htmlFor="quick-material-unit" className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
            Unité d'achat
          </label>
          <select
            id="quick-material-unit"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
          >
            {MATERIAL_UNITS.map(u => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="quick-material-price"
          label={`Prix d'achat (pour 1 ${unit})`}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder="Ex : 1500"
          suffix="FCFA"
          value={priceInput}
          onChange={e => setPriceInput(e.target.value)}
          required
        />
      </div>

      {price === 0 && (
        <p className="text-xs font-medium text-amber-800 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Prix à 0 FCFA : le coût de fabrication sera faux tant que le prix n'est pas renseigné.</span>
        </p>
      )}

      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
          <span>Suivre mon stock</span>
          <span className="flex items-center gap-2 text-xs font-normal text-slate-500">
            Facultatif
            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="px-3 pb-3 pt-1">
          <Input
            id="quick-material-stock"
            label="Quantité disponible"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Ex : 10"
            suffix={unit}
            value={stockInput}
            onChange={e => setStockInput(e.target.value)}
          />
        </div>
      </details>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="md" onClick={handleCancel}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          icon={<Plus className="w-4 h-4" />}
          onClick={handleCreate}
        >
          Ajouter à la recette
        </Button>
      </div>
    </div>
  );
};
