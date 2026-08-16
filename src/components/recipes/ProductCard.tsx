import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Product, RawMaterial } from '../../db/db';
import { calculateProductCRU, formatFCFA, formatPercent } from '../../services/calculationService';
import { FlaskConical, Edit3, Flame, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  rawMaterialsMap: Map<number, RawMaterial>;
  onEdit: (product: Product) => void;
  onQuickSell?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rawMaterialsMap,
  onEdit,
  onQuickSell
}) => {
  const breakdown = calculateProductCRU(product, rawMaterialsMap);
  const isLoss = breakdown.grossMarginAmount < 0;

  return (
    <Card
      variant="default"
      interactive
      onClick={() => onEdit(product)}
      className="flex flex-col justify-between hover:border-brand-vibrant/40 group relative"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 text-brand-primary flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-lg text-brand-navy leading-tight group-hover:text-brand-vibrant transition-colors">
                {product.name}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {product.ingredients?.length || 0} ingrédient(s)
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
            title="Modifier la fiche recette"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Pricing Metrics */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-left">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Prix Vente</span>
            <span className="text-base font-display font-black text-brand-navy">
              {formatFCFA(product.sellingPrice)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">CRU (Coût)</span>
            <span className="text-base font-display font-black text-slate-600">
              {formatFCFA(breakdown.totalUnitCost)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Marge</span>
            <div className="flex items-center gap-1">
              <span className={`text-base font-display font-black ${isLoss ? 'text-brand-alert' : 'text-emerald-700'}`}>
                {formatFCFA(breakdown.grossMarginAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Profitability Badge & Dominant Cost */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge
            variant={isLoss ? 'alert' : breakdown.grossMarginPercentage >= 50 ? 'cyan' : 'blue'}
            size="sm"
            icon={isLoss ? <AlertTriangle className="w-3 h-3 text-brand-alert" /> : <TrendingUp className="w-3 h-3" />}
          >
            Marge : {formatPercent(breakdown.grossMarginPercentage)}
          </Badge>

          {breakdown.dominantCostItem && breakdown.dominantCostItem.cost > 0 && (
            <Badge variant="neutral" size="sm" icon={<Flame className="w-3 h-3 text-amber-500" />}>
              Dominant : {breakdown.dominantCostItem.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Sell CTA */}
      {onQuickSell && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickSell(product);
            }}
            className="w-full py-2 px-3 rounded-xl bg-brand-pale text-brand-navy hover:bg-brand-subtle font-display font-black text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>⚡ Enregistrer une vente rapide</span>
          </button>
        </div>
      )}
    </Card>
  );
};
