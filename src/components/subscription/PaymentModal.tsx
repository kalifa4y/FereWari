import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { activateSubscription, MONTHLY_PRICE_FCFA } from '../../services/subscriptionService';
import { CheckCircle2, ShieldCheck, Smartphone, PhoneCall } from 'lucide-react';
import { formatFCFA } from '../../services/calculationService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [provider, setProvider] = useState<'wave' | 'orange' | 'card'>('wave');
  const [phone, setPhone] = useState('+221 77 123 45 67');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate mobile money payment prompt delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Activate subscription for 30 days
      await activateSubscription(30);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        onClose();
        if (onPaymentSuccess) onPaymentSuccess();
      }, 1800);
    } catch (err) {
      console.error('Payment error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paiement Sécurisé de l'Abonnement"
      subtitle={`FereWari Pro — ${formatFCFA(MONTHLY_PRICE_FCFA)} / mois`}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-display font-black text-brand-navy">
            Paiement Validé avec Succès !
          </h3>
          <p className="text-sm text-slate-600">
            Votre abonnement FereWari Pro est activé pour 30 jours. Merci pour votre confiance !
          </p>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
              Choisissez votre moyen de paiement
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Wave */}
              <button
                type="button"
                onClick={() => setProvider('wave')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                  provider === 'wave'
                    ? 'border-brand-vibrant bg-brand-pale/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#1DC3F2] flex items-center justify-center text-white font-black text-xs shrink-0">
                  W
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-navy">Wave</p>
                  <p className="text-[10px] text-slate-500">Sans frais</p>
                </div>
              </button>

              {/* Orange Money */}
              <button
                type="button"
                onClick={() => setProvider('orange')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                  provider === 'orange'
                    ? 'border-brand-vibrant bg-brand-pale/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#FF6600] flex items-center justify-center text-white font-black text-xs shrink-0">
                  OM
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-navy">Orange Money</p>
                  <p className="text-[10px] text-slate-500">Validation code</p>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Money Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
              Numéro de téléphone {provider === 'wave' ? 'Wave' : 'Orange Money'}
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+221 7X XXX XX XX"
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Une notification de débit sera envoyée directement sur votre téléphone.
            </p>
          </div>

          {/* Amount summary box */}
          <div className="bg-brand-bg rounded-2xl p-4 border border-brand-subtle/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Montant total à payer :</span>
            <span className="text-xl font-display font-black text-brand-navy">
              {formatFCFA(MONTHLY_PRICE_FCFA)}
            </span>
          </div>

          {/* Submit CTA */}
          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              variant="vibrant"
              size="lg"
              className="w-full font-display font-black text-base shadow-md"
              isLoading={isProcessing}
              icon={<PhoneCall className="w-4 h-4" />}
            >
              {isProcessing ? 'Envoi de la demande...' : `Confirmer et Payer ${formatFCFA(MONTHLY_PRICE_FCFA)}`}
            </Button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paiement crypté & instantané. Annulable à tout moment.</span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
