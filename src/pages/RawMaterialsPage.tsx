import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, RawMaterial } from '../db/db';
import { RawMaterialCard } from '../components/materials/RawMaterialCard';
import { RawMaterialFormModal } from '../components/materials/RawMaterialFormModal';
import { Button } from '../components/common/Button';
import { Search, Plus, Layers } from 'lucide-react';

export const RawMaterialsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<RawMaterial | null>(null);

  const rawMaterials = useLiveQuery(() => db.rawMaterials.orderBy('name').toArray(), []) || [];

  const units = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach(m => { if (m.unit) set.add(m.unit); });
    return Array.from(set);
  }, [rawMaterials]);

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchUnit = unitFilter === 'all' || m.unit === unitFilter;
      return matchSearch && matchUnit;
    });
  }, [rawMaterials, search, unitFilter]);

  const handleOpenCreate = () => {
    setMaterialToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (material: RawMaterial) => {
    setMaterialToEdit(material);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy leading-tight">
            Ingrédients
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Enregistrez vos prix d'achat pour calculer le coût de fabrication de vos produits.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
          className="shadow-sm"
        >
          Ajouter un ingrédient
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ingrédient..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
          />
        </div>

        {/* Unit filter tags */}
        {units.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            <button
              onClick={() => setUnitFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                unitFilter === 'all'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tous ({rawMaterials.length})
            </button>
            {units.map(u => (
              <button
                key={u}
                onClick={() => setUnitFilter(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  unitFilter === u
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Materials Grid & Empty States */}
      {rawMaterials.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-pale text-brand-primary flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-black text-brand-navy">
            Aucun ingrédient enregistré
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Les ingrédients servent à calculer automatiquement le coût de fabrication de vos produits.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={handleOpenCreate}>
              Ajouter un ingrédient
            </Button>
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-display font-black text-brand-navy">
            Aucun ingrédient ne correspond à la recherche
          </h3>
          <p className="text-xs text-slate-500">
            Vérifiez l’orthographe ou réinitialisez les filtres.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setUnitFilter('all');
            }}
          >
            Effacer la recherche
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map(m => (
            <RawMaterialCard
              key={m.id}
              material={m}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <RawMaterialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        materialToEdit={materialToEdit}
      />
    </div>
  );
};
