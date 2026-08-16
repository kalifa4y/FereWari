import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, RawMaterial } from '../db/db';
import { ProductCard } from '../components/recipes/ProductCard';
import { ProductFormModal } from '../components/recipes/ProductFormModal';
import { Button } from '../components/common/Button';
import { Search, Plus, FlaskConical } from 'lucide-react';

interface RecipesPageProps {
  onQuickSell?: (product: Product) => void;
}

export const RecipesPage: React.FC<RecipesPageProps> = ({ onQuickSell }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), []) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray(), []) || [];

  const rawMaterialsMap = useMemo(() => {
    const map = new Map<number, RawMaterial>();
    rawMaterials.forEach(m => { if (m.id) map.set(m.id, m); });
    return map;
  }, [rawMaterials]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase().trim()));
  }, [products, search]);

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy leading-tight">
            Fiches Recettes & Produits Finis (BOM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Composition de vos produits, calcul automatique du Coût de Revient Unitaire (CRU) et des marges
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
          className="shadow-sm"
        >
          Nouvelle Fiche Recette
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une recette / produit..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 text-brand-primary flex items-center justify-center mx-auto">
            <FlaskConical className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-display font-black text-brand-navy">
            Aucune fiche recette créée
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Créez votre première recette en associant vos matières premières pour découvrir votre véritable marge de rentabilité.
          </p>
          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            Créer une fiche recette
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              rawMaterialsMap={rawMaterialsMap}
              onEdit={handleOpenEdit}
              onQuickSell={onQuickSell}
            />
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
        rawMaterials={rawMaterials}
      />
    </div>
  );
};
