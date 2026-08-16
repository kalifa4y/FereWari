import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { RawMaterial, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { Save, Trash2 } from 'lucide-react';

interface RawMaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: RawMaterial | null;
}

const COMMON_UNITS = [
  { label: 'Kilogramme (kg)', value: 'kg' },
  { label: 'Gramme (g)', value: 'g' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Millilitre (ml)', value: 'ml' },
  { label: 'Unité (pièce)', value: 'unité' },
  { label: 'Sac', value: 'sac' },
  { label: 'Paquet / Carton', value: 'paquet' },
];

export const RawMaterialFormModal: React.FC<RawMaterialFormModalProps> = ({
  isOpen,
  onClose,
  materialToEdit
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [stockQty, setStockQty] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name);
      setUnit(materialToEdit.unit);
      setUnitCost(materialToEdit.unitCost);
      setStockQty(materialToEdit.stockQty);
    } else {
      setName('');
      setUnit('kg');
      setUnitCost('');
      setStockQty('');
    }
    setError(null);
  }, [materialToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom de la matière première.');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      setError('Veuillez indiquer un coût unitaire valide (>= 0 FCFA).');
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
        updatedAt: now
      };

      if (materialToEdit?.id) {
        await db.rawMaterials.update(materialToEdit.id, payload);
      } else {
        await db.rawMaterials.add(payload as RawMaterial);
      }

      onClose();
    } catch (err) {
      console.error('Error saving raw material:', err);
      setError('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToEdit?.id) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${materialToEdit.name}" ?`)) {
      await db.rawMaterials.delete(materialToEdit.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={materialToEdit ? 'Modifier la Matière Première' : 'Nouvelle Matière Première (Intrant)'}
      subtitle="Enregistrez vos achats d'ingrédients et coûts unitaires pour le calcul automatique de vos recettes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert">
            {error}
          </div>
        )}

        {/* Name */}
        <Input
          label="Nom de l'intrant / ingrédient"
          placeholder="Ex: Fleurs d'Hibiscus séchées, Bouteilles 33cl..."
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        {/* Unit & Unit Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Unit Select */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
              Unité d'achat
            </label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
            >
              {COMMON_UNITS.map(u => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Cost */}
          <Input
            label={`Coût d'achat par ${unit}`}
            type="number"
            min="0"
            step="any"
            placeholder="Ex: 1500"
            suffix="FCFA"
            value={unitCost}
            onChange={e => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
            required
          />
        </div>

        {/* Stock Quantity */}
        <Input
          label={`Stock disponible en stock (en ${unit})`}
          type="number"
          min="0"
          step="any"
          placeholder="Ex: 50"
          suffix={unit}
          value={stockQty}
          onChange={e => setStockQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
          helperText="Permet de garder un œil sur vos réserves pour éviter les ruptures de fabrication."
        />

        {/* Preview Badge */}
        {unitCost !== '' && Number(unitCost) > 0 && (
          <div className="p-3 bg-brand-pale/40 rounded-xl border border-brand-subtle/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Coût de base unitaire :</span>
            <span className="font-bold text-brand-navy">
              {formatFCFA(Number(unitCost))} / {unit}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
          {materialToEdit?.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-brand-alert hover:text-brand-alertDark font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              {materialToEdit ? 'Enregistrer' : 'Créer l\'intrant'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
