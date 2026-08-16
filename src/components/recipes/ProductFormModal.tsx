import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Product, RecipeItem, RawMaterial, db } from '../../db/db';
import { calculateProductCRU, formatFCFA } from '../../services/calculationService';
import { CostBreakdownChart } from './CostBreakdownChart';
import { MarginGauge } from './MarginGauge';
import { Plus, Trash2, Save, FlaskConical } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  rawMaterials: RawMaterial[];
}

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
  const [error, setError] = useState<string | null>(null);

  // Map of raw materials for fast O(1) lookup
  const materialsMap = useMemo(() => {
    const map = new Map<number, RawMaterial>();
    rawMaterials.forEach(m => {
      if (m.id) map.set(m.id, m);
    });
    return map;
  }, [rawMaterials]);

  useEffect(() => {
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
      // Default to 1 blank ingredient if materials exist
      if (rawMaterials.length > 0 && rawMaterials[0].id) {
        setIngredients([{ rawMaterialId: rawMaterials[0].id, quantity: 1 }]);
      } else {
        setIngredients([]);
      }
    }
    setError(null);
  }, [productToEdit, isOpen, rawMaterials]);

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

  const handleAddIngredient = () => {
    if (rawMaterials.length === 0) {
      setError('Vous devez d\'abord créer des matières premières.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom du produit fini.');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) <= 0) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Modifier la Fiche Recette' : 'Nouvelle Fiche Recette & Produit Fini'}
      subtitle="Assemblez les ingrédients et frais annexes pour calculer instantanément votre Coût de Revient Unitaire (CRU)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-brand-alert/30 text-xs font-semibold text-brand-alert">
            {error}
          </div>
        )}

        {/* 1. Basic Product Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom du produit fini"
            placeholder="Ex: Jus de Bissap Menthe 33cl, Baume Karité..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            label="Prix de Vente Conseillé"
            type="number"
            min="0"
            step="any"
            placeholder="Ex: 700"
            suffix="FCFA"
            value={sellingPrice}
            onChange={e => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
            required
          />
        </div>

        {/* 2. Recipe Items / BOM Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-brand-vibrant" />
                Matières Premières Consommées (BOM)
              </h4>
              <p className="text-[11px] text-slate-500">
                Quantité d'ingrédients nécessaire pour fabriquer 1 seule unité
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddIngredient}
              disabled={rawMaterials.length === 0}
              className="text-xs font-bold text-brand-vibrant hover:text-brand-navy flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-pale hover:bg-brand-subtle transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un ingrédient</span>
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              Aucun ingrédient ajouté pour le moment. Cliquez sur "Ajouter un ingrédient".
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ingredients.map((item, idx) => {
                const material = materialsMap.get(item.rawMaterialId);
                const subtotal = material ? (Number(item.quantity) || 0) * material.unitCost : 0;

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    {/* Material Select */}
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={item.rawMaterialId}
                        onChange={e => handleIngredientChange(idx, 'rawMaterialId', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-brand-vibrant focus:outline-none"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatFCFA(m.unitCost)} / {m.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative w-28 sm:w-24">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Qté"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 pr-8 focus:border-brand-vibrant focus:outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold">
                          {material?.unit || 'u'}
                        </span>
                      </div>

                      {/* Subtotal */}
                      <span className="text-xs font-bold text-brand-navy shrink-0 min-w-[70px] text-right">
                        = {formatFCFA(subtotal)}
                      </span>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-brand-alert hover:bg-red-50 transition-colors shrink-0"
                        title="Retirer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Additional Overheads Section */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
            Frais Annexes & Charges de Fabrication par unité
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Emballage / Conditionnement"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={packagingCost}
              onChange={e => setPackagingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Bouteille, bouchon, étiquette, sachet..."
            />

            <Input
              label="Transport & Livraison"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={transportCost}
              onChange={e => setTransportCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Frais de transport par unité"
            />

            <Input
              label="Autres frais / Main d'œuvre"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              suffix="FCFA"
              value={otherCosts}
              onChange={e => setOtherCosts(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Main d'œuvre, énergie..."
            />
          </div>
        </div>

        {/* 4. Live CRU & Margin Preview Gauges */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <MarginGauge
            sellingPrice={Number(sellingPrice) || 0}
            calculatedUnitCost={breakdown.totalUnitCost}
            grossMarginAmount={breakdown.grossMarginAmount}
            grossMarginPercentage={breakdown.grossMarginPercentage}
          />

          <CostBreakdownChart breakdown={breakdown} />
        </div>

        {/* 5. Actions */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
          {productToEdit?.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-brand-alert hover:text-brand-alertDark font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer la recette</span>
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
              {productToEdit ? 'Enregistrer les modifications' : 'Créer la fiche recette'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
