import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { WizardStepper, WizardStep } from '../common/WizardStepper';
import { RawMaterial, db } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { Save, Trash2, Tag, Coins, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface RawMaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: RawMaterial | null;
}

const COMMON_UNITS = [
  { label: 'Kilogramme', short: 'kg', value: 'kg' },
  { label: 'Gramme', short: 'g', value: 'g' },
  { label: 'Litre', short: 'L', value: 'L' },
  { label: 'Millilitre', short: 'ml', value: 'ml' },
  { label: 'Unité (pièce)', short: 'u', value: 'unité' },
  { label: 'Sac', short: 'sac', value: 'sac' },
  { label: 'Paquet / Carton', short: 'pqt', value: 'paquet' },
];

const SUGGESTIONS = [
  'Fleurs d\'Hibiscus séchées (Bissap)',
  'Gingembre frais',
  'Sucre raffiné',
  'Beurre de Karité brut',
  'Huile d\'Olive extra vierge',
  'Bouteille en verre 33cl',
  'Sachet Kraft zippé 250g'
];

export const RawMaterialFormModal: React.FC<RawMaterialFormModalProps> = ({
  isOpen,
  onClose,
  materialToEdit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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
    setCurrentStepIndex(0);
    setError(null);
  }, [materialToEdit, isOpen]);

  const steps: WizardStep[] = [
    {
      id: 'identification',
      title: 'Identification & Unité',
      shortTitle: '1. Identification',
      description: 'Nom & Type d\'unité',
      icon: <Tag className="w-4 h-4" />
    },
    {
      id: 'pricing',
      title: 'Tarification & Stock',
      shortTitle: '2. Coût & Stock',
      description: 'Prix d\'achat & Réserves',
      icon: <Coins className="w-4 h-4" />
    }
  ];

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Veuillez renseigner le nom de la matière première.');
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
    if (!name.trim()) {
      setCurrentStepIndex(0);
      setError('Veuillez renseigner le nom de la matière première.');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      setCurrentStepIndex(1);
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

  // Step 1: Identification
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy">
          Désignation de la Matière Première
        </h4>
        <p className="text-xs text-slate-500">
          Identifiez l'ingrédient ou l'intrant que vous achetez auprès de vos fournisseurs.
        </p>
      </div>

      <Input
        label="Nom de l'intrant / ingrédient"
        placeholder="Ex: Fleurs de Bissap, Sucre blanc, Huile de palme..."
        value={name}
        onChange={e => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        required
        autoFocus
      />

      {/* Quick suggestions */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          Exemples courants :
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-brand-pale text-slate-700 hover:text-brand-navy font-medium transition-colors border border-slate-200/60"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Unit Selector Pills */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-brand-navy tracking-wide uppercase">
          Unité de mesure d'achat
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COMMON_UNITS.map(u => {
            const isSelected = unit === u.value;
            return (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                className={clsx(
                  'p-2.5 rounded-xl border text-left transition-all text-xs font-bold flex flex-col justify-between',
                  isSelected
                    ? 'border-brand-primary bg-brand-pale/60 text-brand-navy ring-2 ring-brand-primary/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                )}
              >
                <span className="text-[10px] text-slate-400 font-semibold">{u.short}</span>
                <span className="mt-1 truncate">{u.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Step 2: Pricing & Stock
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy">
          Coût d'Achat & Gestion des Stocks
        </h4>
        <p className="text-xs text-slate-500">
          Précisez le prix payé par <strong className="text-brand-navy">{unit}</strong> pour le calcul automatisé de vos recettes.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-brand-pale/30 border border-brand-subtle/40 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Matière première
          </span>
          <p className="text-sm font-display font-black text-brand-navy">
            {name || 'Matière sans nom'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Unité retenue
          </span>
          <p className="text-sm font-bold text-brand-primary">
            {unit}
          </p>
        </div>
      </div>

      <Input
        label={`Coût d'achat par ${unit}`}
        type="number"
        min="0"
        step="any"
        placeholder="Ex: 1500"
        suffix="FCFA"
        value={unitCost}
        onChange={e => {
          setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value));
          if (error) setError(null);
        }}
        helperText={`Prix payé au fournisseur pour obtenir 1 ${unit} de cette matière.`}
        required
        autoFocus
      />

      <Input
        label={`Quantité actuellement en stock (en ${unit}) - Optionnel`}
        type="number"
        min="0"
        step="any"
        placeholder="Ex: 25"
        suffix={unit}
        value={stockQty}
        onChange={e => setStockQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
        helperText="Permet d'anticiper vos réapprovisionnements et d'éviter les ruptures de fabrication."
      />

      {unitCost !== '' && Number(unitCost) > 0 && (
        <div className="p-3 bg-white rounded-2xl border border-brand-subtle flex items-center justify-between text-xs shadow-xs">
          <span className="text-slate-600 font-medium">Coût de référence unitaire :</span>
          <span className="font-display font-black text-sm text-brand-navy">
            {formatFCFA(Number(unitCost))} / {unit}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={materialToEdit ? 'Modifier la Matière Première' : 'Nouvelle Matière Première (Intrant)'}
      subtitle="Assistant pour enregistrer vos coûts d'achat et suivre vos stocks d'ingrédients"
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
          ) : materialToEdit?.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-brand-alert hover:text-brand-alertDark font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
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
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="shadow-sm"
              >
                Continuer
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={materialToEdit ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                className="font-display font-black text-sm shadow-md"
              >
                {materialToEdit ? 'Enregistrer les modifications' : 'Créer la matière première'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
