import React from 'react';
import { AlertCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { SubscriptionStatusInfo } from '../../services/subscriptionService';

interface GracePeriodBannerProps {
  subscriptionInfo: SubscriptionStatusInfo;
  onPayNow: () => void;
}

export const GracePeriodBanner: React.FC<GracePeriodBannerProps> = ({
  subscriptionInfo,
  onPayNow
}) => {
  if (!subscriptionInfo.showGraceBanner) {
    return null;
  }

  return (
    <div className="w-full bg-[#E63946] text-white px-4 py-3 shadow-md border-b border-red-700 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-white/20 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              Votre période d'essai est terminée. Il vous reste <span className="font-black underline decoration-white/60 decoration-2">{subscriptionInfo.daysRemainingInGrace} jours</span> (date limite : {subscriptionInfo.graceDeadlineFormatted || 'Bientôt'}) pour souscrire à 5 000 FCFA/mois.
            </p>
            <p className="text-[11px] sm:text-xs text-red-100 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 inline text-cyan-200" />
              Passé ce délai, l'accès sera temporairement bloqué, mais <strong>TOUTES VOS DONNÉES SONT ET RESTERONT CONSERVÉES EN TOUTE SÉCURITÉ</strong>.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end md:self-center">
          <button
            onClick={onPayNow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-brand-navy hover:bg-red-50 font-display font-black text-sm shadow-sm transition-all duration-150 active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-brand-alert" />
            <span>Payer maintenant - 5 000 FCFA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
