import React, { useState } from 'react';
import { db, RawMaterial } from '../../db/db';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatFCFA } from '../../services/calculationService';
import { Plus, X, Sparkles } from 'lucide-react';

const COMMON_UNITS = [
  { label: 'Kilogramme (kg)', value: 'kg' },
  { label: 'Gramme (g)', value: 'g' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Millilitre (ml)', value: 'ml' },
  { label: 'Unité (pièce)', value: 'unité' },
  { label: 'Sac', value: 'sac' },
  { label: 'Paquet / Carton', value: 'paquet' },
];

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
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [stockQty, setStockQty] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom de la matière.');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      setError('Veuillez indiquer un coût d\'achat valide (>= 0 FCFA).');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const payload: Omit<RawMaterial, 'id'> = {
        name: name.trim(),
        unit: unit.trim(),
        unitCost: Number(unitCost),
        stockQty: Number(stockQty) || 0,
        updatedAt: now,
      };

      const newId = await db.rawMaterials.add(payload as RawMaterial);
      const created: RawMaterial = { ...payload, id: Number(newId) };

      setName('');
      setUnit('kg');
      setUnitCost('');
      setStockQty('');
      setError(null);

      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Error adding quick raw material:', err);
      setError('Erreur lors de la création de la matière première.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-pale/60 to-white border-2 border-brand-vibrant/30 space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-vibrant text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">
              Créer une nouvelle matière première
            </h4>
            <p className="text-[11px] text-slate-500">
              L'intrant sera automatiquement enregistré et ajouté à votre recette
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Nom de la matière"
            placeholder="Ex: Feuilles de Bissap, Sucre roux, Huile d'Argan..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
            Unité d'achat
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
          >
            {COMMON_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={`Coût d'achat par ${unit}`}
          type="number"
          min="0"
          step="any"
          placeholder="Ex: 1500"
          suffix="FCFA"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
          required
        />

        <div className="sm:col-span-2">
          <Input
            label={`Stock initial disponible (en ${unit}) - Optionnel`}
            type="number"
            min="0"
            step="any"
            placeholder="Ex: 10"
            suffix={unit}
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
          />
        </div>
      </div>

      {unitCost !== '' && Number(unitCost) > 0 && (
        <div className="p-2.5 rounded-xl bg-white border border-brand-subtle/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Prix unitaire configuré :</span>
          <span className="font-bold text-brand-navy">
            {formatFCFA(Number(unitCost))} / {unit}
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleSubmit}
        >
          Créer et insérer dans la recette
        </Button>
      </div>
    </div>
  );
};
