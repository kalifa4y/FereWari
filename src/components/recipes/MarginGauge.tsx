import React from 'react';
import { formatFCFA, formatPercent } from '../../services/calculationService';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface MarginGaugeProps {
  sellingPrice: number;
  calculatedUnitCost: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
}

export const MarginGauge: React.FC<MarginGaugeProps> = ({
  sellingPrice,
  calculatedUnitCost,
  grossMarginAmount,
  grossMarginPercentage
}) => {
  const isLoss = grossMarginAmount < 0;
  const isLow = grossMarginPercentage < 25 && !isLoss;
  const isGood = grossMarginPercentage >= 25 && grossMarginPercentage < 50;
  const isExcellent = grossMarginPercentage >= 50;

  return (
    <div className={clsx(
      'rounded-2xl p-4 border transition-all',
      isLoss ? 'bg-red-50 border-brand-alert/40 text-brand-alert' :
      isLow ? 'bg-amber-50 border-amber-300 text-amber-900' :
      isGood ? 'bg-brand-pale/50 border-brand-subtle text-brand-navy' :
      'bg-emerald-50 border-emerald-300 text-emerald-900'
    )}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Prix de Vente
          </span>
          <span className="text-xl font-display font-black text-brand-navy">
            {formatFCFA(sellingPrice)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Coût de Revient (CRU)
          </span>
          <span className="text-xl font-display font-black text-slate-700">
            {formatFCFA(calculatedUnitCost)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Marge Brute (Gain)
          </span>
          <span className={clsx('text-xl font-display font-black', isLoss ? 'text-brand-alert' : 'text-emerald-700')}>
            {formatFCFA(grossMarginAmount)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Taux de Marge
          </span>
          <div className="flex items-center justify-center sm:justify-start gap-1">
            {isLoss ? (
              <AlertTriangle className="w-4 h-4 text-brand-alert shrink-0" />
            ) : isExcellent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-brand-vibrant shrink-0" />
            )}
            <span className={clsx('text-xl font-display font-black', isLoss ? 'text-brand-alert' : isLow ? 'text-amber-700' : 'text-emerald-700')}>
              {formatPercent(grossMarginPercentage)}
            </span>
          </div>
        </div>
      </div>

      {isLoss && (
        <div className="mt-2.5 pt-2 border-t border-red-200 text-xs font-bold text-brand-alert flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Attention : vous vendez à perte ! Votre prix de vente est inférieur à votre coût de fabrication.</span>
        </div>
      )}
    </div>
  );
};
