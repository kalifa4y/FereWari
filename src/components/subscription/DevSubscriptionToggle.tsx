import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { simulateSubscriptionState } from '../../services/subscriptionService';
import { Clock, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

interface DevSubscriptionToggleProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
}

export const DevSubscriptionToggle: React.FC<DevSubscriptionToggleProps> = ({
  isOpen,
  onClose,
  currentStatus
}) => {
  const handleSelect = async (state: 'trial' | 'grace_period' | 'active' | 'expired') => {
    await simulateSubscriptionState(state);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulateur de Cycle de Vie (Démo & Tests)"
      subtitle="Basculez instantanément entre les différents états de monétisation"
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Statut actuel détecté : <span className="font-bold text-brand-navy uppercase">{currentStatus}</span>. Sélectionnez un état pour tester le comportement de l'interface en direct :
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Trial */}
          <button
            onClick={() => handleSelect('trial')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
              currentStatus === 'trial'
                ? 'border-brand-cyan bg-brand-pale/50 shadow-sm'
                : 'border-slate-200 hover:border-brand-subtle'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-pale text-brand-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy">1. Période d'Essai Gratuit (15 jours)</h4>
                <p className="text-xs text-slate-500">Accès complet sans bannière d'alerte.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-primary">Activer</span>
          </button>

          {/* 2. Grace Period */}
          <button
            onClick={() => handleSelect('grace_period')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
              currentStatus === 'grace_period'
                ? 'border-brand-alert bg-red-50 shadow-sm'
                : 'border-slate-200 hover:border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-brand-alert">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy">2. Période de Grâce & Relance (10 jours)</h4>
                <p className="text-xs text-slate-500">Affiche la bannière rouge persistante avec compte à rebours.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-alert">Activer</span>
          </button>

          {/* 3. Expired / Paywall */}
          <button
            onClick={() => handleSelect('expired')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
              currentStatus === 'expired'
                ? 'border-brand-navy bg-slate-100 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200 text-brand-navy">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy">3. Paywall Bloquant (Expiré)</h4>
                <p className="text-xs text-slate-500">Bloque l'accès opérationnel et affiche l'écran rassurant.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-800">Activer</span>
          </button>

          {/* 4. Active */}
          <button
            onClick={() => handleSelect('active')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
              currentStatus === 'active'
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy">4. Abonnement Actif Payé</h4>
                <p className="text-xs text-slate-500">Validé pour 30 jours à 5 000 FCFA/mois.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">Activer</span>
          </button>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="md" className="w-full" onClick={onClose}>
            Fermer le simulateur
          </Button>
        </div>
      </div>
    </Modal>
  );
};
