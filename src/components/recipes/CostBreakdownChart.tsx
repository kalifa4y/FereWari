import React from 'react';
import { CalculationBreakdown, formatFCFA, formatPercent } from '../../services/calculationService';
import { Flame } from 'lucide-react';

interface CostBreakdownChartProps {
  breakdown: CalculationBreakdown;
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ breakdown }) => {
  const {
    rawMaterialsCost,
    packagingCost,
    transportCost,
    otherCosts,
    totalUnitCost,
    dominantCostItem
  } = breakdown;

  if (totalUnitCost === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        Ajoutez des matières premières ou des frais pour visualiser la décomposition du coût de revient.
      </div>
    );
  }

  const matPct = (rawMaterialsCost / totalUnitCost) * 100;
  const packPct = (packagingCost / totalUnitCost) * 100;
  const transPct = (transportCost / totalUnitCost) * 100;
  const otherPct = (otherCosts / totalUnitCost) * 100;

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-subtle/50 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
          Décomposition du Coût de Revient (CRU)
        </h4>
        <span className="text-xs font-black text-brand-primary">
          Total : {formatFCFA(totalUnitCost)}
        </span>
      </div>

      {/* Stacked Percentage Bar */}
      <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
        {matPct > 0 && (
          <div
            style={{ width: `${matPct}%` }}
            className="bg-brand-navy transition-all duration-300"
            title={`Matières premières : ${formatFCFA(rawMaterialsCost)} (${formatPercent(matPct)})`}
          />
        )}
        {packPct > 0 && (
          <div
            style={{ width: `${packPct}%` }}
            className="bg-brand-vibrant transition-all duration-300"
            title={`Emballage : ${formatFCFA(packagingCost)} (${formatPercent(packPct)})`}
          />
        )}
        {transPct > 0 && (
          <div
            style={{ width: `${transPct}%` }}
            className="bg-brand-cyan transition-all duration-300"
            title={`Transport : ${formatFCFA(transportCost)} (${formatPercent(transPct)})`}
          />
        )}
        {otherPct > 0 && (
          <div
            style={{ width: `${otherPct}%` }}
            className="bg-brand-cyanSoft transition-all duration-300"
            title={`Autres frais : ${formatFCFA(otherCosts)} (${formatPercent(otherPct)})`}
          />
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-navy shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-slate-500 font-medium">Ingrédients</p>
            <p className="font-bold text-slate-800">{formatFCFA(rawMaterialsCost)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-vibrant shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-slate-500 font-medium">Emballage</p>
            <p className="font-bold text-slate-800">{formatFCFA(packagingCost)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-slate-500 font-medium">Transport</p>
            <p className="font-bold text-slate-800">{formatFCFA(transportCost)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-cyanSoft shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-slate-500 font-medium">Autres frais</p>
            <p className="font-bold text-slate-800">{formatFCFA(otherCosts)}</p>
          </div>
        </div>
      </div>

      {/* Dominant Cost Highlight Badge */}
      {dominantCostItem && dominantCostItem.cost > 0 && (
        <div className="p-2.5 rounded-xl bg-brand-pale/40 border border-brand-subtle/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-slate-600 font-medium">Poste de dépense dominant :</span>
          </div>
          <span className="font-bold text-brand-navy">
            {dominantCostItem.name} ({formatPercent(dominantCostItem.percentage)} du CRU)
          </span>
        </div>
      )}
    </div>
  );
};
