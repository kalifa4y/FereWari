import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, CheckCircle2, CreditCard, Sparkles, Database } from 'lucide-react';
import { Button } from '../common/Button';

interface PaywallModalProps {
  isOpen: boolean;
  onOpenPayment: () => void;
  onOpenDevToggle?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onOpenPayment,
  onOpenDevToggle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-subtle/50 overflow-hidden text-center relative"
      >
        {/* Header Hero Gradient */}
        <div className="bg-ocean-gradient p-6 sm:p-8 text-white relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="w-8 h-8 text-brand-cyan" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-brand-alert text-white text-xs font-black uppercase tracking-wider mb-2">
            Période de grâce terminée
          </span>

          <h2 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight">
            Activez votre abonnement <br />
            <span className="text-brand-cyan">FereWari Pro</span>
          </h2>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-display font-black text-white">
            <span>5 000 FCFA</span>
            <span className="text-sm font-medium text-brand-subtle">/ mois</span>
          </div>
        </div>

        {/* Core Content & Reassurance */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Reassuring Data Safety Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                Vos données sont 100% conservées
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Toutes vos données (recettes, matières premières, clients, ventes) sont et resteront conservées en toute sécurité sur votre appareil. Rien n'a été perdu.
              </p>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="space-y-2.5 text-left text-xs sm:text-sm font-medium text-slate-700">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-vibrant shrink-0" />
              <span>Calcul illimité des coûts de revient unitaires (CRU) & marges</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-vibrant shrink-0" />
              <span>Saisie des ventes express & classement fidélité client</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-vibrant shrink-0" />
              <span>Fonctionnement 100% hors-ligne & sauvegarde Google Drive</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 space-y-2.5">
            <Button
              variant="alert"
              size="lg"
              className="w-full text-base font-display font-black shadow-lg shadow-red-500/25"
              icon={<CreditCard className="w-5 h-5" />}
              onClick={onOpenPayment}
            >
              Débloquer mon accès — 5 000 FCFA
            </Button>

            {onOpenDevToggle && (
              <button
                onClick={onOpenDevToggle}
                className="text-xs text-slate-400 hover:text-brand-navy flex items-center justify-center gap-1 mx-auto font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simuler un autre statut (Mode Démo)</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
