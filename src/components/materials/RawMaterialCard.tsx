import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { RawMaterial } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { Layers, Edit3, AlertCircle } from 'lucide-react';

interface RawMaterialCardProps {
  material: RawMaterial;
  onEdit: (material: RawMaterial) => void;
}

export const RawMaterialCard: React.FC<RawMaterialCardProps> = ({ material, onEdit }) => {
  const isLowStock = material.stockQty > 0 && material.stockQty <= 5;

  return (
    <Card
      variant="default"
      interactive
      onClick={() => onEdit(material)}
      className="flex flex-col justify-between hover:border-brand-vibrant/40 group relative"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-pale text-brand-primary flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-black text-base sm:text-lg text-brand-navy leading-tight group-hover:text-brand-vibrant transition-colors truncate">
                {material.name}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Unité : <span className="font-bold text-slate-700">{material.unit}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(material);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors shrink-0"
            title="Modifier l'ingrédient"
            aria-label={`Modifier ${material.name}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Pricing & Stock values */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Prix d'achat</span>
            <span className="text-base font-display font-black text-brand-primary">
              {formatFCFA(material.unitCost)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium"> / {material.unit}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Stock actuel</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-display font-black text-slate-800">
                {material.stockQty} {material.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isLowStock && (
        <div className="mt-3">
          <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3 h-3 text-amber-700" />}>
            Stock faible ({material.stockQty} {material.unit})
          </Badge>
        </div>
      )}
    </Card>
  );
};
