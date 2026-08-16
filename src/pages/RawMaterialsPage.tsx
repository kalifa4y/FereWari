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
            Matières Premières & Intrants
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Enregistrez les prix d'achat unitaires et suivez vos stocks pour vos fiches recettes
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
          className="shadow-sm"
        >
          Nouvelle Matière Première
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
            placeholder="Rechercher une matière..."
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
              Toutes les unités ({rawMaterials.length})
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

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-pale text-brand-primary flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-display font-black text-brand-navy">
            Aucune matière première trouvée
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ajoutez vos premiers intrants (fleurs d'hibiscus, sucre, huiles, bouteilles) pour commencer à composer vos recettes.
          </p>
          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            Ajouter une matière première
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
