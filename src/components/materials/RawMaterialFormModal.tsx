import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { RawMaterial, db } from '../../db/db';
import { Save, Trash2, Plus, ChevronDown, AlertCircle, AlertTriangle } from 'lucide-react';

interface RawMaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: RawMaterial | null;
}

// Stored values must stay unchanged: recipes and existing data rely on them.
export const MATERIAL_UNITS = [
  { label: 'Kilogramme (kg)', value: 'kg' },
  { label: 'Gramme (g)', value: 'g' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Millilitre (ml)', value: 'ml' },
  { label: 'Unité (pièce)', value: 'unité' },
  { label: 'Sac', value: 'sac' },
  { label: 'Paquet / Carton', value: 'paquet' },
];

/**
 * Parses a user-typed amount.
 * Returns null when the field is empty, NaN when the value is negative or not finite.
 */
export const parseAmount = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
};

const selectClass =
  'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20';

export const RawMaterialFormModal: React.FC<RawMaterialFormModalProps> = ({
  isOpen,
  onClose,
  materialToEdit
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [priceInput, setPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [stockTouched, setStockTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name);
      setUnit(materialToEdit.unit);
      setPriceInput(Number.isFinite(materialToEdit.unitCost) ? String(materialToEdit.unitCost) : '');
      setStockInput(materialToEdit.stockQty > 0 ? String(materialToEdit.stockQty) : '');
    } else {
      setName('');
      setUnit('kg');
      setPriceInput('');
      setStockInput('');
    }
    setStockTouched(false);
    setNameError(null);
    setPriceError(null);
    setStockError(null);
    setFormError(null);
  }, [materialToEdit, isOpen]);

  const isEditing = Boolean(materialToEdit?.id);
  const price = parseAmount(priceInput);
  const stock = parseAmount(stockInput);

  // Keep a legacy/imported unit selectable so it is never silently replaced.
  const unitOptions =
    materialToEdit && !MATERIAL_UNITS.some(u => u.value === materialToEdit.unit)
      ? [...MATERIAL_UNITS, { label: materialToEdit.unit, value: materialToEdit.unit }]
      : MATERIAL_UNITS;

  const unitChanged = Boolean(materialToEdit && unit !== materialToEdit.unit);
  const stockOpenByDefault = Boolean(materialToEdit && materialToEdit.stockQty > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nextNameError = name.trim() ? null : 'Indiquez le nom de l\'ingrédient.';
    const nextPriceError =
      price === null
        ? 'Indiquez le prix d\'achat.'
        : Number.isNaN(price)
          ? 'Indiquez un prix valide (0 ou plus).'
          : null;
    const nextStockError = stock !== null && Number.isNaN(stock) ? 'Indiquez une quantité valide (0 ou plus).' : null;

    setNameError(nextNameError);
    setPriceError(nextPriceError);
    setStockError(nextStockError);

    if (nextNameError || nextPriceError || nextStockError) {
      const firstInvalidId = nextNameError ? 'material-name' : nextPriceError ? 'material-price' : 'material-stock';
      if (firstInvalidId === 'material-stock') {
        const details = document.getElementById('material-stock-section') as HTMLDetailsElement | null;
        if (details) details.open = true;
      }
      document.getElementById(firstInvalidId)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();

      if (materialToEdit?.id) {
        const changes: Partial<RawMaterial> = {
          name: name.trim(),
          unit: unit.trim(),
          unitCost: price as number,
          updatedAt: now
        };
        // Only write the stock when the artisan actually entered a value:
        // an untouched or emptied field keeps the stock stored in the database.
        if (stockTouched && stock !== null) {
          changes.stockQty = stock;
        }
        const updated = await db.rawMaterials.update(materialToEdit.id, changes);
        if (updated === 0) {
          setFormError('Cet ingrédient n\'existe plus. Fermez le formulaire et réessayez.');
          return;
        }
      } else {
        const payload: Omit<RawMaterial, 'id'> = {
          name: name.trim(),
          unit: unit.trim(),
          unitCost: price as number,
          stockQty: stock ?? 0,
          updatedAt: now
        };
        await db.rawMaterials.add(payload as RawMaterial);
      }

      onClose();
    } catch (err) {
      console.error('Error saving raw material:', err);
      setFormError('L\'enregistrement a échoué. Vos saisies sont conservées, réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToEdit?.id) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${materialToEdit.name}" ?`)) return;
    try {
      await db.rawMaterials.delete(materialToEdit.id);
      onClose();
    } catch (err) {
      console.error('Error deleting raw material:', err);
      setFormError('La suppression a échoué. Réessayez.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          id="material-name"
          label="Nom de l'ingrédient"
          placeholder="Ex : Sucre, Huile, Karité"
          value={name}
          onChange={e => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          error={nameError ?? undefined}
          required
          autoFocus={!isEditing}
        />

        <div className="space-y-1.5">
          <label htmlFor="material-unit" className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
            Unité d'achat
          </label>
          <select id="material-unit" value={unit} onChange={e => setUnit(e.target.value)} className={selectClass}>
            {unitOptions.map(u => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          {unitChanged && (
            <p className="text-xs font-medium text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Les recettes qui utilisent cet ingrédient gardent les mêmes quantités. Vérifiez-les.</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Input
            id="material-price"
            label={`Prix d'achat (pour 1 ${unit})`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Ex : 1500"
            suffix="FCFA"
            value={priceInput}
            onChange={e => {
              setPriceInput(e.target.value);
              if (priceError) setPriceError(null);
            }}
            error={priceError ?? undefined}
            helperText={`Le prix que vous payez pour 1 ${unit}.`}
            required
          />
          {price === 0 && (
            <p className="text-xs font-medium text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Prix à 0 FCFA : le coût de fabrication de vos produits sera faux tant que le prix n'est pas renseigné.
              </span>
            </p>
          )}
        </div>

        <details id="material-stock-section" open={stockOpenByDefault} className="group rounded-2xl border border-slate-200">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-display font-black text-brand-navy">Suivre mon stock</span>
            <span className="flex items-center gap-2 shrink-0 text-sm">
              {stock !== null && !Number.isNaN(stock) ? (
                <span className="font-bold text-brand-navy">
                  {stock} {unit}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Facultatif</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="px-4 pb-4 pt-1">
            <Input
              id="material-stock"
              label="Quantité disponible"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="Ex : 10"
              suffix={unit}
              value={stockInput}
              onChange={e => {
                setStockInput(e.target.value);
                setStockTouched(true);
                if (stockError) setStockError(null);
              }}
              error={stockError ?? undefined}
              helperText={
                isEditing
                  ? 'Laissez vide pour garder le stock actuel. Tapez 0 si vous n\'en avez plus.'
                  : `Combien de ${unit} vous avez aujourd'hui.`
              }
            />
          </div>
        </details>

        {formError && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* On mobile the primary action sits on top and delete at the very bottom. */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="sm:mr-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-semibold text-brand-alert hover:text-brand-alertDark hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-alert/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          )}
          <Button type="button" variant="ghost" size="md" onClick={onClose} className={isEditing ? '' : 'sm:ml-auto'}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            icon={isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Enregistrer les modifications' : 'Enregistrer l\'ingrédient'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
