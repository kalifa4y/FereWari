import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { WizardStepper, WizardStep } from '../common/WizardStepper';
import { QuickAddMaterialDrawer } from '../materials/QuickAddMaterialDrawer';
import { Product, RecipeItem, RawMaterial, db } from '../../db/db';
import { calculateProductCRU, formatFCFA, formatPercent } from '../../services/calculationService';
import { CostBreakdownChart } from './CostBreakdownChart';
import { MarginGauge } from './MarginGauge';
import {
  Tag,
  FlaskConical,
  Package,
  BarChart3,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  rawMaterials: RawMaterial[];
}

const QUICK_SUGGESTIONS = [
  'Jus de Bissap Menthe 33cl',
  'Jus de Gingembre 50cl',
  'Baume Karité Naturel 100g',
  'Savon Artisanal Neem 150g',
  'Farine de Mil Tamisée 1kg',
  'Huile de Baobab Pure 50ml'
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  rawMaterials
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [packagingCost, setPackagingCost] = useState<number | ''>('');
  const [transportCost, setTransportCost] = useState<number | ''>('');
  const [otherCosts, setOtherCosts] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Map of raw materials for fast O(1) lookup
  const materialsMap = useMemo(() => {
    const map = new Map<number, RawMaterial>();
    rawMaterials.forEach(m => {
      if (m.id) map.set(m.id, m);
    });
    return map;
  }, [rawMaterials]);

  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setName(productToEdit.name);
      setSellingPrice(productToEdit.sellingPrice);
      setPackagingCost(productToEdit.packagingCost);
      setTransportCost(productToEdit.transportCost);
      setOtherCosts(productToEdit.otherCosts);
      setIngredients(productToEdit.ingredients || []);
    } else {
      setName('');
      setSellingPrice('');
      setPackagingCost('');
      setTransportCost('');
      setOtherCosts('');
      if (rawMaterials.length > 0 && rawMaterials[0].id) {
        setIngredients([{ rawMaterialId: rawMaterials[0].id, quantity: 1 }]);
      } else {
        setIngredients([]);
      }
    }
    setCurrentStepIndex(0);
    setError(null);
    setIsQuickAddOpen(false);
  }, [productToEdit, isOpen]);

  // Live calculation of CRU & Margins
  const breakdown = useMemo(() => {
    return calculateProductCRU(
      {
        packagingCost: Number(packagingCost) || 0,
        transportCost: Number(transportCost) || 0,
        otherCosts: Number(otherCosts) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        ingredients
      },
      materialsMap
    );
  }, [packagingCost, transportCost, otherCosts, sellingPrice, ingredients, materialsMap]);

  const steps: WizardStep[] = [
    {
      id: 'identity',
      title: 'Identité du Produit',
      shortTitle: '1. Identité',
      description: 'Nom & Prix cible',
      icon: <Tag className="w-4 h-4" />
    },
    {
      id: 'ingredients',
      title: 'Matières Premières (BOM)',
      shortTitle: '2. Ingrédients',
      description: 'Formule & Dosage',
      icon: <FlaskConical className="w-4 h-4" />
    },
    {
      id: 'overheads',
      title: 'Frais & Charges',
      shortTitle: '3. Frais Annexes',
      description: 'Emballage & Transport',
      icon: <Package className="w-4 h-4" />
    },
    {
      id: 'margin',
      title: 'Rentabilité & Validation',
      shortTitle: '4. Rentabilité',
      description: 'Bilan CRU & Marges',
      icon: <BarChart3 className="w-4 h-4" />
    }
  ];

  // Quick add / remove handlers
  const handleAddIngredient = () => {
    setError(null);
    if (rawMaterials.length === 0) {
      // If no raw materials in DB, open the quick creation drawer automatically!
      setIsQuickAddOpen(true);
      return;
    }
    const firstId = rawMaterials[0].id!;
    setIngredients([...ingredients, { rawMaterialId: firstId, quantity: 1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeItem, value: any) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  const handleQuickMaterialCreated = (newMaterial: RawMaterial) => {
    if (newMaterial.id) {
      setIngredients([...ingredients, { rawMaterialId: newMaterial.id, quantity: 1 }]);
    }
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStepIndex === 0) {
      if (!name.trim()) {
        setError('Veuillez renseigner le nom du produit fini.');
        return false;
      }
      if (sellingPrice === '' || Number(sellingPrice) <= 0) {
        setError('Veuillez indiquer un prix de vente conseillé valide (> 0 FCFA).');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCurrentStepIndex(0);
      setError('Veuillez renseigner le nom du produit fini.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) <= 0) {
      setCurrentStepIndex(0);
      setError('Veuillez indiquer un prix de vente valide (> 0 FCFA).');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const payload: Omit<Product, 'id'> = {
        name: name.trim(),
        sellingPrice: Number(sellingPrice),
        packagingCost: Number(packagingCost) || 0,
        transportCost: Number(transportCost) || 0,
        otherCosts: Number(otherCosts) || 0,
        ingredients,
        calculatedUnitCost: Math.round(breakdown.totalUnitCost),
        updatedAt: now
      };

      if (productToEdit?.id) {
        await db.products.update(productToEdit.id, payload);
      } else {
        await db.products.add(payload as Product);
      }

      onClose();
    } catch (err) {
      console.error('Error saving product recipe:', err);
      setError('Une erreur est survenue lors de l\'enregistrement de la recette.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToEdit?.id) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la recette "${productToEdit.name}" ?`)) {
      await db.products.delete(productToEdit.id);
      onClose();
    }
  };

  // Step 1: Identity & Selling Price
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy">
          Identité & Prix de Vente Cible
        </h4>
        <p className="text-xs text-slate-500">
          Donnez un nom clair à votre produit fini et définissez votre prix de vente au client.
        </p>
      </div>

      <Input
        label="Nom du produit fini"
        placeholder="Ex: Jus de Bissap Menthe 33cl, Baume Karité..."
        value={name}
        onChange={e => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        required
        autoFocus
      />

      {/* Quick suggestions pills */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          Suggestions rapides :
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SUGGESTIONS.map(s => (
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

      <div className="pt-2 border-t border-slate-100">
        <Input
          label="Prix de Vente Conseillé (au client final)"
          type="number"
          min="0"
          step="any"
          placeholder="Ex: 700"
          suffix="FCFA"
          value={sellingPrice}
          onChange={e => {
            setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
            if (error) setError(null);
          }}
          helperText="Le prix auquel vous vendez 1 unité de ce produit à vos clients."
          required
        />
      </div>

      {sellingPrice !== '' && Number(sellingPrice) > 0 && (
        <div className="p-3 rounded-2xl bg-brand-pale/40 border border-brand-subtle/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Prix unitaire cible :</span>
          <span className="text-sm font-display font-black text-brand-navy">
            {formatFCFA(Number(sellingPrice))}
          </span>
        </div>
      )}
    </div>
  );

  // Step 2: BOM / Raw Materials
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-display font-black text-brand-navy flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-brand-vibrant" />
            Matières Premières & Ingrédients (BOM)
          </h4>
          <p className="text-xs text-slate-500">
            Dosez les ingrédients consommés pour fabriquer <strong className="text-brand-navy">1 unité</strong> de produit fini.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
            icon={<Sparkles className="w-3.5 h-3.5 text-brand-vibrant" />}
          >
            Nouvel intrant
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddIngredient}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Ajouter un ingrédient
          </Button>
        </div>
      </div>

      {/* Quick Add Inline Drawer */}
      <QuickAddMaterialDrawer
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCreated={handleQuickMaterialCreated}
      />

      {/* Empty State when no raw materials in database */}
      {rawMaterials.length === 0 ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-pale/40 via-white to-brand-pale/20 border-2 border-dashed border-brand-vibrant/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-vibrant/10 text-brand-vibrant flex items-center justify-center mx-auto shadow-inner">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-display font-black text-brand-navy">
              Aucune matière première enregistrée
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Pour composer une recette, créez vos intrants de base (fleurs de bissap, sucre, flacons, huiles) avec leur coût d'achat.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsQuickAddOpen(true)}
            className="shadow-sm"
          >
            Créer mon premier ingrédient
          </Button>
        </div>
      ) : ingredients.length === 0 ? (
        /* Empty State when no ingredients added in current recipe */
        <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Aucun ingrédient dans cette recette pour le moment.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleAddIngredient}
          >
            Ajouter un ingrédient de votre stock
          </Button>
        </div>
      ) : (
        /* Ingredients List */
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {ingredients.map((item, idx) => {
            const material = materialsMap.get(item.rawMaterialId);
            const subtotal = material ? (Number(item.quantity) || 0) * material.unitCost : 0;

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-subtle shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors"
              >
                {/* Material Select */}
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Matière Première
                  </label>
                  <select
                    value={item.rawMaterialId}
                    onChange={e => handleIngredientChange(idx, 'rawMaterialId', parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-brand-navy focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 shadow-xs"
                  >
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {formatFCFA(m.unitCost)} / {m.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity input with unit */}
                <div className="w-full sm:w-32">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Quantité ({material?.unit || 'u'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={e => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-900 pr-9 focus:border-brand-vibrant focus:outline-none shadow-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                      {material?.unit || 'u'}
                    </span>
                  </div>
                </div>

                {/* Subtotal & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-4 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Coût</span>
                    <span className="text-xs font-black text-brand-primary">
                      {formatFCFA(subtotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-alert hover:bg-red-50 transition-colors"
                    title="Retirer cet ingrédient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Step Summary */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-primary text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[11px] text-brand-subtle font-medium block">
            Sous-total Matières Premières (BOM)
          </span>
          <p className="text-lg font-display font-black">
            {formatFCFA(breakdown.rawMaterialsCost)}
          </p>
        </div>
        <div className="text-right text-xs font-medium text-brand-pale">
          <span>{ingredients.length} ingrédient(s)</span>
          {Number(sellingPrice) > 0 && (
            <p className="text-[11px] opacity-80">
              {formatPercent((breakdown.rawMaterialsCost / Number(sellingPrice)) * 100)} du prix cible
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Overheads & Packaging
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy flex items-center gap-1.5">
          <Package className="w-4 h-4 text-brand-vibrant" />
          Frais Annexes & Charges de Fabrication
        </h4>
        <p className="text-xs text-slate-500">
          Les coûts additionnels indispensables pour conditionner et acheminer chaque unité de produit fini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Input
            label="Emballage"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            suffix="FCFA"
            value={packagingCost}
            onChange={e => setPackagingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
            helperText="Bouteille, bouchon, étiquette, sachet..."
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Input
            label="Transport & Livraison"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            suffix="FCFA"
            value={transportCost}
            onChange={e => setTransportCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
            helperText="Frais logistiques par unité"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Input
            label="Autres / Main d'œuvre"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            suffix="FCFA"
            value={otherCosts}
            onChange={e => setOtherCosts(e.target.value === '' ? '' : parseFloat(e.target.value))}
            helperText="Temps de travail, énergie, gaz..."
          />
        </div>
      </div>

      {/* Overheads Summary */}
      <div className="p-3 rounded-2xl bg-brand-pale/40 border border-brand-subtle/50 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-semibold">Total Frais Annexes par unité :</span>
        <span className="font-display font-black text-sm text-brand-navy">
          {formatFCFA(
            (Number(packagingCost) || 0) +
            (Number(transportCost) || 0) +
            (Number(otherCosts) || 0)
          )}
        </span>
      </div>
    </div>
  );

  // Step 4: Profitability & Validation
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-display font-black text-brand-navy flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-brand-vibrant" />
          Synthèse Économique & Marges de Rentabilité
        </h4>
        <p className="text-xs text-slate-500">
          Vérifiez vos indicateurs avant d'enregistrer la fiche recette dans votre catalogue.
        </p>
      </div>

      {/* Executive KPI summary */}
      <div className="p-3.5 rounded-2xl bg-brand-pale/30 border border-brand-subtle/40 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Produit fini
          </span>
          <p className="text-base font-display font-black text-brand-navy">
            {name || 'Produit sans nom'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Prix de vente
          </span>
          <p className="text-base font-display font-black text-brand-primary">
            {formatFCFA(Number(sellingPrice) || 0)}
          </p>
        </div>
      </div>

      {/* Margin Gauge */}
      <MarginGauge
        sellingPrice={Number(sellingPrice) || 0}
        calculatedUnitCost={breakdown.totalUnitCost}
        grossMarginAmount={breakdown.grossMarginAmount}
        grossMarginPercentage={breakdown.grossMarginPercentage}
      />

      {/* Cost Breakdown Chart */}
      <CostBreakdownChart breakdown={breakdown} />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Modifier la Fiche Recette' : 'Nouvelle Fiche Recette (BOM)'}
      subtitle="Assistant étape par étape pour calculer instantanément votre Coût de Revient Unitaire"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Wizard Stepper Header */}
        <WizardStepper
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={(index) => {
            if (index < currentStepIndex || validateCurrentStep()) {
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

        {/* Step Animated Body */}
        <div className="min-h-[280px]">
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
              {currentStepIndex === 2 && renderStep3()}
              {currentStepIndex === 3 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Wizard Footer / Navigation Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Delete (if editing) or Back button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
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
            ) : productToEdit?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-brand-alert hover:text-brand-alertDark font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="sm:hidden"
            >
              Fermer
            </Button>
          </div>

          {/* Center: Live Margin Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-brand-navy">
            <span>CRU : {formatFCFA(breakdown.totalUnitCost)}</span>
            <span className="text-slate-300">|</span>
            <span className={breakdown.grossMarginAmount < 0 ? 'text-brand-alert' : 'text-emerald-600'}>
              Marge : {formatPercent(breakdown.grossMarginPercentage)}
            </span>
          </div>

          {/* Right: Next or Submit button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="hidden sm:inline-flex"
            >
              Annuler
            </Button>

            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="w-full sm:w-auto shadow-sm"
              >
                Continuer
              </Button>
            ) : (
              <Button
                type="submit"
                variant="vibrant"
                size="md"
                isLoading={isSubmitting}
                icon={productToEdit ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                className="w-full sm:w-auto font-display font-black text-base shadow-md"
              >
                {productToEdit ? 'Enregistrer les modifications' : 'Valider & Créer la recette'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
