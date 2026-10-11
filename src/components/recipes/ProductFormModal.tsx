import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { QuickAddMaterialDrawer } from '../materials/QuickAddMaterialDrawer';
import { Product, RecipeItem, RawMaterial, db } from '../../db/db';
import {
  calculateProductCRU,
  formatFCFA,
  formatPercent,
  getCompatibleUnits,
  getConversionFactor,
  normalizeUnit
} from '../../services/calculationService';
import { CostBreakdownChart } from './CostBreakdownChart';
import { MarginGauge } from './MarginGauge';
import { Plus, Trash2, Save, ChevronDown, AlertCircle, AlertTriangle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  rawMaterials: RawMaterial[];
}

type RecipeStatus = 'empty' | 'incomplete' | 'ready';

const parseAmount = (value: string): number | '' => (value === '' ? '' : parseFloat(value));

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  rawMaterials
}) => {
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [packagingCost, setPackagingCost] = useState<number | ''>('');
  const [transportCost, setTransportCost] = useState<number | ''>('');
  const [otherCosts, setOtherCosts] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      // A new recipe starts empty: the artisan picks every ingredient explicitly.
      setIngredients([]);
    }
    setNameError(null);
    setPriceError(null);
    setSaveError(null);
    setIsQuickAddOpen(false);
  }, [productToEdit, isOpen]);

  // Live calculation of unit cost & margins
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

  // The cost is only trustworthy when the calculation service marks it complete
  const recipeStatus: RecipeStatus =
    ingredients.length === 0 ? 'empty' : breakdown.isComplete ? 'ready' : 'incomplete';

  const hasPrice = Number(sellingPrice) > 0;
  const extraCostsTotal = breakdown.packagingCost + breakdown.transportCost + breakdown.otherCosts;
  const isLoss = hasPrice && breakdown.hasReliableMargin && breakdown.grossMarginAmount < 0;

  const handleAddIngredient = () => {
    if (rawMaterials.length === 0) {
      // No raw material in stock yet: open the quick creation form instead.
      setIsQuickAddOpen(true);
      return;
    }
    const first = rawMaterials[0];
    setIngredients(prev => [...prev, { rawMaterialId: first.id!, quantity: 1, unit: first.unit }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, newMaterialId: number) => {
    const newMaterial = materialsMap.get(newMaterialId);
    setIngredients(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const currentUnit = item.unit || materialsMap.get(item.rawMaterialId)?.unit || '';
        const newMaterialUnit = newMaterial ? newMaterial.unit : '';
        const isStillCompatible = getConversionFactor(currentUnit, newMaterialUnit) !== null;
        return {
          ...item,
          rawMaterialId: newMaterialId,
          unit: isStillCompatible ? currentUnit : newMaterialUnit
        };
      })
    );
  };

  const handleUnitChange = (index: number, newUnit: string) => {
    setIngredients(prev =>
      prev.map((item, i) => (i === index ? { ...item, unit: newUnit } : item))
    );
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    setIngredients(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
    );
  };

  const handleQuickMaterialCreated = (newMaterial: RawMaterial) => {
    if (newMaterial.id) {
      setIngredients(prev => [
        ...prev,
        { rawMaterialId: newMaterial.id!, quantity: 1, unit: newMaterial.unit }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const nextNameError = name.trim() ? null : 'Indiquez le nom du produit.';
    const nextPriceError =
      sellingPrice === '' || Number(sellingPrice) <= 0 ? 'Indiquez un prix de vente supérieur à 0 FCFA.' : null;
    setNameError(nextNameError);
    setPriceError(nextPriceError);

    if (nextNameError || nextPriceError) {
      document.getElementById(nextNameError ? 'product-name' : 'product-price')?.focus();
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
        calculatedUnitCost: breakdown.isComplete ? Math.round(breakdown.totalUnitCost) : 0,
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
      setSaveError('Une erreur est survenue lors de l\'enregistrement du produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToEdit?.id) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${productToEdit.name}" ?`)) {
      await db.products.delete(productToEdit.id);
      onClose();
    }
  };

  const sectionTitleClass = 'text-sm font-display font-black text-brand-navy';
  const fieldLabelClass = 'block text-[11px] font-semibold text-slate-500 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Modifier le produit' : 'Nouveau produit'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* A. Essentials */}
        <section className="space-y-3">
          <Input
            id="product-name"
            label="Nom du produit"
            placeholder="Ex : Jus de bissap 33cl"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            error={nameError ?? undefined}
            required
            autoFocus={!productToEdit}
          />
          <Input
            id="product-price"
            label="Prix de vente"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Ex : 700"
            suffix="FCFA"
            value={sellingPrice}
            onChange={e => {
              setSellingPrice(parseAmount(e.target.value));
              if (priceError) setPriceError(null);
            }}
            error={priceError ?? undefined}
            helperText="Le prix auquel vous vendez 1 unité."
            required
          />
        </section>

        {/* B. Ingredients */}
        <section aria-labelledby="product-ingredients-title" className="space-y-3">
          <div>
            <h4 id="product-ingredients-title" className={sectionTitleClass}>
              Ingrédients
            </h4>
            <p className="text-xs text-slate-500">Les quantités utilisées pour fabriquer 1 unité.</p>
          </div>

          {ingredients.length > 0 && (
            <ul className="space-y-2">
              {ingredients.map((item, idx) => {
                const material = materialsMap.get(item.rawMaterialId);
                const detail = breakdown.ingredientDetails[idx];
                const subtotal = detail ? detail.subtotal : 0;
                const invalid = !detail || !detail.isValid;
                const compatibleUnits = material ? getCompatibleUnits(material.unit) : [];
                const selectedUnit = item.unit || material?.unit || '';
                const isUnitDifferent = material && normalizeUnit(selectedUnit) !== normalizeUnit(material.unit);

                return (
                  <li
                    key={idx}
                    className={`p-3 rounded-2xl border space-y-2 ${
                      invalid ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor={`ingredient-material-${idx}`} className={fieldLabelClass}>
                            Matière
                          </label>
                          {material && isUnitDifferent && (
                            <span className="text-[10px] font-semibold text-slate-500">
                              Achat : {formatFCFA(material.unitCost)} / {material.unit}
                            </span>
                          )}
                        </div>
                        <select
                          id={`ingredient-material-${idx}`}
                          value={material ? item.rawMaterialId : ''}
                          onChange={e => handleMaterialChange(idx, parseInt(e.target.value, 10))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
                        >
                          {!material && (
                            <option value="" disabled>
                              Matière introuvable, choisissez-en une
                            </option>
                          )}
                          {rawMaterials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({formatFCFA(m.unitCost)} / {m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="w-24 sm:w-28">
                          <label htmlFor={`ingredient-quantity-${idx}`} className={fieldLabelClass}>
                            Quantité
                          </label>
                          <input
                            id={`ingredient-quantity-${idx}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={e => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20"
                          />
                        </div>

                        <div className="w-20 sm:w-24">
                          <label htmlFor={`ingredient-unit-${idx}`} className={fieldLabelClass}>
                            Unité
                          </label>
                          <select
                            id={`ingredient-unit-${idx}`}
                            value={selectedUnit}
                            onChange={e => handleUnitChange(idx, e.target.value)}
                            disabled={compatibleUnits.length <= 1}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm font-bold text-slate-900 focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 disabled:bg-slate-50 disabled:text-slate-500"
                          >
                            {compatibleUnits.map(u => (
                              <option key={u.value} value={u.value}>
                                {u.value}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 sm:flex-none sm:w-24 text-right pb-1">
                          <span className="block text-[11px] font-semibold text-slate-500">Coût</span>
                          <span className="text-sm font-bold text-brand-navy">{formatFCFA(subtotal)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-brand-alert hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-alert/30 transition-colors"
                          aria-label={`Retirer ${material?.name ?? 'cet ingrédient'}`}
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {invalid && (
                      <p className="text-xs font-medium text-amber-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          {detail?.error ||
                            (material
                              ? 'Indiquez une quantité supérieure à 0.'
                              : 'Cette matière n\'existe plus. Choisissez-en une autre ou retirez la ligne.')}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {rawMaterials.length === 0 && (
            <p className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-600">
              Vous n'avez encore aucune matière première. Créez-en une (sucre, farine, bouteille...) avec son prix
              d'achat pour l'ajouter à la recette.
            </p>
          )}

          <QuickAddMaterialDrawer
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            onCreated={handleQuickMaterialCreated}
          />

          {!isQuickAddOpen && (
            <div className="flex flex-wrap gap-2">
              {rawMaterials.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleAddIngredient}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Ajouter un ingrédient
                </Button>
              )}
              <Button
                type="button"
                variant={rawMaterials.length === 0 ? 'primary' : 'outline'}
                size="md"
                onClick={() => setIsQuickAddOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Nouvelle matière première
              </Button>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="font-semibold text-slate-600">Coût des ingrédients</span>
              <span className="font-display font-black text-brand-navy">
                {formatFCFA(breakdown.rawMaterialsCost)}
                {recipeStatus === 'incomplete' && (
                  <span className="ml-1 text-xs font-semibold text-amber-700">(à vérifier)</span>
                )}
              </span>
            </div>
          )}
        </section>

        {/* C. Extra costs (optional, collapsed by default) */}
        <details className="group rounded-2xl border border-slate-200">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
            <span>
              <span className={`block ${sectionTitleClass}`}>Frais supplémentaires</span>
              <span className="block text-xs text-slate-500">Emballage, transport, autres. Facultatif.</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              {extraCostsTotal > 0 && (
                <span className="text-sm font-bold text-brand-navy">{formatFCFA(extraCostsTotal)}</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pb-4 pt-1">
            <Input
              id="product-packaging"
              label="Emballage"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={packagingCost}
              onChange={e => setPackagingCost(parseAmount(e.target.value))}
              helperText="Bouteille, étiquette, sachet..."
            />
            <Input
              id="product-transport"
              label="Transport"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={transportCost}
              onChange={e => setTransportCost(parseAmount(e.target.value))}
              helperText="Par unité"
            />
            <Input
              id="product-other"
              label="Autres frais"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={otherCosts}
              onChange={e => setOtherCosts(parseAmount(e.target.value))}
              helperText="Main d'œuvre, gaz, électricité..."
            />
          </div>
        </details>

        {/* D. Result */}
        <section aria-labelledby="product-result-title" className="space-y-3">
          <h4 id="product-result-title" className={sectionTitleClass}>
            Résultat pour 1 unité
          </h4>

          {recipeStatus === 'empty' && (
            <p className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              Ajoutez au moins un ingrédient pour calculer le coût de fabrication.
            </p>
          )}

          {recipeStatus === 'incomplete' && (
            <p className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-sm font-medium text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Coût à vérifier : {breakdown.issues[0]?.message || 'un ingrédient est incomplet ou incompatible.'}
              </span>
            </p>
          )}

          {recipeStatus === 'ready' && (
            <>
              <dl className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="font-semibold text-slate-600">Coût de fabrication</dt>
                  <dd className="font-display font-black text-brand-navy">{formatFCFA(breakdown.totalUnitCost)}</dd>
                </div>
                {hasPrice && breakdown.hasReliableMargin ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="font-semibold text-slate-600">Gain estimé par unité</dt>
                      <dd className={`font-display font-black ${isLoss ? 'text-brand-alert' : 'text-emerald-700'}`}>
                        {formatFCFA(breakdown.grossMarginAmount)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="font-semibold text-slate-600">Marge</dt>
                      <dd className={`font-display font-black ${isLoss ? 'text-brand-alert' : 'text-emerald-700'}`}>
                        {formatPercent(breakdown.grossMarginPercentage)}
                      </dd>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-3">
                    <dt className="sr-only">Gain estimé par unité</dt>
                    <dd className="text-slate-500">Indiquez un prix de vente supérieur à 0 FCFA pour voir le gain estimé et la marge.</dd>
                  </div>
                )}
              </dl>

              {hasPrice && isLoss && (
                <p className="p-3 rounded-2xl bg-red-50 border border-brand-alert/30 text-sm font-semibold text-brand-alert flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Vous vendez à perte : le prix de vente est inférieur au coût de fabrication.</span>
                </p>
              )}

              <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg text-xs font-semibold text-brand-primary hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/40 [&::-webkit-details-marker]:hidden">
                  Voir le détail du calcul
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-3">
                  {hasPrice && breakdown.hasReliableMargin && (
                    <MarginGauge
                      sellingPrice={breakdown.sellingPrice}
                      calculatedUnitCost={breakdown.totalUnitCost}
                      grossMarginAmount={breakdown.grossMarginAmount}
                      grossMarginPercentage={breakdown.grossMarginPercentage}
                    />
                  )}
                  <CostBreakdownChart breakdown={breakdown} />
                </div>
              </details>
            </>
          )}
        </section>

        {saveError && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Footer, kept visible at the bottom of the scrollable modal body */}
        <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-4 bg-white border-t border-slate-100 flex items-center gap-2">
          {productToEdit?.id && (
            <button
              type="button"
              onClick={handleDelete}
              className="mr-auto p-2.5 rounded-xl text-sm text-brand-alert hover:text-brand-alertDark hover:bg-red-50 font-semibold flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-alert/30 transition-colors"
              aria-label="Supprimer le produit"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className={productToEdit?.id ? '' : 'ml-auto'}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="vibrant"
            size="md"
            isLoading={isSubmitting}
            icon={productToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {productToEdit ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
